import { AppDataSource } from '../../infrastructure/database/data-source';
import { Voucher } from '../../domain/entities/Voucher';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { Batch, BatchStatus } from '../../domain/entities/Batch';

import { Party } from '../../domain/entities/Party';
import { Account } from '../../domain/entities/Account';

export class DeleteSaleVoucherUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch the SaleVoucher and its items
      const saleVoucher = await em.getRepository(SaleVoucher).findOne({
        where: { voucherId },
        relations: ['items'],
      });
      if (!saleVoucher) throw new Error('Sale Voucher not found.');

      const voucher = await em.getRepository(Voucher).findOne({ where: { id: voucherId } });
      if (voucher) {
        const customer = await em.getRepository(Party).findOne({
          where: { id: saleVoucher.customerId },
          relations: ['ledgerAccount'],
        });
        if (customer?.ledgerAccount) {
          Account.validateFreezeDate(customer.ledgerAccount, voucher.entryDate);
        }
      }

      // 2. Restore Products to INSTOCK
      const productRepo = em.getRepository(FinishedProduct);
      const batchRepo = em.getRepository(Batch);

      if (saleVoucher.items && saleVoucher.items.length > 0) {
        for (const item of saleVoucher.items) {
          const product = await productRepo.findOne({
            where: { id: item.productId },
            relations: ['batch'],
          });

          if (product) {
            product.status = FinishedProductStatus.IN_STOCK;
            product.partyId = null!;
            product.soldGoldPercentage = null!;
            product.soldGoldWeight = null!;
            product.soldAmountPercentage = null!;
            product.soldAmount = null!;
            product.transactionDate = null!;
            await productRepo.save(product);

            if (product.batch) {
              const batch = product.batch;
              batch.status = BatchStatus.COMPLETED;
              await batchRepo.save(batch);
            }
          }
        }
      }

      // 3. Delete SaleVoucherItems
      await em.getRepository(SaleVoucherItem).delete({ voucherId });

      // 4. Delete Accounting Entries (Journal & Ledger)
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);

      const journals = await journalRepo.find({ where: { voucherId } });
      for (const je of journals) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.remove(je);
      }

      // 5. Delete SaleVoucher Header
      await em.getRepository(SaleVoucher).delete({ voucherId });

      // 6. Delete Base Voucher
      await em.getRepository(Voucher).delete({ id: voucherId });

      return { success: true };
    });
  }
}
