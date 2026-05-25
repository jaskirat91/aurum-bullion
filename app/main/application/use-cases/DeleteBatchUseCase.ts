import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch } from '../../domain/entities/Batch';
import { MaterialTransaction } from '../../domain/entities/MaterialTransaction';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { Voucher } from '../../domain/entities/Voucher';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';

export class DeleteBatchUseCase {
  async execute(batchId: string): Promise<void> {
    await AppDataSource.transaction(async (em) => {
      const batch = await em.getRepository(Batch).findOne({
        where: { id: batchId },
        relations: ['transactions'],
      });

      if (!batch) {
        throw new Error('Batch not found');
      }

      // 1. Find and delete associated Journal Entry and Voucher
      const je = await em.getRepository(JournalEntry).findOne({
        where: { sourceReference: batch.id },
        relations: ['ledgerEntries'],
      });

      if (je) {
        // Delete ledger entries first
        if (je.ledgerEntries && je.ledgerEntries.length > 0) {
          await em.getRepository(LedgerEntry).remove(je.ledgerEntries);
        }

        const voucherId = je.voucherId;
        await em.getRepository(JournalEntry).remove(je);

        if (voucherId) {
          const voucher = await em.getRepository(Voucher).findOne({ where: { id: voucherId } });
          if (voucher) {
            await em.getRepository(Voucher).remove(voucher);
          }
        }
      }

      // 2. Delete Material Transactions
      if (batch.transactions && batch.transactions.length > 0) {
        await em.getRepository(MaterialTransaction).remove(batch.transactions);
      }

      // 3. Delete Batch
      await em.getRepository(Batch).remove(batch);
    });
  }
}
