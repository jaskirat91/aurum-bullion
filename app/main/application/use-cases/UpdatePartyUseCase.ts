import { AppDataSource } from '../../infrastructure/database/data-source';
import { Party, BalanceType, PartyType } from '../../domain/entities/Party';
import { Account, AccountSubtype, AccountType } from '../../domain/entities/Account';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';

export interface UpdatePartyDTO {
  id: string;
  name?: string;
  type?: PartyType;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  gstNumber?: string;
  is_active?: boolean;
  groupId?: string;
  openingGoldBalance?: number;
  openingGoldBalanceType?: 'DR' | 'CR';
  openingAmountBalance?: number;
  openingAmountBalanceType?: 'DR' | 'CR';
}

export class UpdatePartyUseCase {
  async execute(dto: UpdatePartyDTO): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const partyRepo = queryRunner.manager.getRepository(Party);
      const accountRepo = queryRunner.manager.getRepository(Account);

      const party = await partyRepo.findOne({ where: { id: dto.id } });
      if (!party) throw new Error('Party not found');

      // Update Party Properties
      if (dto.name !== undefined) party.name = dto.name;
      if (dto.type !== undefined) {
        party.type = dto.type;
      }
      if (dto.phone !== undefined) {
        party.phone = dto.phone;
      } else {
        party.phone = null!;
      }
      if (dto.email !== undefined) {
        party.email = dto.email;
      } else {
        party.email = null!;
      }
      if (dto.address !== undefined) {
        party.address_line1 = dto.address;
      } else {
        party.address_line1 = null!;
      }
      if (dto.city !== undefined) {
        party.city = dto.city;
      } else {
        party.city = null!;
      }
      if (dto.gstNumber !== undefined) {
        party.gst_number = dto.gstNumber;
      } else {
        party.gst_number = null!;
      }
      if (dto.is_active !== undefined) {
        party.is_active = dto.is_active;
      }

      await partyRepo.save(party);

      // Update Opening Balances if provided
      const obGChanged =
        dto.openingGoldBalance !== undefined || dto.openingGoldBalanceType !== undefined;
      const obAChanged =
        dto.openingAmountBalance !== undefined || dto.openingAmountBalanceType !== undefined;

      if (obGChanged || obAChanged) {
        if (dto.openingGoldBalance !== undefined)
          party.opening_gold_balance = dto.openingGoldBalance;
        if (dto.openingGoldBalanceType !== undefined)
          party.opening_gold_balance_type = dto.openingGoldBalanceType as BalanceType;
        if (dto.openingAmountBalance !== undefined)
          party.opening_amount_balance = dto.openingAmountBalance;
        if (dto.openingAmountBalanceType !== undefined)
          party.opening_amount_balance_type = dto.openingAmountBalanceType as BalanceType;

        await partyRepo.save(party);

        // Update or Create the OB Voucher
        const voucherRepo = queryRunner.manager.getRepository(Voucher);
        const journalRepo = queryRunner.manager.getRepository(JournalEntry);
        const ledgerRepo = queryRunner.manager.getRepository(LedgerEntry);
        const settingsRepo = queryRunner.manager.getRepository(CompanySetting);

        const voucherNo = `OB-${party.code}`;
        let voucher = await voucherRepo.findOne({ where: { voucherNo } });

        if (voucher) {
          const je = await journalRepo.findOne({ where: { voucherId: voucher.id } });
          if (je) {
            await ledgerRepo.delete({ journalEntryId: je.id });
          } else {
            const newJE = journalRepo.create({
              entryDate: voucher.entryDate,
              voucherId: voucher.id,
              narration: voucher.narration,
              status: JournalEntryStatus.POSTED,
            });
            await journalRepo.save(newJE);
          }
        } else {
          const entryDate = new Date().toISOString().split('T')[0];
          const narration = `Opening balance for ${party.name}`;
          voucher = voucherRepo.create({
            type: VoucherType.JOURNAL,
            voucherNo,
            entryDate,
            narration,
            status: VoucherStatus.POSTED,
          });
          voucher = await voucherRepo.save(voucher);

          const journalEntry = journalRepo.create({
            entryDate,
            voucherId: voucher.id,
            narration,
            status: JournalEntryStatus.POSTED,
          });
          await journalRepo.save(journalEntry);
        }

        const je = await journalRepo.findOne({ where: { voucherId: voucher.id } });
        if (!je) throw new Error('Could not find or create Journal Entry for Opening Balance');

        const settings = await settingsRepo.findOne({ where: { id: 'current' } });
        if (!settings) throw new Error('Company settings not found');

        const hasGoldOB = party.opening_gold_balance > 0;
        const hasAmountOB = party.opening_amount_balance > 0;

        if (hasGoldOB) {
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: je.id,
              accountId: party.ledger_account_id,
              debitGold: party.opening_gold_balance_type === 'DR' ? party.opening_gold_balance : 0,
              creditGold: party.opening_gold_balance_type === 'CR' ? party.opening_gold_balance : 0,
              debitAmount: 0,
              creditAmount: 0,
              narration: 'Opening gold balance (Updated)',
            }),
          );

          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: je.id,
              accountId: settings.defaultGoldLedgerId,
              debitGold: party.opening_gold_balance_type === 'CR' ? party.opening_gold_balance : 0,
              creditGold: party.opening_gold_balance_type === 'DR' ? party.opening_gold_balance : 0,
              debitAmount: 0,
              creditAmount: 0,
              narration: 'Opening gold balance offset (Updated)',
            }),
          );
        }

        if (hasAmountOB) {
          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: je.id,
              accountId: party.ledger_account_id,
              debitGold: 0,
              creditGold: 0,
              debitAmount:
                party.opening_amount_balance_type === 'DR' ? party.opening_amount_balance : 0,
              creditAmount:
                party.opening_amount_balance_type === 'CR' ? party.opening_amount_balance : 0,
              narration: 'Opening amount balance (Updated)',
            }),
          );

          await ledgerRepo.save(
            ledgerRepo.create({
              journalEntryId: je.id,
              accountId: settings.defaultCashLedgerId,
              debitGold: 0,
              creditGold: 0,
              debitAmount:
                party.opening_amount_balance_type === 'CR' ? party.opening_amount_balance : 0,
              creditAmount:
                party.opening_amount_balance_type === 'DR' ? party.opening_amount_balance : 0,
              narration: 'Opening amount balance offset (Updated)',
            }),
          );
        }
      }

      // Sync name with Ledger Account if it changed
      const account = await accountRepo.findOne({ where: { id: party.ledger_account_id } });
      if (dto.name !== undefined && party.ledger_account_id) {
        if (account) {
          account.name = `Party: ${dto.name}`;
        }

        if (dto.groupId !== undefined && account) {
          account.parent_id = dto.groupId || null!;
        }
        if (account) {
          await accountRepo.save(account);
        }
      } else if (dto.groupId !== undefined && party.ledger_account_id) {
        const account = await accountRepo.findOne({ where: { id: party.ledger_account_id } });
        if (account) {
          account.parent_id = dto.groupId || null!;
          await accountRepo.save(account);
        }
      }
      if (dto.type !== undefined && party.ledger_account_id) {
        if (account) {
          account.account_type =
            dto.type === PartyType.CUSTOMER ? AccountType.ASSET : AccountType.LIABILITY;
          account.account_subtype =
            dto.type === PartyType.CUSTOMER ? AccountSubtype.RECEIVABLE : AccountSubtype.PAYABLE;
          await accountRepo.save(account);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
