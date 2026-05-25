import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { SupplierOrderVoucher, OrderType } from '../../domain/entities/SupplierOrderVoucher';
import { Account } from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { OrderStatus } from '../../domain/entities/OrderStatus';

export interface CreateSupplierOrderDTO {
  orderType: 'BUY' | 'SELL';
  accountId: string;
  itemId?: string;
  entryDate: string;
  goldWeight?: number;
  goldRate?: number;
  amount?: number;
  narration?: string;
  action: 'DRAFT' | 'POST';
  orderStatus?: OrderStatus;
}

export class CreateSupplierOrderUseCase {
  async execute(dto: CreateSupplierOrderDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate supplier account
      const accountRepo = em.getRepository(Account);
      const supplierAccount = await accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!supplierAccount) throw new Error('Supplier account not found.');

      Account.validateFreezeDate(supplierAccount, dto.entryDate);

      const companySettingsRepo = em.getRepository(CompanySetting);
      const settings = await companySettingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) throw new Error('Company settings not found.');

      const defaultCashAccountId = settings.defaultCashLedgerId;
      const defaultGoldAccountId = settings.defaultGoldLedgerId;

      if (!defaultCashAccountId || !defaultGoldAccountId) {
        throw new Error('Default Cash or Gold accounts are not configured.');
      }

      const cashAccount = await accountRepo.findOne({ where: { id: defaultCashAccountId } });
      const goldAccount = await accountRepo.findOne({ where: { id: defaultGoldAccountId } });

      if (cashAccount) Account.validateFreezeDate(cashAccount, dto.entryDate);
      if (goldAccount) Account.validateFreezeDate(goldAccount, dto.entryDate);

      // 3. Generate unique Voucher No (using prefix 'SO' for Supplier Order)
      const voucherNo = await Voucher.generateNextVoucherNo(
        em,
        'SO',
        new Date(dto.entryDate).getFullYear(),
      );

      let narration = '';
      if (dto.narration?.trim()) {
        narration = dto.narration.trim();
      } else {
        narration = `Supplier Order (${dto.orderType}) for ${supplierAccount.name}`;
      }

      // 4. Create Voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.SUPPLIER_ORDER;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      const savedVoucher = await em.save(voucher);

      // 5. Create SupplierOrderVoucher header
      const orderVoucher = new SupplierOrderVoucher();
      orderVoucher.voucherId = savedVoucher.id;
      orderVoucher.orderType = dto.orderType as OrderType;
      orderVoucher.accountId = dto.accountId;
      orderVoucher.itemId = dto.itemId;
      orderVoucher.goldWeight = dto.goldWeight || 0;
      orderVoucher.goldRate = dto.goldRate || 0;
      orderVoucher.amount = dto.amount || 0;
      await em.save(orderVoucher);

      // 6. Create Journal + Ledger entries only when posting
      if (dto.action === 'POST') {
        const je = new JournalEntry();
        je.voucherId = savedVoucher.id;
        je.entryDate = dto.entryDate;
        je.narration = savedVoucher.narration;
        je.sourceReference = savedVoucher.id;
        je.status = JournalEntryStatus.POSTED;

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
            cashDr.narration = `Buy Order Amount - ${voucherNo}`;
            cashDr.journalEntry = je;
            entries.push(cashDr);

            const supplierCr = new LedgerEntry();
            supplierCr.accountId = dto.accountId;
            supplierCr.debitAmount = 0;
            supplierCr.creditAmount = amount;
            supplierCr.narration = `Buy Order Amount Contra - ${voucherNo}`;
            supplierCr.journalEntry = je;
            entries.push(supplierCr);
          }
          if (goldWeight > 0) {
            const goldCr = new LedgerEntry();
            goldCr.accountId = defaultGoldAccountId;
            goldCr.debitAmount = 0;
            goldCr.creditAmount = 0;
            goldCr.debitGold = 0;
            goldCr.creditGold = goldWeight;
            goldCr.narration = `Buy Order Gold - ${voucherNo}`;
            goldCr.journalEntry = je;
            entries.push(goldCr);

            const supplierDr = new LedgerEntry();
            supplierDr.accountId = dto.accountId;
            supplierDr.debitAmount = 0;
            supplierDr.creditAmount = 0;
            supplierDr.debitGold = goldWeight;
            supplierDr.creditGold = 0;
            supplierDr.narration = `Buy Order Gold Contra - ${voucherNo}`;
            supplierDr.journalEntry = je;
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
            cashCr.narration = `Sell Order Amount - ${voucherNo}`;
            cashCr.journalEntry = je;
            entries.push(cashCr);

            const supplierDr = new LedgerEntry();
            supplierDr.accountId = dto.accountId;
            supplierDr.debitAmount = amount;
            supplierDr.creditAmount = 0;
            supplierDr.narration = `Sell Order Amount Contra - ${voucherNo}`;
            supplierDr.journalEntry = je;
            entries.push(supplierDr);
          }
          if (goldWeight > 0) {
            const goldDr = new LedgerEntry();
            goldDr.accountId = defaultGoldAccountId;
            goldDr.debitAmount = 0;
            goldDr.creditAmount = 0;
            goldDr.debitGold = goldWeight;
            goldDr.creditGold = 0;
            goldDr.narration = `Sell Order Gold - ${voucherNo}`;
            goldDr.journalEntry = je;
            entries.push(goldDr);

            const supplierCr = new LedgerEntry();
            supplierCr.accountId = dto.accountId;
            supplierCr.debitAmount = 0;
            supplierCr.creditAmount = 0;
            supplierCr.debitGold = 0;
            supplierCr.creditGold = goldWeight;
            supplierCr.narration = `Sell Order Gold Contra - ${voucherNo}`;
            supplierCr.journalEntry = je;
            entries.push(supplierCr);
          }
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true, voucherNo };
    });
  }
}
