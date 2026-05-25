import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { Weight } from '../../domain/value-objects/Weight';
import { WeightCalculationService } from '../../domain/services/WeightCalculationService';

export interface IssueRawMaterialDTO {
  batchId: string;
  manufacturerPartyId: string;
  transactionDate: string;
  grossGoldWeight: number;
  lessWeight: number;
  tenchPercentage: number;
  wastePercentage: number;
  netPureGoldWeight: number;
}

export class IssueRawMaterialToManufacturerUseCase {
  private readonly weightService = new WeightCalculationService();

  async execute(dto: IssueRawMaterialDTO): Promise<{ transactionId: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Load & validate batch with transactions
      const batchRepo = em.getRepository(Batch);
      const batch = await batchRepo.findOne({
        where: { id: dto.batchId },
        relations: ['transactions'],
      });

      if (!batch) {
        throw new Error(`Batch not found: ${dto.batchId}`);
      }
      if (batch.status !== BatchStatus.RECEIVED) {
        throw new Error(
          `Batch (${batch.batchNo}) must be in RECEIVED status to be issued. Current status: ${batch.status}`,
        );
      }
      if (!dto.manufacturerPartyId) {
        throw new Error('Karigar selection is required for material issue.');
      }

      // 2. Validate transaction date
      const receiptTrx = batch.transactions?.find((t) => t.type === TransactionType.RECEIPT);
      if (receiptTrx && receiptTrx.transactionDate) {
        if (dto.transactionDate < receiptTrx.transactionDate) {
          throw new Error(
            `Issue date (${dto.transactionDate}) cannot be before original receipt date (${receiptTrx.transactionDate}).`,
          );
        }
      }

      // 3. Calculate weights
      const gross = Weight.of(dto.grossGoldWeight);
      const less = Weight.of(dto.lessWeight);
      const net = this.weightService.calculateNetWeight(gross, less);

      // 4. Advance batch status to WIP and assign Karigar
      batch.status = BatchStatus.WIP;
      batch.assignedTo = dto.manufacturerPartyId;
      await em.save(batch);

      // 5. Create Issue transaction
      const trx = new MaterialTransaction();
      trx.type = TransactionType.ISSUE_TO_KARIGAR;
      trx.batchId = dto.batchId;
      trx.partyId = dto.manufacturerPartyId;
      trx.transactionDate = dto.transactionDate;
      trx.grossGoldWeight = gross.grams;
      trx.lessWeight = less.grams;
      trx.netWeight = net.grams;
      trx.tenchPercentage = dto.tenchPercentage;
      trx.wastePercentage = dto.wastePercentage;
      trx.netPureGoldWeight = dto.netPureGoldWeight;

      const saved = await em.getRepository(MaterialTransaction).save(trx);
      return { transactionId: saved.id };
    });
  }
}
