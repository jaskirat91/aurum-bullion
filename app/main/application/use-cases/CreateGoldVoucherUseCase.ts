import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { GoldVoucher } from '../../domain/entities/GoldVoucher';
import { Account } from '../../domain/entities/Account';

export interface CreateGoldVoucherDTO {
  partyAccountId: string;
  entryDate: string;
  receiptGold?: number;
  issueGold?: number;
  receiptAmount?: number;
  issueAmount?: number;
  narration?: string;
  remarks?: string;
  remarksTime?: string;
  customerOrderVoucherId?: string;
  supplierOrderVoucherId?: string;
  status: VoucherStatus;
}

export class CreateGoldVoucherUseCase {
  async execute(dto: CreateGoldVoucherDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // ... (imports)
      const { CustomerOrderVoucher } = require('../../domain/entities/CustomerOrderVoucher');
      const { SupplierOrderVoucher } = require('../../domain/entities/SupplierOrderVoucher');
      const { OrderStatus } = require('../../domain/entities/OrderStatus');
      const {
        JournalEntryRepository,
      } = require('../../infrastructure/repositories/JournalEntryRepository');

      // 1. Validate party account
      const accountRepo = em.getRepository(Account);
      const partyAccount = await accountRepo.findOne({
        where: { id: dto.partyAccountId },
      });
      if (!partyAccount) throw new Error('Party account not found.');

      Account.validateFreezeDate(partyAccount, dto.entryDate);

      // 2. Load settings for default ledgers
      const settings = await em.getRepository(CompanySetting).findOne({ where: {} });
      if (!settings || !settings.defaultGoldLedgerId || !settings.defaultCashLedgerId) {
        throw new Error('Default Gold or Cash ledger account not configured.');
      }

      // 3. Generate unique Voucher No
      const year = new Date(dto.entryDate).getFullYear();
      const voucherNo = await Voucher.generateNextVoucherNo(em, 'GOLD', year);

      // 4. Create Voucher base
      let finalNarration = dto.narration;
      if (!finalNarration) {
        const rGold = dto.receiptGold || 0;
        const iGold = dto.issueGold || 0;
        const rAmt = dto.receiptAmount || 0;
        const iAmt = dto.issueAmount || 0;

        const parts: string[] = [];
        if (rGold > 0 || rAmt > 0) {
          const g = rGold > 0 ? `${rGold.toFixed(3)}g gold` : '';
          const a = rAmt > 0 ? `₹${rAmt.toLocaleString('en-IN')}` : '';
          parts.push(`Received from ${partyAccount.name}: ${g}${g && a ? ' and ' : ''}${a}`);
        }
        if (iGold > 0 || iAmt > 0) {
          const g = iGold > 0 ? `${iGold.toFixed(3)}g gold` : '';
          const a = iAmt > 0 ? `₹${iAmt.toLocaleString('en-IN')}` : '';
          parts.push(`Issued to ${partyAccount.name}: ${g}${g && a ? ' and ' : ''}${a}`);
        }
        finalNarration = parts.join('. ') || `Gold Voucher - ${voucherNo}`;
      }

      const voucher = new Voucher();
      voucher.type = VoucherType.GOLD;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = finalNarration;
      voucher.status = dto.status;
      const savedVoucher = await em.save(voucher);

      // 5. Create GoldVoucher header
      const goldVoucher = new GoldVoucher();
      goldVoucher.voucherId = savedVoucher.id;
      goldVoucher.partyAccountId = dto.partyAccountId;
      goldVoucher.receiptGold = dto.receiptGold;
      goldVoucher.issueGold = dto.issueGold;
      goldVoucher.receiptAmount = dto.receiptAmount;
      goldVoucher.issueAmount = dto.issueAmount;
      goldVoucher.remarks = dto.remarks;
      goldVoucher.remarksTime = dto.remarksTime;
      if (dto.customerOrderVoucherId) {
        goldVoucher.customerOrderVoucherId = dto.customerOrderVoucherId;
      }
      if (dto.supplierOrderVoucherId) {
        goldVoucher.supplierOrderVoucherId = dto.supplierOrderVoucherId;
      }
      await em.save(goldVoucher);

      // 6. Create Ledger Entries if POSTED
      if (dto.status === VoucherStatus.POSTED) {
        const je = new JournalEntry();
        je.voucherId = savedVoucher.id;
        je.entryDate = dto.entryDate;
        je.narration = finalNarration;
        je.sourceReference = savedVoucher.id;
        je.status = JournalEntryStatus.POSTED;

        const entries: LedgerEntry[] = [];

        // Gold Entries
        if ((dto.receiptGold || 0) > 0 || (dto.issueGold || 0) > 0) {
          const goldLedgerId = settings.defaultGoldLedgerId;

          // Party Line for Gold
          const partyGoldEntry = new LedgerEntry();
          partyGoldEntry.accountId = partyAccount.id;
          partyGoldEntry.debitGold = dto.issueGold || 0;
          partyGoldEntry.creditGold = dto.receiptGold || 0;
          partyGoldEntry.narration = je.narration;
          partyGoldEntry.journalEntry = je;
          entries.push(partyGoldEntry);

          // Contra Gold Line
          const contraGoldEntry = new LedgerEntry();
          contraGoldEntry.accountId = goldLedgerId;
          contraGoldEntry.debitGold = dto.receiptGold || 0;
          contraGoldEntry.creditGold = dto.issueGold || 0;
          contraGoldEntry.narration = je.narration;
          contraGoldEntry.journalEntry = je;
          entries.push(contraGoldEntry);
        }

        // Amount Entries
        if ((dto.receiptAmount || 0) > 0 || (dto.issueAmount || 0) > 0) {
          const cashLedgerId = settings.defaultCashLedgerId;

          // Party Line for Amount
          const partyAmountEntry = new LedgerEntry();
          partyAmountEntry.accountId = partyAccount.id;
          partyAmountEntry.debitAmount = dto.issueAmount || 0;
          partyAmountEntry.creditAmount = dto.receiptAmount || 0;
          partyAmountEntry.narration = je.narration;
          partyAmountEntry.journalEntry = je;
          entries.push(partyAmountEntry);

          // Contra Cash Line
          const contraCashEntry = new LedgerEntry();
          contraCashEntry.accountId = cashLedgerId;
          contraCashEntry.debitAmount = dto.receiptAmount || 0;
          contraCashEntry.creditAmount = dto.issueAmount || 0;
          contraCashEntry.narration = je.narration;
          contraCashEntry.journalEntry = je;
          entries.push(contraCashEntry);
        }

        je.ledgerEntries = entries;
        await em.save(je);

        // 7. Order Fulfillment Logic
        if (dto.customerOrderVoucherId || dto.supplierOrderVoucherId) {
          const orderId = dto.customerOrderVoucherId || dto.supplierOrderVoucherId;
          const isCustomerOrder = !!dto.customerOrderVoucherId;
          const orderRepo = isCustomerOrder
            ? em.getRepository(CustomerOrderVoucher)
            : em.getRepository(SupplierOrderVoucher);

          const order = await orderRepo.findOne({ where: { voucherId: orderId } });
          if (order) {
            const journalRepo = new JournalEntryRepository();
            const stats = await journalRepo.getOrderFulfillmentStats(
              orderId!,
              dto.partyAccountId,
              isCustomerOrder,
              em,
            );

            const netAmount = Math.abs(
              (Number(stats.totalDebitAmount) || 0) - (Number(stats.totalCreditAmount) || 0),
            );
            const netGold = Math.abs(
              (Number(stats.totalDebitGold) || 0) - (Number(stats.totalCreditGold) || 0),
            );

            const orderAmount = Number(order.amount) || 0;
            const orderGold = Number(order.goldWeight) || 0;

            if (netAmount >= orderAmount && netGold >= orderGold) {
              order.orderStatus = OrderStatus.COMPLETED;
              await orderRepo.save(order);
            }
          }
        }
      }

      return { success: true, voucherNo };
    });
  }
}
