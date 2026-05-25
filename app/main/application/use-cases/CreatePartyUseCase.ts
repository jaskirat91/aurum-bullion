import { AppDataSource } from '../../infrastructure/database/data-source';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party, BalanceType, PartyType } from '../../domain/entities/Party';
import {
  Account,
  AccountType,
  NormalBalance,
  AccountUnit,
  AccountSubtype,
} from '../../domain/entities/Account';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';

export interface CreatePartyDTO {
  name: string;
  code: string;
  type: PartyType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  gstNumber?: string;
  openingGoldBalance?: number;
  openingGoldBalanceType?: 'DR' | 'CR';
  openingAmountBalance?: number;
  openingAmountBalanceType?: 'DR' | 'CR';
  groupId?: string; // Account parent ID
}

export class CreatePartyUseCase {
  async execute(dto: CreatePartyDTO): Promise<{ partyId: string }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const partyRepo = queryRunner.manager.getRepository(Party);
      const accountRepo = queryRunner.manager.getRepository(Account);
      const journalRepo = queryRunner.manager.getRepository(JournalEntry);
      const ledgerRepo = queryRunner.manager.getRepository(LedgerEntry);

      const existingParty = await partyRepo.findOne({
        where: {
          type: dto.type,
          name: dto.name,
        },
      });
      if (existingParty) {
        throw new Error(`A ${dto.type} with same name (${dto.name}) already exists!`);
      }

      // 1. Create the Party's Ledger Account
      const account = accountRepo.create({
        name: `Party: ${dto.name}`,
        code: `P-${dto.code}`,
        account_type: dto.type === PartyType.CUSTOMER ? AccountType.ASSET : AccountType.LIABILITY,
        account_subtype:
          dto.type === PartyType.CUSTOMER ? AccountSubtype.RECEIVABLE : AccountSubtype.PAYABLE,
        // Default normal balance based on type or just DR as placeholder
        normal_balance: NormalBalance.DR,
        unit: AccountUnit.GRAM,
        parent_id: dto.groupId || null!,
        is_group: false,
        is_system: false,
        is_active: true,
      });
      const savedAccount = await accountRepo.save(account);

      // 2. Create the Party entity
      const party = partyRepo.create({
        name: dto.name,
        code: dto.code,
        type: dto.type,
        phone: dto.phone,
        email: dto.email,
        address_line1: dto.address,
        city: dto.city,
        gst_number: dto.gstNumber,
        ledger_account_id: savedAccount.id,
        opening_gold_balance: dto.openingGoldBalance || 0,
        opening_gold_balance_type: (dto.openingGoldBalanceType as BalanceType) || BalanceType.DR,
        opening_amount_balance: dto.openingAmountBalance || 0,
        opening_amount_balance_type:
          (dto.openingAmountBalanceType as BalanceType) || BalanceType.DR,
        is_active: true,
      });
      const savedParty = await partyRepo.save(party);

      // 3. Create Opening Balance Transaction
      const hasGoldOB = (dto.openingGoldBalance || 0) > 0;
      const hasAmountOB = (dto.openingAmountBalance || 0) > 0;

      if (hasGoldOB || hasAmountOB) {
        // Fetch default accounts
        const settingsRepo = queryRunner.manager.getRepository(CompanySetting);
        const settings = await settingsRepo.findOne({ where: { id: 'current' } });
        if (!settings) throw new Error('Company settings not found');

        const entryDate = new Date().toISOString().split('T')[0];
        const narration = `Opening balance for ${dto.name}`;
        const voucher = new Voucher();
        voucher.type = VoucherType.JOURNAL;
        voucher.voucherNo = `OB-${dto.code}`;
        voucher.entryDate = entryDate;
        voucher.narration = narration;
        voucher.status = VoucherStatus.POSTED;
        const savedVoucher = await queryRunner.manager.save(voucher);

        const journalEntry = journalRepo.create({
          entryDate,
          voucherId: savedVoucher.id,
          narration,
          status: JournalEntryStatus.POSTED,
        });
        const savedJE = await journalRepo.save(journalEntry);
        const jeId = Array.isArray(savedJE) ? savedJE[0].id : savedJE.id;

        // 1. Gold Part (if exists)
        if (hasGoldOB) {
          // Party Gold Entry
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: jeId,
              accountId: savedAccount.id,
              debitGold: dto.openingGoldBalanceType === 'DR' ? dto.openingGoldBalance : 0,
              creditGold: dto.openingGoldBalanceType === 'CR' ? dto.openingGoldBalance : 0,
              debitAmount: 0,
              creditAmount: 0,
              narration: 'Opening gold balance',
            }),
          );

          // Gold Offset Entry
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: jeId,
              accountId: settings.defaultGoldLedgerId,
              debitGold: dto.openingGoldBalanceType === 'CR' ? dto.openingGoldBalance : 0,
              creditGold: dto.openingGoldBalanceType === 'DR' ? dto.openingGoldBalance : 0,
              debitAmount: 0,
              creditAmount: 0,
              narration: 'Opening gold balance offset',
            }),
          );
        }

        // 2. Amount Part (if exists)
        if (hasAmountOB) {
          // Party Amount Entry
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: jeId,
              accountId: savedAccount.id,
              debitGold: 0,
              creditGold: 0,
              debitAmount: dto.openingAmountBalanceType === 'DR' ? dto.openingAmountBalance : 0,
              creditAmount: dto.openingAmountBalanceType === 'CR' ? dto.openingAmountBalance : 0,
              narration: 'Opening amount balance',
            }),
          );

          // Cash Offset Entry
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: jeId,
              accountId: settings.defaultCashLedgerId,
              debitGold: 0,
              creditGold: 0,
              debitAmount: dto.openingAmountBalanceType === 'CR' ? dto.openingAmountBalance : 0,
              creditAmount: dto.openingAmountBalanceType === 'DR' ? dto.openingAmountBalance : 0,
              narration: 'Opening amount balance offset',
            }),
          );
        }
      }

      await queryRunner.commitTransaction();
      return { partyId: savedParty.id };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
