import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { CashVoucher } from '../../domain/entities/CashVoucher';
import { CreateCashVoucherDTO } from './CreateCashVoucherUseCase';
import { Account } from '../../domain/entities/Account';
import { CustomerOrderVoucher } from '../../domain/entities/CustomerOrderVoucher';
import { SupplierOrderVoucher } from '../../domain/entities/SupplierOrderVoucher';
import { OrderStatus } from '../../domain/entities/OrderStatus';

export class UpdateCashVoucherUseCase {
  async execute(
    voucherId: string,
    dto: CreateCashVoucherDTO,
  ): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch the existing voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');

      const cvRepo = em.getRepository(CashVoucher);
      const accountRepo = em.getRepository(Account);
      const cv = await cvRepo.findOne({ where: { voucherId } });

      // 1.1 Check Freeze Date for existing accounts at the OLD date
      if (cv) {
        const oldPartyAccount = await accountRepo.findOne({ where: { id: cv.partyAccountId } });
        if (oldPartyAccount) Account.validateFreezeDate(oldPartyAccount, voucher.entryDate);

        if (cv.accountId) {
          const oldCashAccount = await accountRepo.findOne({ where: { id: cv.accountId } });
          if (oldCashAccount) Account.validateFreezeDate(oldCashAccount, voucher.entryDate);
        }
      }

      // 2. Validate party account
      const partyAccount = await accountRepo.findOne({
        where: { id: dto.partyAccountId },
      });
      if (!partyAccount) throw new Error('Party account not found.');

      Account.validateFreezeDate(partyAccount, dto.entryDate);

      // 3. Validate account and gold ledger setting when posting
      if (dto.action === 'POST' && !dto.accountId) {
        throw new Error('Cash/Bank account is required for posting.');
      }
      if (dto.accountId) {
        const newCashAccount = await accountRepo.findOne({ where: { id: dto.accountId } });
        if (newCashAccount) Account.validateFreezeDate(newCashAccount, dto.entryDate);
      }

      let narration = '';
      if (dto.narration?.trim()) {
        narration = dto.narration.trim();
      } else {
        narration = `Cash Voucher (${dto.type}) for ${partyAccount.name} \n${dto.type === 'Receipt' ? 'BY' : 'TO'} :`;
        if (dto.type == 'Payment') {
          narration += ` ${dto.paymentAmount || 0} @ ${dto.goldRate || 0}`;
        } else if (dto.type == 'Receipt') {
          narration += ` ${dto.receiptAmount || 0} @ ${dto.goldRate || 0}`;
        }
      }

      // 4. Update the voucher header
      voucher.entryDate = dto.entryDate;
      voucher.narration = narration;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      voucher.type = dto.type === 'Receipt' ? VoucherType.RECEIPT : VoucherType.PAYMENT;
      await voucherRepo.save(voucher);

      // 5. Update the CashVoucher record
      if (!cv) throw new Error('Cash voucher details not found.');

      cv.partyAccountId = dto.partyAccountId;
      cv.accountId = dto.accountId;
      cv.receiptAmount = dto.receiptAmount;
      cv.paymentAmount = dto.paymentAmount;
      cv.goldRate = dto.goldRate;
      cv.goldWeight = dto.goldWeight;
      cv.remarks = dto.remarks;
      cv.remarksTime = dto.remarksTime;
      cv.customerOrderVoucherId = dto.customerOrderVoucherId ? dto.customerOrderVoucherId : null!;
      cv.supplierOrderVoucherId = dto.supplierOrderVoucherId ? dto.supplierOrderVoucherId : null!;

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
        const cashAmount = dto.type === 'Receipt' ? dto.receiptAmount || 0 : dto.paymentAmount || 0;

        if (cashAmount > 0) {
          if (dto.type === 'Receipt') {
            // Receipt: Dr Cash, Cr Party
            const cashDr = new LedgerEntry();
            cashDr.accountId = dto.accountId;
            cashDr.debitAmount = cashAmount;
            cashDr.creditAmount = 0;
            cashDr.narration = `Cash received - ${voucher.voucherNo}`;
            cashDr.journalEntry = savedJE;
            entries.push(cashDr);

            const partyCr = new LedgerEntry();
            partyCr.accountId = partyAccount.id;
            partyCr.debitAmount = 0;
            partyCr.creditAmount = cashAmount;
            partyCr.narration = `Cash received - ${voucher.voucherNo}`;
            partyCr.journalEntry = savedJE;
            entries.push(partyCr);
          } else {
            // Payment: Dr Party, Cr Cash
            const partyDr = new LedgerEntry();
            partyDr.accountId = partyAccount.id;
            partyDr.debitAmount = cashAmount;
            partyDr.creditAmount = 0;
            partyDr.narration = `Cash paid - ${voucher.voucherNo}`;
            partyDr.journalEntry = savedJE;
            entries.push(partyDr);

            const cashCr = new LedgerEntry();
            cashCr.accountId = dto.accountId;
            cashCr.debitAmount = 0;
            cashCr.creditAmount = cashAmount;
            cashCr.narration = `Cash paid - ${voucher.voucherNo}`;
            cashCr.journalEntry = savedJE;
            entries.push(cashCr);
          }
        }

        if (entries.length > 0) {
          await em.save(LedgerEntry, entries);
        }

        // 7. Order Fulfillment Logic
        if (dto.customerOrderVoucherId || dto.supplierOrderVoucherId) {
          const orderId = dto.customerOrderVoucherId || dto.supplierOrderVoucherId;
          const isCustomerOrder = !!dto.customerOrderVoucherId;
          const orderRepo = isCustomerOrder
            ? em.getRepository(CustomerOrderVoucher)
            : em.getRepository(SupplierOrderVoucher);

          const order = await orderRepo.findOne({ where: { voucherId: orderId } });
          if (order) {
            const {
              JournalEntryRepository,
            } = require('../../infrastructure/repositories/JournalEntryRepository');
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

      return { success: true, voucherNo: voucher.voucherNo };
    });
  }
}
