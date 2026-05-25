import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Group } from './Group';
import { Account } from './Account';

export enum BalanceType {
  CR = 'CR',
  DR = 'DR',
}

export enum PartyType {
  MANUFACTURER = 'MANUFACTURER',
  KARIGAR = 'KARIGAR',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER', // For Bullion Dealers
}

@Entity('parties')
export class Party {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address_line1?: string;

  @Column({ type: 'text', nullable: true })
  address_line2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pincode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'India' })
  country?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gst_number?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  pan_number?: string;

  /** Party Type - Mandatory */
  @Column({ type: 'varchar', length: 50 })
  type!: PartyType;

  @Column({ type: 'varchar', nullable: true })
  group_id?: string;

  @ManyToOne(() => Group, { nullable: true, eager: false })
  @JoinColumn({ name: 'group_id' })
  group?: Group;

  @Column({ type: 'varchar', nullable: true })
  ledger_account_id?: string;

  @ManyToOne(() => Account, { nullable: true, eager: false })
  @JoinColumn({ name: 'ledger_account_id' })
  ledgerAccount?: Account;

  /** Opening gold balance in grams (3 decimal places) */
  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  opening_gold_balance!: number;

  @Column({ type: 'varchar', default: BalanceType.DR })
  opening_gold_balance_type!: BalanceType;

  /** Opening amount balance in INR */
  @Column({ type: 'decimal', precision: 16, scale: 3, default: 0 })
  opening_amount_balance!: number;

  @Column({ type: 'varchar', default: BalanceType.DR })
  opening_amount_balance_type!: BalanceType;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn({ nullable: true })
  updated_at?: Date;
}
