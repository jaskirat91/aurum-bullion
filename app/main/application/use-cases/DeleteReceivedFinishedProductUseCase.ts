import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { FinishedProduct } from '../../domain/entities/FinishedProduct';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { Voucher } from '../../domain/entities/Voucher';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';

export class DeleteReceivedFinishedProductUseCase {
  async execute(finishedProductId: string): Promise<void> {
    await AppDataSource.transaction(async (em) => {
      const fp = await em.getRepository(FinishedProduct).findOne({
        where: { id: finishedProductId },
      });

      if (!fp) {
        throw new Error('Finished product record not found');
      }

      // 1. Revert Batch Status to WIP
      const batch = await em.getRepository(Batch).findOne({ where: { id: fp.batchId } });
      if (batch) {
        batch.status = BatchStatus.WIP;
        await em.save(batch);
      }

      // 2. Find and delete associated Material Transaction (RECEIVE_FROM_KARIGAR)
      const trx = await em.getRepository(MaterialTransaction).findOne({
        where: { batchId: fp.batchId, type: TransactionType.RECEIVE_FROM_KARIGAR },
      });
      if (trx) {
        await em.getRepository(MaterialTransaction).remove(trx);
      }

      // 3. Find and delete associated Journal Entry and Voucher
      const je = await em.getRepository(JournalEntry).findOne({
        where: { sourceReference: fp.id },
        relations: ['ledgerEntries'],
      });

      if (je) {
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

      // 4. Delete Finished Product record
      await em.getRepository(FinishedProduct).remove(fp);
    });
  }
}
