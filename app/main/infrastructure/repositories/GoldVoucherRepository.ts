import { AppDataSource } from '../database/data-source';
import { GoldVoucher } from '../../domain/entities/GoldVoucher';
import { Voucher, VoucherType } from '../../domain/entities/Voucher';
import { Repository } from 'typeorm';

export interface GoldVoucherFilter {
  voucherNo?: string;
  partyName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class GoldVoucherRepository {
  private readonly repo: Repository<GoldVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(GoldVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: GoldVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('gv')
      .leftJoinAndSelect('gv.voucher', 'voucher')
      .leftJoinAndSelect('gv.partyAccount', 'partyAccount')
      .orderBy('voucher.entryDate', 'DESC')
      .addOrderBy('gv.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.partyName) {
      query.andWhere('partyAccount.name LIKE :name', {
        name: `%${filters.partyName}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('voucher.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('voucher.entryDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters?.startDate) {
      query.andWhere('voucher.entryDate >= :start', { start: filters.startDate });
    } else if (filters?.endDate) {
      query.andWhere('voucher.entryDate <= :end', { end: filters.endDate });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async getDetails(voucherId: string): Promise<GoldVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'partyAccount'],
    });
  }

  async generateNextVoucherNo(): Promise<string> {
    const year = new Date().getFullYear();
    const voucherRepo = AppDataSource.getRepository(Voucher);
    const lastVoucher = await voucherRepo.findOne({
      where: { type: VoucherType.GOLD },
      order: { createdAt: 'DESC' },
    });

    let nextNum = 1;
    if (lastVoucher && lastVoucher.voucherNo) {
      const parts = lastVoucher.voucherNo.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }

    return `GOLD-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
