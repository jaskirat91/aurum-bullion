import { AppDataSource } from '../database/data-source';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { Voucher, VoucherType } from '../../domain/entities/Voucher';
import { Repository } from 'typeorm';

export interface SaleVoucherFilter {
  voucherNo?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class SaleVoucherRepository {
  private readonly repo: Repository<SaleVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(SaleVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: SaleVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('sv')
      .leftJoinAndSelect('sv.voucher', 'voucher')
      .leftJoinAndSelect('sv.customer', 'customer')
      .orderBy('voucher.entryDate', 'DESC')
      .addOrderBy('sv.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.customerName) {
      query.andWhere('customer.name LIKE :name', {
        name: `%${filters.customerName}%`,
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

  async getDetails(voucherId: string): Promise<SaleVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'customer', 'items', 'items.product'],
    });
  }

  async generateNextVoucherNo(): Promise<string> {
    const year = new Date().getFullYear();
    const voucherRepo = AppDataSource.getRepository(Voucher);
    
    const lastVoucher = await voucherRepo.findOne({
      where: { type: VoucherType.SALES },
      order: { createdAt: 'DESC' },
    });

    let nextNum = 1;
    if (lastVoucher && lastVoucher.voucherNo) {
      const parts = lastVoucher.voucherNo.split('-');
      if (parts.length === 3) {
        const lastNum = parseInt(parts[2], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
    }

    return `SV-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async getFullDetails(voucherId: string): Promise<any | null> {
    const sv = await this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'customer'],
    });
    if (!sv) return null;

    const itemRepo = AppDataSource.getRepository(SaleVoucherItem);
    const items = await itemRepo.find({
      where: { voucherId },
      relations: ['product', 'product.finishedItem'],
    });

    return {
      voucherId: sv.voucherId,
      voucher: sv.voucher,
      customer: sv.customer,
      items: items.map(i => ({
        id: i.id,
        productId: i.productId,
        tag: i.product?.tag ?? '—',
        itemName: i.product?.finishedItem?.name ?? '—',
        purityPercentage: Number(i.goldPurity ?? 0),
        goldWeight: Number(i.netGoldWeight ?? 0),
        labourPercentage: Number(i.amountPercentage ?? 0),
        labourAmount: Number(i.soldAmount ?? 0),
        tagNetWeight: Number(i.product?.tagNetWeight ?? 0),
        tagAmount: Number(i.product?.tagAmount ?? 0),
      })),
    };
  }
}
