import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Batch } from './Batch';
import { Party } from './Party';
import { Item } from './Item';
import { LedgerEntry } from './LedgerEntry';

export enum FinishedProductStatus {
  IN_STOCK = 'IN_STOCK',
  SOLD = 'SOLD',
}

@Entity('finished_products')
export class FinishedProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  batchId?: string;

  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batchId' })
  batch?: Batch;

  @Column({ type: 'varchar' })
  tag!: string;
  /**
   * Optional — if set, the product has been sold to this party.
   */
  @Column({ type: 'varchar', nullable: true })
  partyId?: string;

  @ManyToOne(() => Party, { nullable: true })
  @JoinColumn({ name: 'partyId' })
  party?: Party;

  @Column({ type: 'varchar' })
  finishedItemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'finishedItemId' })
  finishedItem!: Item;

  /** All weights in grams with 3 decimal places */
  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  grossWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  kundanWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  stoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  mottiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  piroiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  netWeight!: number;

  /** Purity as a percentage e.g. 91.67 for 22K */
  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  purityPercentage!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  pureGoldWeight!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  labourCost!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  tagGrossWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  tagKundanWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  tagStoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  tagMottiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  tagNetWeight!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tagAmount!: number;

  @Column({ type: 'integer', default: 0 })
  totalStones!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  bStoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  colorStoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  taarPattiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  grossWeightOfItems!: number;

  @Column({ type: 'varchar', default: FinishedProductStatus.IN_STOCK })
  status!: FinishedProductStatus;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  soldGoldPercentage?: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, nullable: true })
  soldGoldWeight?: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, nullable: true })
  soldAmountPercentage?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  soldAmount?: number;

  @Column({ type: 'varchar', nullable: true })
  goldLedgerEntryId?: string;

  @OneToOne(() => LedgerEntry, { nullable: true })
  @JoinColumn({ name: 'goldLedgerEntryId' })
  goldLedgerEntry?: LedgerEntry;

  @Column({ type: 'varchar', nullable: true })
  amountLedgerEntryId?: string;

  @OneToOne(() => LedgerEntry, { nullable: true })
  @JoinColumn({ name: 'amountLedgerEntryId' })
  amountLedgerEntry?: LedgerEntry;

  @Column({ type: 'date', nullable: true })
  transactionDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
