import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus } from '../../domain/entities/Voucher';
import { CustomerOrderVoucher } from '../../domain/entities/CustomerOrderVoucher';
import { OrderStatus } from '../../domain/entities/OrderStatus';
import { Account } from '../../domain/entities/Account';

export class CancelCustomerOrderUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Find & validate the voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');
      if (voucher.status !== VoucherStatus.POSTED)
        throw new Error('Only POSTED vouchers can be cancelled.');

      // 2. Find customer order voucher
      const orderVoucherRepo = em.getRepository(CustomerOrderVoucher);
      const orderVoucher = await orderVoucherRepo.findOne({ where: { voucherId } });
      if (!orderVoucher) throw new Error('Customer order voucher not found.');

      // 3. Validate freeze date
      const accountRepo = em.getRepository(Account);
      const customerAccount = await accountRepo.findOne({ where: { id: orderVoucher.accountId } });
      if (customerAccount) {
        Account.validateFreezeDate(customerAccount, voucher.entryDate);
      }

      // 4. Delete Journal and Ledger entries
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      
      const je = await journalRepo.findOne({ where: { voucherId: voucher.id } });
      
      if (je) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.delete({ id: je.id });
      }

      // 5. Mark order as CANCELLED
      orderVoucher.orderStatus = OrderStatus.CANCELLED;
      await orderVoucherRepo.save(orderVoucher);

      // 6. Mark voucher as CANCELLED
      voucher.status = VoucherStatus.CANCELLED;
      voucher.narration = `[CANCELLED] ${voucher.narration ?? ''}`.trim();
      await voucherRepo.save(voucher);

      return { success: true };
    });
  }
}
