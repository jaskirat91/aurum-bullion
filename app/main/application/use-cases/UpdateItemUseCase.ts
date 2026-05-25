import { AppDataSource } from '../../infrastructure/database/data-source';
import { Item, ItemCategory } from '../../domain/entities/Item';

export interface UpdateItemDTO {
  id: string;
  name: string;
  category: ItemCategory;
  purity?: number;
  uom: 'GRAM' | 'PCS' | 'CARAT';
  hsn_code?: string;
  description?: string;
}

export class UpdateItemUseCase {
  async execute(dto: UpdateItemDTO): Promise<void> {
    const itemRepo = AppDataSource.getRepository(Item);
    
    await itemRepo.update(dto.id, {
      name: dto.name,
      category: dto.category,
      purity: dto.purity,
      uom: dto.uom,
      hsn_code: dto.hsn_code,
      description: dto.description,
    });
  }
}
