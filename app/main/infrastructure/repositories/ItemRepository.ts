import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Item } from '../../domain/entities/Item';
import { IItemRepository } from '../../domain/repositories/IItemRepository';

export class ItemRepository implements IItemRepository {
  private readonly repo: Repository<Item>;

  constructor() {
    this.repo = AppDataSource.getRepository(Item);
  }

  findById(id: string): Promise<Item | null> {
    return this.repo.findOne({ where: { id } });
  }

  findAll(activeOnly = true): Promise<Item[]> {
    return this.repo.find({
      where: activeOnly ? { is_active: true } : undefined,
      order: { name: 'ASC' },
    });
  }

  save(item: Item): Promise<Item> {
    return this.repo.save(item);
  }
}
