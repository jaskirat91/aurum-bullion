import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { SaleVoucher } from './SaleVoucher';
import { FinishedProduct } from './FinishedProduct';

@Entity('sale_voucher_items')
export class SaleVoucherItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  voucherId!: string;

  @ManyToOne(() => SaleVoucher, (sv) => sv.items)
  @JoinColumn({ name: 'voucherId' })
  voucher!: SaleVoucher;

  @Column({ type: 'varchar' })
  productId!: string;

  @ManyToOne(() => FinishedProduct)
  @JoinColumn({ name: 'productId' })
  product!: FinishedProduct;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  netGoldWeight!: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  goldPurity?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  pureGoldWeight?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netAmount!: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  amountPercentage?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  soldAmount?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
