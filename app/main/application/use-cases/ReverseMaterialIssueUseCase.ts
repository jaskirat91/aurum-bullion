import { AppDataSource } from '../../infrastructure/database/data-source';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { Batch, BatchStatus } from '../../domain/entities/Batch';

export class ReverseMaterialIssueUseCase {
  async execute(transactionId: string): Promise<void> {
    return AppDataSource.transaction(async (em) => {
      const trxRepo = em.getRepository(MaterialTransaction);
      const batchRepo = em.getRepository(Batch);

      // 1. Load the transaction
      const trx = await trxRepo.findOne({
        where: { id: transactionId },
        relations: ['batch'],
      });

      if (!trx) {
        throw new Error(`Issue transaction not found: ${transactionId}`);
      }
      if (trx.type !== TransactionType.ISSUE_TO_KARIGAR) {
        throw new Error('Only ISSUE_TO_KARIGAR transactions can be reversed.');
      }

      const batch = trx.batch;
      if (!batch) {
        throw new Error('Associated batch not found for this issue.');
      }

      // If batch is already COMPLETED, we shouldn't reverse the issue easily
      if (batch.status === BatchStatus.COMPLETED) {
        throw new Error(
          'Cannot reverse issue for a COMPLETED batch. Delete the Finished Goods Receipt first.',
        );
      }

      // 2. Revert batch status
      batch.status = BatchStatus.RECEIVED;
      batch.assignedTo = null;
      await batchRepo.save(batch);

      // 3. Delete the transaction
      await trxRepo.remove(trx);
    });
  }
}
