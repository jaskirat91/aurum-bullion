import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { IMaterialTransactionRepository } from '../../domain/repositories/IMaterialTransactionRepository';

export class MaterialTransactionRepository implements IMaterialTransactionRepository {
  private readonly repo: Repository<MaterialTransaction>;

  constructor() {
    this.repo = AppDataSource.getRepository(MaterialTransaction);
  }

  findById(id: string): Promise<MaterialTransaction | null> {
    return this.repo.findOne({ where: { id }, relations: ['party'] });
  }

  findByBatchId(batchId: string): Promise<MaterialTransaction[]> {
    return this.repo.find({
      where: { batchId },
      order: { createdAt: 'DESC' },
      relations: ['party'],
    });
  }

  findByPartyId(partyId: string): Promise<MaterialTransaction[]> {
    return this.repo.find({
      where: { partyId },
      order: { createdAt: 'DESC' },
      relations: ['party'],
    });
  }

  findByType(type: TransactionType): Promise<MaterialTransaction[]> {
    return this.repo.find({ where: { type }, order: { createdAt: 'DESC' }, relations: ['party'] });
  }

  save(transaction: MaterialTransaction): Promise<MaterialTransaction> {
    return this.repo.save(transaction);
  }
}
