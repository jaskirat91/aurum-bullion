import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SaleReturnVoucher } from './SaleReturnVoucher';
import { FinishedProduct } from './FinishedProduct';

@Entity('sale_return_voucher_items')
export class SaleReturnVoucherItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  voucherId!: string;

  @ManyToOne(() => SaleReturnVoucher, (sv) => sv.items)
  @JoinColumn({ name: 'voucherId' })
  voucher!: SaleReturnVoucher;

  @Column({ type: 'varchar', nullable: true })
  productId!: string | null;

  @ManyToOne(() => FinishedProduct, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product!: FinishedProduct | null;

  // Flag to distinguish items that were not created in this system (old items)
  @Column({ type: 'boolean', default: false })
  isOldItem!: boolean;

  // For old items: display name (finished item name entered manually)
  @Column({ type: 'varchar', nullable: true })
  oldItemName!: string | null;

  // For old items: the tag/label entered manually
  @Column({ type: 'varchar', nullable: true })
  oldItemTag!: string | null;

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

  // Tag specification columns — only populated for old items (isOldItem = true)
  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  tagGrossWeight?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  tagKundanWeight?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  tagStoneWeight?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  tagMottiWeight?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  tagNetWeight?: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  tagAmount?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
