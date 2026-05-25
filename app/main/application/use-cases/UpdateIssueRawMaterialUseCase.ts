import { AppDataSource } from '../../infrastructure/database/data-source';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { Batch } from '../../domain/entities/Batch';
import { Weight } from '../../domain/value-objects/Weight';
import { WeightCalculationService } from '../../domain/services/WeightCalculationService';

export interface UpdateIssueRawMaterialDTO {
  batchId: string;
  manufacturerPartyId: string;
  transactionDate: string;
  grossGoldWeight: number;
  lessWeight: number;
  tenchPercentage: number;
  wastePercentage: number;
  netPureGoldWeight: number;
}

export class UpdateIssueRawMaterialUseCase {
  private readonly weightService = new WeightCalculationService();

  async execute(transactionId: string, dto: UpdateIssueRawMaterialDTO): Promise<void> {
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
        throw new Error('Only ISSUE_TO_KARIGAR transactions can be updated via this service.');
      }

      // 2. Validate weights
      const gross = Weight.of(dto.grossGoldWeight);
      const less = Weight.of(dto.lessWeight);
      const net = this.weightService.calculateNetWeight(gross, less);

      // 3. Update Batch if karigar changed
      if (trx.batch && trx.batch.assignedTo !== dto.manufacturerPartyId) {
        trx.batch.assignedTo = dto.manufacturerPartyId;
        await batchRepo.save(trx.batch);
      }

      // 4. Update Transaction
      trx.partyId = dto.manufacturerPartyId;
      trx.transactionDate = dto.transactionDate;
      trx.grossGoldWeight = gross.grams;
      trx.lessWeight = less.grams;
      trx.netWeight = net.grams;
      trx.tenchPercentage = dto.tenchPercentage || 0;
      trx.wastePercentage = dto.wastePercentage || 0;
      trx.netPureGoldWeight = dto.netPureGoldWeight || 0;

      await trxRepo.save(trx);
    });
  }
}
