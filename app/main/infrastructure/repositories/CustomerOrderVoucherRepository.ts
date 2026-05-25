import { AppDataSource } from '../database/data-source';
import { CustomerOrderVoucher } from '../../domain/entities/CustomerOrderVoucher';
import { Repository } from 'typeorm';

export interface CustomerOrderVoucherFilter {
  voucherNo?: string;
  accountName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  orderType?: string;
  orderStatus?: string;
}

export class CustomerOrderVoucherRepository {
  private readonly repo: Repository<CustomerOrderVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(CustomerOrderVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: CustomerOrderVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('cv')
      .leftJoinAndSelect('cv.voucher', 'voucher')
      .leftJoinAndSelect('cv.account', 'account')
      .leftJoinAndSelect('cv.item', 'item')
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
      query.andWhere('account.name LIKE :name', {
        name: `%${filters.accountName}%`,
      });
    }

    if (filters?.status) {
      query.andWhere('voucher.status = :status', { status: filters.status });
    }

    if (filters?.orderType) {
      query.andWhere('cv.orderType = :orderType', { orderType: filters.orderType });
    }

    if (filters?.orderStatus) {
      query.andWhere('cv.orderStatus = :orderStatus', { orderStatus: filters.orderStatus });
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

  async getDetails(voucherId: string): Promise<CustomerOrderVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'account', 'item'],
    });
  }
}
