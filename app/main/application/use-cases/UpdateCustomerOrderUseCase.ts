import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { CustomerOrderVoucher, OrderType } from '../../domain/entities/CustomerOrderVoucher';
import { Account } from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { CreateCustomerOrderDTO } from './CreateCustomerOrderUseCase';

export class UpdateCustomerOrderUseCase {
  async execute(
    voucherId: string,
    dto: CreateCustomerOrderDTO,
  ): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch the existing voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');

      const cvRepo = em.getRepository(CustomerOrderVoucher);
      const accountRepo = em.getRepository(Account);
      const cv = await cvRepo.findOne({ where: { voucherId } });

      const companySettingsRepo = em.getRepository(CompanySetting);
      const settings = await companySettingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) throw new Error('Company settings not found.');

      const defaultCashAccountId = settings.defaultCashLedgerId;
      const defaultGoldAccountId = settings.defaultGoldLedgerId;

      // 1.1 Check Freeze Date for existing accounts at the OLD date
      if (cv) {
        const oldPartyAccount = await accountRepo.findOne({ where: { id: cv.accountId } });
        if (oldPartyAccount) Account.validateFreezeDate(oldPartyAccount, voucher.entryDate);
        
        const oldCashAccount = await accountRepo.findOne({ where: { id: defaultCashAccountId } });
        if (oldCashAccount) Account.validateFreezeDate(oldCashAccount, voucher.entryDate);
        
        const oldGoldAccount = await accountRepo.findOne({ where: { id: defaultGoldAccountId } });
        if (oldGoldAccount) Account.validateFreezeDate(oldGoldAccount, voucher.entryDate);
      }

      // 2. Validate party account
      const customerAccount = await accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!customerAccount) throw new Error('Customer account not found.');

      Account.validateFreezeDate(customerAccount, dto.entryDate);

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
        narration = `Customer Order (${dto.orderType}) for ${customerAccount.name}`;
      }

      // 4. Update the voucher header
      voucher.entryDate = dto.entryDate;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      await voucherRepo.save(voucher);

      // 5. Update the CustomerOrderVoucher record
      if (!cv) throw new Error('Customer order details not found.');

      cv.orderType = dto.orderType as OrderType;
      cv.accountId = dto.accountId;
      cv.itemId = dto.itemId;
      cv.goldWeight = dto.goldWeight || 0;
      cv.goldRate = dto.goldRate || 0;
      cv.amount = dto.amount || 0;
      if (dto.orderStatus) {
        cv.orderStatus = dto.orderStatus;
      }
      await cvRepo.save(cv);

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
          if (amount > 0) {
            const customerDr = new LedgerEntry();
            customerDr.accountId = dto.accountId;
            customerDr.debitAmount = amount;
            customerDr.creditAmount = 0;
            customerDr.narration = `Buy Order Amount - ${voucher.voucherNo}`;
            customerDr.journalEntry = savedJE;
            entries.push(customerDr);

            const cashCr = new LedgerEntry();
            cashCr.accountId = defaultCashAccountId;
            cashCr.debitAmount = 0;
            cashCr.creditAmount = amount;
            cashCr.narration = `Buy Order Amount Contra - ${voucher.voucherNo}`;
            cashCr.journalEntry = savedJE;
            entries.push(cashCr);
          }
          if (goldWeight > 0) {
            const customerCr = new LedgerEntry();
            customerCr.accountId = dto.accountId;
            customerCr.debitAmount = 0;
            customerCr.creditAmount = 0;
            customerCr.debitGold = 0;
            customerCr.creditGold = goldWeight;
            customerCr.narration = `Buy Order Gold - ${voucher.voucherNo}`;
            customerCr.journalEntry = savedJE;
            entries.push(customerCr);

            const goldDr = new LedgerEntry();
            goldDr.accountId = defaultGoldAccountId;
            goldDr.debitAmount = 0;
            goldDr.creditAmount = 0;
            goldDr.debitGold = goldWeight;
            goldDr.creditGold = 0;
            goldDr.narration = `Buy Order Gold Contra - ${voucher.voucherNo}`;
            goldDr.journalEntry = savedJE;
            entries.push(goldDr);
          }
        } else {
          if (amount > 0) {
            const customerCr = new LedgerEntry();
            customerCr.accountId = dto.accountId;
            customerCr.debitAmount = 0;
            customerCr.creditAmount = amount;
            customerCr.narration = `Sell Order Amount - ${voucher.voucherNo}`;
            customerCr.journalEntry = savedJE;
            entries.push(customerCr);

            const cashDr = new LedgerEntry();
            cashDr.accountId = defaultCashAccountId;
            cashDr.debitAmount = amount;
            cashDr.creditAmount = 0;
            cashDr.narration = `Sell Order Amount Contra - ${voucher.voucherNo}`;
            cashDr.journalEntry = savedJE;
            entries.push(cashDr);
          }
          if (goldWeight > 0) {
            const customerDr = new LedgerEntry();
            customerDr.accountId = dto.accountId;
            customerDr.debitAmount = 0;
            customerDr.creditAmount = 0;
            customerDr.debitGold = goldWeight;
            customerDr.creditGold = 0;
            customerDr.narration = `Sell Order Gold - ${voucher.voucherNo}`;
            customerDr.journalEntry = savedJE;
            entries.push(customerDr);

            const goldCr = new LedgerEntry();
            goldCr.accountId = defaultGoldAccountId;
            goldCr.debitAmount = 0;
            goldCr.creditAmount = 0;
            goldCr.debitGold = 0;
            goldCr.creditGold = goldWeight;
            goldCr.narration = `Sell Order Gold Contra - ${voucher.voucherNo}`;
            goldCr.journalEntry = savedJE;
            entries.push(goldCr);
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
