import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher } from '../../domain/entities/Voucher';
import { SaleReturnVoucher } from '../../domain/entities/SaleReturnVoucher';
import { SaleReturnVoucherItem } from '../../domain/entities/SaleReturnVoucherItem';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Account } from '../../domain/entities/Account';
import { Party } from '../../domain/entities/Party';

export class DeleteSaleReturnVoucherUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      const voucher = await em.getRepository(Voucher).findOne({ where: { id: voucherId } });
      const saleReturnVoucher = await em.getRepository(SaleReturnVoucher).findOne({
        where: { voucherId },
        relations: ['items'],
      });

      if (!voucher || !saleReturnVoucher) throw new Error('Sale Return Voucher not found.');

      // Check freeze date for the customer
      const customer = await em.getRepository(Party).findOne({
        where: { id: saleReturnVoucher.customerId },
        relations: ['ledgerAccount'],
      });
      if (customer?.ledgerAccount) {
        Account.validateFreezeDate(customer.ledgerAccount, voucher.entryDate);
      }

      // 1. Restore items to SOLD (associated with customer)
      const productRepo = em.getRepository(FinishedProduct);
      const batchRepo = em.getRepository(Batch);
      if (saleReturnVoucher.items) {
        for (const item of saleReturnVoucher.items) {
          // Old items have no product in our system — skip stock restoration
          if (item.isOldItem || !item.productId) continue;

          const product = await productRepo.findOne({
            where: { id: item.productId },
            relations: ['batch'],
          });
          if (product) {
            product.status = FinishedProductStatus.SOLD;
            product.partyId = saleReturnVoucher.customerId;
            await productRepo.save(product);

            if (product.batch) {
              const batch = product.batch;
              batch.status = BatchStatus.SOLD;
              await batchRepo.save(batch);
            }
          }
        }
      }

      // 2. Delete SaleReturnVoucherItems
      await em.getRepository(SaleReturnVoucherItem).delete({ voucherId });

      // 3. Delete SaleReturnVoucher Header
      await em.getRepository(SaleReturnVoucher).delete({ voucherId });

      // 4. Wipe Accounting Entries
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      const journals = await journalRepo.find({ where: { voucherId } });
      for (const je of journals) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.remove(je);
      }

      // 5. Delete main Voucher
      await em.getRepository(Voucher).remove(voucher);

      return { success: true };
    });
  }
}
