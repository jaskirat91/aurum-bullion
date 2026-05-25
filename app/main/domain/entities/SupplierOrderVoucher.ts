import { Voucher } from './Voucher';
import { Account } from './Account';
import { Item } from './Item';
import { OrderStatus } from './OrderStatus';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL',
}

@Entity('supplier_order_vouchers')
export class SupplierOrderVoucher {
  @PrimaryColumn()
  voucherId!: string;

  @OneToOne(() => Voucher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucherId' })
  voucher!: Voucher;

  @Column({ type: 'varchar', enum: OrderType })
  orderType!: OrderType;

  @Column({ type: 'varchar', default: OrderStatus.OPEN })
  orderStatus!: OrderStatus;

  @Column({ type: 'varchar' })
  accountId!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'varchar', nullable: true })
  itemId?: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item?: Item;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  goldWeight?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  goldRate?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
