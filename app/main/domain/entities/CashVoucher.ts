import { Voucher } from './Voucher';
import { Account } from './Account';
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
import { CustomerOrderVoucher } from './CustomerOrderVoucher';
import { SupplierOrderVoucher } from './SupplierOrderVoucher';

@Entity('cash_vouchers')
export class CashVoucher {
  @PrimaryColumn()
  voucherId!: string;

  @OneToOne(() => Voucher)
  @JoinColumn({ name: 'voucherId' })
  voucher!: Voucher;

  @Column({ type: 'varchar' })
  partyAccountId!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'partyAccountId' })
  partyAccount!: Account;

  @Column({ type: 'varchar' })
  accountId!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  receiptAmount?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  paymentAmount?: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  goldRate?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  goldWeight?: number;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  remarksTime?: string;

  @Column({ type: 'varchar', nullable: true })
  customerOrderVoucherId?: string;

  @Column({ type: 'varchar', nullable: true })
  supplierOrderVoucherId?: string;

  @ManyToOne(() => CustomerOrderVoucher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerOrderVoucherId' })
  customerOrderVoucher?: CustomerOrderVoucher;

  @ManyToOne(() => SupplierOrderVoucher, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierOrderVoucherId' })
  supplierOrderVoucher?: SupplierOrderVoucher;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
