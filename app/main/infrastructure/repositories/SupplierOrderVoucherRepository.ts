import { AppDataSource } from '../database/data-source';
import { SupplierOrderVoucher } from '../../domain/entities/SupplierOrderVoucher';
import { Repository } from 'typeorm';

export interface SupplierOrderVoucherFilter {
  voucherNo?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  orderType?: string;
  orderStatus?: string;
}

export class SupplierOrderVoucherRepository {
  private readonly repo: Repository<SupplierOrderVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(SupplierOrderVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: SupplierOrderVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('sv')
      .leftJoinAndSelect('sv.voucher', 'voucher')
      .leftJoinAndSelect('sv.account', 'account')
      .leftJoinAndSelect('sv.item', 'item')
      .orderBy('voucher.entryDate', 'DESC')
      .addOrderBy('sv.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.accountName) {
      query.andWhere('account.name LIKE :name', {
        name: `%${filters.accountName}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('voucher.status = :status', { status: filters.status });
    }

    if (filters?.orderType) {
      query.andWhere('sv.orderType = :orderType', { orderType: filters.orderType });
    }

    if (filters?.orderStatus) {
      query.andWhere('sv.orderStatus = :orderStatus', { orderStatus: filters.orderStatus });
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

  async getDetails(voucherId: string): Promise<SupplierOrderVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'account', 'item'],
    });
  }
}
