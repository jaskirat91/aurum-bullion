import { AppDataSource } from '../database/data-source';
import { CashVoucher } from '../../domain/entities/CashVoucher';
import { Voucher, VoucherType } from '../../domain/entities/Voucher';
import { Repository } from 'typeorm';

export interface CashVoucherFilter {
  voucherNo?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
}

export class CashVoucherRepository {
  private readonly repo: Repository<CashVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(CashVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: CashVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.voucher', 'voucher')
      .leftJoinAndSelect('cv.partyAccount', 'partyAccount')
      .leftJoinAndSelect('cv.customerOrderVoucher', 'cov')
      .leftJoinAndSelect('cv.supplierOrderVoucher', 'sov')
      .leftJoinAndSelect('cov.voucher', 'customerOrderVoucher')
      .leftJoinAndSelect('sov.voucher', 'supplierOrderVoucher')
      .orderBy('voucher.entryDate', 'DESC')
      .addOrderBy('cv.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.accountName) {
      query.andWhere('partyAccount.name LIKE :name', {
        name: `%${filters.accountName}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('voucher.status = :status', { status: filters.status });
    }

    if (filters?.type) {
      query.andWhere('voucher.type = :type', { type: filters.type });
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

  async getDetails(voucherId: string): Promise<CashVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: [
        'voucher',
        'partyAccount',
        'account',
        'customerOrderVoucher',
        'supplierOrderVoucher',
      ],
    });
  }

  async generateNextVoucherNo(type: VoucherType): Promise<string> {
    const year = new Date().getFullYear();
    const voucherRepo = AppDataSource.getRepository(Voucher);

    // Find the last voucher of this specific type (RECEIPT or PAYMENT)
    const lastVoucher = await voucherRepo.findOne({
      where: { type },
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

    const prefix = type === VoucherType.RECEIPT ? 'RCT' : 'PMT';
    return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
