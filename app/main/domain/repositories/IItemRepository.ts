import { Item } from '../entities/Item';

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  findAll(activeOnly?: boolean): Promise<Item[]>;
  save(item: Item): Promise<Item>;
}
