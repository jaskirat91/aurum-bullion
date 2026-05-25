import { AppDataSource } from '../database/data-source';
import { SaleReturnVoucher } from '../../domain/entities/SaleReturnVoucher';
import { SaleReturnVoucherItem } from '../../domain/entities/SaleReturnVoucherItem';
import { Voucher, VoucherType } from '../../domain/entities/Voucher';
import { Repository } from 'typeorm';

export interface SaleReturnVoucherFilter {
  voucherNo?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class SaleReturnVoucherRepository {
  private readonly repo: Repository<SaleReturnVoucher>;

  constructor() {
    this.repo = AppDataSource.getRepository(SaleReturnVoucher);
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: SaleReturnVoucherFilter,
  ): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const query = this.repo
      .createQueryBuilder('srv')
      .leftJoinAndSelect('srv.voucher', 'voucher')
      .leftJoinAndSelect('srv.customer', 'customer')
      .orderBy('voucher.entryDate', 'DESC')
      .addOrderBy('srv.createdAt', 'DESC')
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

  async getDetails(voucherId: string): Promise<SaleReturnVoucher | null> {
    return this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'customer', 'items', 'items.product'],
    });
  }

  async generateNextVoucherNo(): Promise<string> {
    const year = new Date().getFullYear();
    const voucherRepo = AppDataSource.getRepository(Voucher);
    
    const lastVoucher = await voucherRepo.findOne({
      where: { type: VoucherType.SALE_RETURN },
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

    return `SRV-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async getFullDetails(voucherId: string): Promise<any | null> {
    const srv = await this.repo.findOne({
      where: { voucherId },
      relations: ['voucher', 'customer'],
    });
    if (!srv) return null;

    const itemRepo = AppDataSource.getRepository(SaleReturnVoucherItem);
    const items = await itemRepo.find({
      where: { voucherId },
      relations: ['product', 'product.finishedItem'],
    });

    return {
      voucherId: srv.voucherId,
      voucher: srv.voucher,
      customer: srv.customer,
      items: items.map(i => ({
        id: i.id,
        productId: i.productId ?? '',          // null → '' so frontend dual-guard works
        isOldItem: !!i.isOldItem,
        oldItemName: i.oldItemName ?? undefined,
        oldItemTag: i.oldItemTag ?? undefined,
        // Tag spec inputs
        tagGrossWeight: Number(i.tagGrossWeight ?? 0),
        tagKundanWeight: Number(i.tagKundanWeight ?? 0),
        tagStoneWeight: Number(i.tagStoneWeight ?? 0),
        tagMottiWeight: Number(i.tagMottiWeight ?? 0),
        // For system items, these come from the product. For old items, they are persisted in srv_items.
        tagNetWeight: i.isOldItem ? Number(i.tagNetWeight ?? 0) : Number(i.product?.tagNetWeight ?? 0),
        tagAmount: i.isOldItem ? Number(i.tagAmount ?? 0) : Number(i.product?.tagAmount ?? 0),
        // For display: fall back to old item fields when no system product
        tag: i.isOldItem ? (i.oldItemTag ?? '—') : (i.product?.tag ?? '—'),
        itemName: i.isOldItem ? (i.oldItemName ?? '—') : (i.product?.finishedItem?.name ?? '—'),
        purityPercentage: Number(i.goldPurity ?? 0),
        goldWeight: Number(i.netGoldWeight ?? 0),
        labourPercentage: Number(i.amountPercentage ?? 0),
        labourAmount: Number(i.soldAmount ?? 0),
      })),
    };
  }
}
