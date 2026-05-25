import { AppDataSource } from '../../infrastructure/database/data-source';
import { Item, ItemCategory } from '../../domain/entities/Item';

export interface CreateItemDTO {
  name: string;
  code: string;
  category: ItemCategory;
  purity?: number;
  uom: 'GRAM' | 'PCS' | 'CARAT';
  hsn_code?: string;
  description?: string;
}

export class CreateItemUseCase {
  async execute(dto: CreateItemDTO): Promise<{ itemId: string }> {
    const itemRepo = AppDataSource.getRepository(Item);

    const item = itemRepo.create({
      name: dto.name,
      code: dto.code,
      category: dto.category,
      purity: dto.purity,
      uom: dto.uom,
      hsn_code: dto.hsn_code,
      description: dto.description,
      is_active: true,
    });

    const savedItem = await itemRepo.save(item);
    return { itemId: savedItem.id };
  }
}
