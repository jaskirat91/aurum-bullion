import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';

export class DeleteFinishedProductUseCase {
  async execute(id: string): Promise<void> {
    return AppDataSource.transaction(async (em) => {
      const fp = await em.getRepository(FinishedProduct).findOne({
        where: { id },
      });

      if (!fp) throw new Error(`Finished Product not found: ${id}`);
      if (fp.status !== FinishedProductStatus.IN_STOCK) {
        throw new Error(`Only IN_STOCK products can be deleted.`);
      }

      await em.getRepository(FinishedProduct).remove(fp);
    });
  }
}
