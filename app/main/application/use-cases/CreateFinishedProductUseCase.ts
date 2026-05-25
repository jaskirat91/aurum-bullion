import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { Weight } from '../../domain/value-objects/Weight';

export interface CreateFinishedProductDTO {
  finishedItemId: string;
  transactionDate: string;
  grossWeight: number;
  kundanWeight: number;
  stoneWeight: number;
  mottiWeight: number;
  piroiWeight: number;
  netWeight: number;
  purityPercentage: number;
  labourCost: number;
  tagGrossWeight: number;
  tagKundanWeight: number;
  tagStoneWeight: number;
  tagMottiWeight: number;
  tagNetWeight: number;
  tagAmount: number;
  tagValue: string;
}

export class CreateFinishedProductUseCase {
  async execute(dto: CreateFinishedProductDTO): Promise<{ finishedProductId: string }> {
    return AppDataSource.transaction(async (em) => {
      const net = Weight.of(dto.netWeight);
      const purity = dto.purityPercentage / 100;
      const pureGold = net.multiply(purity);

      const fp = new FinishedProduct();
      fp.tag = dto.tagValue || '';
      fp.finishedItemId = dto.finishedItemId;
      fp.grossWeight = dto.grossWeight;
      fp.kundanWeight = dto.kundanWeight;
      fp.stoneWeight = dto.stoneWeight;
      fp.mottiWeight = dto.mottiWeight;
      fp.piroiWeight = dto.piroiWeight;
      fp.netWeight = dto.netWeight;
      fp.purityPercentage = dto.purityPercentage;
      fp.pureGoldWeight = pureGold.grams;
      fp.labourCost = dto.labourCost;

      fp.tagGrossWeight = dto.tagGrossWeight;
      fp.tagKundanWeight = dto.tagKundanWeight;
      fp.tagStoneWeight = dto.tagStoneWeight;
      fp.tagMottiWeight = dto.tagMottiWeight;
      fp.tagNetWeight = dto.tagNetWeight;
      fp.tagAmount = dto.tagAmount;

      fp.status = FinishedProductStatus.IN_STOCK;
      fp.transactionDate = new Date(dto.transactionDate);
      
      const savedFP = await em.save(fp);
      return { finishedProductId: savedFP.id };
    });
  }
}
