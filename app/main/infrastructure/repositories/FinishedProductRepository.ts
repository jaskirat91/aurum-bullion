import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import {
  IFinishedProductRepository,
  FinishedProductFilter,
  FinishedProductTotals,
} from '../../domain/repositories/IFinishedProductRepository';

export class FinishedProductRepository implements IFinishedProductRepository {
  private readonly repo: Repository<FinishedProduct>;

  constructor() {
    this.repo = AppDataSource.getRepository(FinishedProduct);
  }

  findById(id: string): Promise<FinishedProduct | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByBatchId(batchId: string): Promise<FinishedProduct[]> {
    return this.repo.find({ where: { batchId }, order: { createdAt: 'DESC' } });
  }

  findByStatus(status: FinishedProductStatus): Promise<FinishedProduct[]> {
    return this.repo.find({ where: { status }, order: { createdAt: 'DESC' } });
  }

  findAll(): Promise<FinishedProduct[]> {
    return this.repo.find({
      relations: ['finishedItem', 'batch', 'party'],
      order: { createdAt: 'DESC' },
    });
  }

  async findWithFilters(
    filter: FinishedProductFilter,
  ): Promise<{ items: FinishedProduct[]; total: number; totals?: FinishedProductTotals }> {
    const { itemId, batchNo, status, startDate, endDate, partyId, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('fp')
      .leftJoinAndSelect('fp.finishedItem', 'item')
      .leftJoinAndSelect('fp.batch', 'batch')
      .leftJoinAndSelect('fp.party', 'party')
      .orderBy('fp.createdAt', 'DESC');

    if (itemId) {
      query.andWhere('fp.finishedItemId = :itemId', { itemId });
    }

    if (batchNo) {
      query.andWhere('batch.batchNo LIKE :batchNo', { batchNo: `%${batchNo}%` });
    }

    if (status) {
      query.andWhere('fp.status = :status', { status });
    }

    if (startDate) {
      query.andWhere('fp.transactionDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('fp.transactionDate <= :endDate', { endDate });
    }

    if (partyId) {
      query.andWhere('fp.partyId = :partyId', { partyId });
    }

    if (filter.grossWeight) {
      query.andWhere('CAST(fp.tagGrossWeight AS VARCHAR) like :grossWeight', {
        grossWeight: `${filter.grossWeight}%`,
      });
    }

    // Clone query for totals before pagination
    const totalsQuery = query
      .clone()
      .select('SUM(fp.tagGrossWeight)', 'grossWeight')
      .addSelect('SUM(fp.tagKundanWeight)', 'kundanWeight')
      .addSelect('SUM(fp.tagMottiWeight)', 'mottiWeight')
      .addSelect('SUM(fp.tagStoneWeight)', 'stoneWeight')
      .addSelect('SUM(fp.tagNetWeight)', 'netWeight')
      .addSelect('SUM(fp.tagAmount)', 'amount');

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();
    const rawTotals = await totalsQuery.getRawOne();

    const totals: FinishedProductTotals = {
      grossWeight: parseFloat(rawTotals.grossWeight) || 0,
      kundanWeight: parseFloat(rawTotals.kundanWeight) || 0,
      mottiWeight: parseFloat(rawTotals.mottiWeight) || 0,
      stoneWeight: parseFloat(rawTotals.stoneWeight) || 0,
      netWeight: parseFloat(rawTotals.netWeight) || 0,
      amount: parseFloat(rawTotals.amount) || 0,
    };

    return { items, total, totals };
  }

  save(product: FinishedProduct): Promise<FinishedProduct> {
    return this.repo.save(product);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
