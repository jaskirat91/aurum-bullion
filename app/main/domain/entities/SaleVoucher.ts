import { Party } from './Party';
import { SaleVoucherItem } from './SaleVoucherItem';
import { Voucher } from './Voucher';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sale_vouchers')
export class SaleVoucher {
  @PrimaryColumn()
  voucherId!: string;

  @OneToOne(() => Voucher)
  @JoinColumn({ name: 'voucherId' })
  voucher!: Voucher;

  @Index()
  @Column({ type: 'varchar' })
  customerId!: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'customerId' })
  customer!: Party;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  totalGoldWeight?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalAmount?: number;

  @OneToMany(() => SaleVoucherItem, (item) => item.voucher)
  items!: SaleVoucherItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
