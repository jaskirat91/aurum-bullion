import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { Weight } from '../../domain/value-objects/Weight';

export interface UpdateFinishedProductDTO {
  id: string;
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

export class UpdateFinishedProductUseCase {
  async execute(dto: UpdateFinishedProductDTO): Promise<void> {
    return AppDataSource.transaction(async (em) => {
      const fp = await em.getRepository(FinishedProduct).findOne({
        where: { id: dto.id },
      });

      if (!fp) throw new Error(`Finished Product not found: ${dto.id}`);
      if (fp.status !== FinishedProductStatus.IN_STOCK) {
        throw new Error(`Only IN_STOCK products can be edited.`);
      }

      const net = Weight.of(dto.netWeight);
      const purity = dto.purityPercentage / 100;
      const pureGold = net.multiply(purity);

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
      fp.transactionDate = new Date(dto.transactionDate);

      await em.save(fp);
    });
  }
}
