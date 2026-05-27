import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { SupplierOrderVoucher, OrderType } from '../../domain/entities/SupplierOrderVoucher';
import { Account } from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { CreateSupplierOrderDTO } from './CreateSupplierOrderUseCase';

export class UpdateSupplierOrderUseCase {
  async execute(
    voucherId: string,
    dto: CreateSupplierOrderDTO,
  ): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch the existing voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');

      const svRepo = em.getRepository(SupplierOrderVoucher);
      const accountRepo = em.getRepository(Account);
      const sv = await svRepo.findOne({ where: { voucherId } });

      const companySettingsRepo = em.getRepository(CompanySetting);
      const settings = await companySettingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) throw new Error('Company settings not found.');

      const defaultCashAccountId = settings.defaultContraCashLedgerId;
      const defaultGoldAccountId = settings.defaultContraGoldLedgerId;

      // 1.1 Check Freeze Date for existing accounts at the OLD date
      if (sv) {
        const oldPartyAccount = await accountRepo.findOne({ where: { id: sv.accountId } });
        if (oldPartyAccount) Account.validateFreezeDate(oldPartyAccount, voucher.entryDate);

        const oldCashAccount = await accountRepo.findOne({ where: { id: defaultCashAccountId } });
        if (oldCashAccount) Account.validateFreezeDate(oldCashAccount, voucher.entryDate);

        const oldGoldAccount = await accountRepo.findOne({ where: { id: defaultGoldAccountId } });
        if (oldGoldAccount) Account.validateFreezeDate(oldGoldAccount, voucher.entryDate);
      }

      // 2. Validate supplier account
      const supplierAccount = await accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!supplierAccount) throw new Error('Supplier account not found.');

      Account.validateFreezeDate(supplierAccount, dto.entryDate);

      if (!defaultCashAccountId || !defaultGoldAccountId) {
        throw new Error('Default Cash or Gold accounts are not configured.');
      }

      const newCashAccount = await accountRepo.findOne({ where: { id: defaultCashAccountId } });
      const newGoldAccount = await accountRepo.findOne({ where: { id: defaultGoldAccountId } });

      if (newCashAccount) Account.validateFreezeDate(newCashAccount, dto.entryDate);
      if (newGoldAccount) Account.validateFreezeDate(newGoldAccount, dto.entryDate);

      let narration = '';
      if (dto.narration?.trim()) {
        narration = dto.narration.trim();
      } else {
        narration = `Supplier Order (${dto.orderType}) for ${supplierAccount.name}`;
      }

      // 4. Update the voucher header
      voucher.entryDate = dto.entryDate;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      await voucherRepo.save(voucher);

      // 5. Update the SupplierOrderVoucher record
      if (!sv) throw new Error('Supplier order details not found.');

      sv.orderType = dto.orderType as OrderType;
      sv.accountId = dto.accountId;
      sv.itemId = dto.itemId;
      sv.goldWeight = dto.goldWeight || 0;
      sv.goldRate = dto.goldRate || 0;
      sv.amount = dto.amount || 0;
      if (dto.orderStatus) {
        sv.orderStatus = dto.orderStatus;
      }
      await svRepo.save(sv);

      // 6. Handle Ledger Entries (Wipe and Recreate)
      const jeRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);

      const existingJE = await jeRepo.findOne({ where: { voucherId: voucher.id } });
      if (existingJE) {
        await ledgerRepo.delete({ journalEntryId: existingJE.id });
        await jeRepo.delete({ id: existingJE.id });
      }

      // If the voucher is now POSTED, create fresh accounting data
      if (dto.action === 'POST') {
        const je = new JournalEntry();
        je.voucherId = voucher.id;
        je.entryDate = dto.entryDate;
        je.narration = narration;
        je.sourceReference = voucher.id;
        je.status = JournalEntryStatus.POSTED;
        const savedJE = await em.save(je);

        const entries: LedgerEntry[] = [];
        const amount = dto.amount || 0;
        const goldWeight = dto.goldWeight || 0;

        if (dto.orderType === 'BUY') {
          // Dr. Amount from the default cash account.
          // Cr. Amount from the Supplier's account.
          // Cr. Gold from the default gold account.
          // Dr. Gold from the supplier's account.
          if (amount > 0) {
            const cashDr = new LedgerEntry();
            cashDr.accountId = defaultCashAccountId;
            cashDr.debitAmount = amount;
            cashDr.creditAmount = 0;
            cashDr.narration = `Buy Order Amount - ${voucher.voucherNo}`;
            cashDr.journalEntry = savedJE;
            entries.push(cashDr);

            const supplierCr = new LedgerEntry();
            supplierCr.accountId = dto.accountId;
            supplierCr.debitAmount = 0;
            supplierCr.creditAmount = amount;
            supplierCr.narration = `Buy Order Amount Contra - ${voucher.voucherNo}`;
            supplierCr.journalEntry = savedJE;
            entries.push(supplierCr);
          }
          if (goldWeight > 0) {
            const goldCr = new LedgerEntry();
            goldCr.accountId = defaultGoldAccountId;
            goldCr.debitAmount = 0;
            goldCr.creditAmount = 0;
            goldCr.debitGold = 0;
            goldCr.creditGold = goldWeight;
            goldCr.narration = `Buy Order Gold - ${voucher.voucherNo}`;
            goldCr.journalEntry = savedJE;
            entries.push(goldCr);

            const supplierDr = new LedgerEntry();
            supplierDr.accountId = dto.accountId;
            supplierDr.debitAmount = 0;
            supplierDr.creditAmount = 0;
            supplierDr.debitGold = goldWeight;
            supplierDr.creditGold = 0;
            supplierDr.narration = `Buy Order Gold Contra - ${voucher.voucherNo}`;
            supplierDr.journalEntry = savedJE;
            entries.push(supplierDr);
          }
        } else {
          // Dr. Gold from the default gold account.
          // Cr. Gold from the supplier's account.
          // Cr. Amount from the default Cash account.
          // Dr. Amount from the supplier's account.
          if (amount > 0) {
            const cashCr = new LedgerEntry();
            cashCr.accountId = defaultCashAccountId;
            cashCr.debitAmount = 0;
            cashCr.creditAmount = amount;
            cashCr.narration = `Sell Order Amount - ${voucher.voucherNo}`;
            cashCr.journalEntry = savedJE;
            entries.push(cashCr);

            const supplierDr = new LedgerEntry();
            supplierDr.accountId = dto.accountId;
            supplierDr.debitAmount = amount;
            supplierDr.creditAmount = 0;
            supplierDr.narration = `Sell Order Amount Contra - ${voucher.voucherNo}`;
            supplierDr.journalEntry = savedJE;
            entries.push(supplierDr);
          }
          if (goldWeight > 0) {
            const goldDr = new LedgerEntry();
            goldDr.accountId = defaultGoldAccountId;
            goldDr.debitAmount = 0;
            goldDr.creditAmount = 0;
            goldDr.debitGold = goldWeight;
            goldDr.creditGold = 0;
            goldDr.narration = `Sell Order Gold - ${voucher.voucherNo}`;
            goldDr.journalEntry = savedJE;
            entries.push(goldDr);

            const supplierCr = new LedgerEntry();
            supplierCr.accountId = dto.accountId;
            supplierCr.debitAmount = 0;
            supplierCr.creditAmount = 0;
            supplierCr.debitGold = 0;
            supplierCr.creditGold = goldWeight;
            supplierCr.narration = `Sell Order Gold Contra - ${voucher.voucherNo}`;
            supplierCr.journalEntry = savedJE;
            entries.push(supplierCr);
          }
        }

        if (entries.length > 0) {
          await em.save(LedgerEntry, entries);
        }
      }

      return { success: true, voucherNo: voucher.voucherNo };
    });
  }
}
