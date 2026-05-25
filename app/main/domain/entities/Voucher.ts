import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VoucherType {
  JOURNAL = 'JOURNAL',
  RECEIPT = 'RECEIPT',
  PAYMENT = 'PAYMENT',
  SALES = 'SALES',
  SALE_RETURN = 'SALE_RETURN',
  PURCHASE = 'PURCHASE',
  GOLD = 'GOLD',
  CUSTOMER_ORDER = 'CUSTOMER_ORDER',
  SUPPLIER_ORDER = 'SUPPLIER_ORDER',
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Human-readable reference e.g. JV-2024-001 */
  @Column({ type: 'varchar', length: 100, unique: true })
  voucherNo!: string;

  @Index()
  @Column({ type: 'varchar', enum: VoucherType })
  type!: VoucherType;

  @Index()
  @Column({ type: 'date' })
  entryDate!: string;

  @Index()
  @Column({ type: 'varchar', enum: VoucherStatus, default: VoucherStatus.DRAFT })
  status!: VoucherStatus;

  @Column({ type: 'text', nullable: true })
  narration?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Generates the next voucher number based on a specific prefix.
   * Format: PREFIX-YYYY-XXXX (where XXXX is the next sequential number)
   * Example: generateNextVoucherNo(em, 'JV', 2026) -> 'JV-2026-0001'
   */
  static async generateNextVoucherNo(em: any, prefix: string, year: number): Promise<string> {
    const { Like } = require('typeorm');
    const lastVoucher = await em.getRepository(Voucher).findOne({
      where: { voucherNo: Like(`${prefix}-${year}-%`) },
      order: { createdAt: 'DESC' },
    });

    let nextNum = 1;
    if (lastVoucher && lastVoucher.voucherNo) {
      const parts = lastVoucher.voucherNo.split('-');
      if (parts.length >= 3) {
        // The sequential number is always the last part in PREFIX-YYYY-XXXX
        const lastNumStr = parts[parts.length - 1];
        const lastNum = parseInt(lastNumStr, 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
        }
      }
    }

    return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
  }
}
