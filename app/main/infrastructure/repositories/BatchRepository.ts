import { Repository, Like } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Batch } from '../../domain/entities/Batch';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';

export class BatchRepository implements IBatchRepository {
  private readonly repo: Repository<Batch>;

  constructor() {
    this.repo = AppDataSource.getRepository(Batch);
  }

  findById(id: string): Promise<Batch | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByBatchNo(batchNo: string): Promise<Batch | null> {
    return this.repo.findOne({ where: { batchNo } });
  }

  findAll(filters?: { assignedTo?: string; status?: string }): Promise<Batch[]> {
    const where: any = {};
    if (filters?.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.repo.find({
      where,
      relations: [
        'item',
        'party',
        'transactions',
        'transactions.party',
        'transactions.finishedItem',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  save(batch: Batch): Promise<Batch> {
    return this.repo.save(batch);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<{ items: Batch[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.repo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.item', 'item')
      .leftJoinAndSelect('batch.party', 'party')
      .leftJoinAndSelect('batch.transactions', 'transactions')
      .leftJoinAndSelect('transactions.party', 'trxParty')
      .leftJoinAndSelect('transactions.finishedItem', 'finishedItem')
      .leftJoinAndSelect('transactions.debitAccount', 'debitAccount')
      .orderBy('batch.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.batchNo) {
      query.andWhere('batch.batchNo LIKE :batchNo', { batchNo: `%${filters.batchNo}%` });
    }
    if (filters?.assignedTo) {
      query.andWhere('batch.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters?.status) {
      query.andWhere('batch.status = :status', { status: filters.status });
    }
    if (filters?.itemId) {
      query.andWhere('batch.itemId = :itemId', { itemId: filters.itemId });
    }
    if (filters?.partyName) {
      query.andWhere('party.name LIKE :partyName', { partyName: `%${filters.partyName}%` });
    }
    if (filters?.manufacturerName) {
      query.andWhere('trxParty.name LIKE :manufacturerName', {
        manufacturerName: `${filters.manufacturerName}%`,
      });
    }
    if (filters?.karigarName) {
      query.andWhere('trxParty.name LIKE :karigarName', {
        karigarName: `${filters.karigarName}%`,
      });
    }
    if (filters?.startDate) {
      query.andWhere(
        '(transactions.transactionDate >= :startDate OR (transactions.id IS NULL AND batch.createdAt >= :startDatetime))',
        {
          startDate: filters.startDate,
          startDatetime: filters.startDate + ' 00:00:00',
        },
      );
    }
    if (filters?.endDate) {
      query.andWhere(
        '(transactions.transactionDate <= :endDate OR (transactions.id IS NULL AND batch.createdAt <= :endDatetime))',
        {
          endDate: filters.endDate,
          endDatetime: filters.endDate + ' 23:59:59',
        },
      );
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
}
