import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { Party } from '../../domain/entities/Party';
import { Batch, BatchStatus } from '../../domain/entities/Batch';

export interface SellFinishedStockDTO {
  productId: string;
  partyId: string; // The customer
}

export class SellFinishedStockUseCase {
  async execute(dto: SellFinishedStockDTO): Promise<void> {
    await AppDataSource.transaction(async (em) => {
      const productRepo = em.getRepository(FinishedProduct);
      const partyRepo = em.getRepository(Party);
      const batchRepo = em.getRepository(Batch);

      const product = await productRepo.findOne({ 
        where: { id: dto.productId },
        relations: ['batch']
      });
      
      if (!product) {
        throw new Error('Finished product not found');
      }

      if (product.status === FinishedProductStatus.SOLD) {
        throw new Error('Product is already sold');
      }

      const party = await partyRepo.findOne({ where: { id: dto.partyId } });
      if (!party) {
        throw new Error('Customer not found');
      }

      product.status = FinishedProductStatus.SOLD;
      product.partyId = dto.partyId;

      await productRepo.save(product);

      // Also update associated batch status
      if (product.batch) {
        product.batch.status = BatchStatus.SOLD;
        await batchRepo.save(product.batch);
      }
    });
  }
}
