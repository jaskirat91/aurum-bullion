import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { CustomerOrderVoucher, OrderType } from '../../domain/entities/CustomerOrderVoucher';
import { Account } from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { OrderStatus } from '../../domain/entities/OrderStatus';

export interface CreateCustomerOrderDTO {
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

export class CreateCustomerOrderUseCase {
  async execute(dto: CreateCustomerOrderDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate customer account
      const accountRepo = em.getRepository(Account);
      const customerAccount = await accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!customerAccount) throw new Error('Customer account not found.');

      Account.validateFreezeDate(customerAccount, dto.entryDate);

      const companySettingsRepo = em.getRepository(CompanySetting);
      const settings = await companySettingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) throw new Error('Company settings not found.');

      const defaultCashAccountId = settings.defaultContraCashLedgerId;
      const defaultGoldAccountId = settings.defaultContraGoldLedgerId;

      if (!defaultCashAccountId || !defaultGoldAccountId) {
        throw new Error('Default Cash or Gold accounts are not configured.');
      }

      const cashAccount = await accountRepo.findOne({ where: { id: defaultCashAccountId } });
      const goldAccount = await accountRepo.findOne({ where: { id: defaultGoldAccountId } });

      if (cashAccount) Account.validateFreezeDate(cashAccount, dto.entryDate);
      if (goldAccount) Account.validateFreezeDate(goldAccount, dto.entryDate);

      // 3. Generate unique Voucher No
      const voucherNo = await Voucher.generateNextVoucherNo(
        em,
        'CO',
        new Date(dto.entryDate).getFullYear(),
      );

      let narration = '';
      if (dto.narration?.trim()) {
        narration = dto.narration.trim();
      } else {
        if (dto.orderType == OrderType.BUY) {
          narration = `Buy from Customer (${customerAccount.name}) ${dto.goldWeight?.toFixed(3)}g @ ₹${dto.goldRate?.toLocaleString('en-IN')}/g = ₹${dto.amount?.toLocaleString('en-IN')}`;
        } else {
          narration = `Sell to Customer (${customerAccount.name}) ${dto.goldWeight?.toFixed(3)}g @ ₹${dto.goldRate?.toLocaleString('en-IN')}/g = ₹${dto.amount?.toLocaleString('en-IN')}`;
        }
      }

      // 4. Create Voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.CUSTOMER_ORDER;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      const savedVoucher = await em.save(voucher);

      // 5. Create CustomerOrderVoucher header
      const orderVoucher = new CustomerOrderVoucher();
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
          // Buy Order: Cr Amount from Customer, Dr Gold from Customer (Trader buys from customer)
          // Contra: Dr Amount from default cash, Cr Gold from default gold
          if (amount > 0) {
            const customerCr = new LedgerEntry();
            customerCr.accountId = dto.accountId;
            customerCr.debitAmount = 0;
            customerCr.creditAmount = amount;
            customerCr.narration = `Buy Order Amount - ${voucherNo}`;
            customerCr.journalEntry = je;
            entries.push(customerCr);

            const cashDr = new LedgerEntry();
            cashDr.accountId = defaultCashAccountId;
            cashDr.debitAmount = amount;
            cashDr.creditAmount = 0;
            cashDr.narration = `Buy Order Amount Contra - ${voucherNo}`;
            cashDr.journalEntry = je;
            entries.push(cashDr);
          }
          if (goldWeight > 0) {
            const customerDr = new LedgerEntry();
            customerDr.accountId = dto.accountId;
            customerDr.debitAmount = 0;
            customerDr.creditAmount = 0;
            customerDr.debitGold = goldWeight;
            customerDr.creditGold = 0;
            customerDr.narration = `Buy Order Gold - ${voucherNo}`;
            customerDr.journalEntry = je;
            entries.push(customerDr);

            const goldCr = new LedgerEntry();
            goldCr.accountId = defaultGoldAccountId;
            goldCr.debitAmount = 0;
            goldCr.creditAmount = 0;
            goldCr.debitGold = 0;
            goldCr.creditGold = goldWeight;
            goldCr.narration = `Buy Order Gold Contra - ${voucherNo}`;
            goldCr.journalEntry = je;
            entries.push(goldCr);
          }
        } else {
          // Sell Order: Dr Amount from Customer, Cr Gold from Customer (Trader sells to customer)
          // Contra: Cr Amount from default cash, Dr Gold from default gold
          if (amount > 0) {
            const customerDr = new LedgerEntry();
            customerDr.accountId = dto.accountId;
            customerDr.debitAmount = amount;
            customerDr.creditAmount = 0;
            customerDr.narration = `Sell Order Amount - ${voucherNo}`;
            customerDr.journalEntry = je;
            entries.push(customerDr);

            const cashCr = new LedgerEntry();
            cashCr.accountId = defaultCashAccountId;
            cashCr.debitAmount = 0;
            cashCr.creditAmount = amount;
            cashCr.narration = `Sell Order Amount Contra - ${voucherNo}`;
            cashCr.journalEntry = je;
            entries.push(cashCr);
          }
          if (goldWeight > 0) {
            const customerCr = new LedgerEntry();
            customerCr.accountId = dto.accountId;
            customerCr.debitAmount = 0;
            customerCr.creditAmount = 0;
            customerCr.debitGold = 0;
            customerCr.creditGold = goldWeight;
            customerCr.narration = `Sell Order Gold - ${voucherNo}`;
            customerCr.journalEntry = je;
            entries.push(customerCr);

            const goldDr = new LedgerEntry();
            goldDr.accountId = defaultGoldAccountId;
            goldDr.debitAmount = 0;
            goldDr.creditAmount = 0;
            goldDr.debitGold = goldWeight;
            goldDr.creditGold = 0;
            goldDr.narration = `Sell Order Gold Contra - ${voucherNo}`;
            goldDr.journalEntry = je;
            entries.push(goldDr);
          }
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true, voucherNo };
    });
  }
}
