import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Batch } from './Batch';
import { Party } from './Party';
import { Item } from './Item';
import { Account } from './Account';

export enum TransactionType {
  RECEIPT = 'RECEIPT',
  ISSUE_TO_KARIGAR = 'ISSUE_TO_KARIGAR',
  RECEIVE_FROM_KARIGAR = 'RECEIVE_FROM_KARIGAR',
}

@Entity('material_transactions')
@Index('IDX_MT_BATCH', ['batchId'])
@Index('IDX_MT_PARTY', ['partyId'])
@Index('IDX_MT_DATE', ['createdAt'])
export class MaterialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  type!: TransactionType;

  @Column({ type: 'date', nullable: true })
  transactionDate!: string;

  @Column()
  batchId!: string;

  @ManyToOne(() => Batch)
  @JoinColumn({ name: 'batchId' })
  batch!: Batch;

  @Column()
  partyId!: string;

  @ManyToOne(() => Party)
  @JoinColumn({ name: 'partyId' })
  party!: Party;

  @Column({ nullable: true })
  finishedItemId?: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'finishedItemId' })
  finishedItem?: Item;

  @Column({ nullable: true })
  debitAccountId?: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'debitAccountId' })
  debitAccount?: Account;

  // ─── Primary Gold Weights ────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  grossGoldWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  lessWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  netWeight!: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  tenchPercentage!: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  wastePercentage!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  netPureGoldWeight!: number;

  // ─── Stone & Kundan Details ──────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  kundanWeight!: number;

  @Column({ type: 'integer', default: 0 })
  totalStones!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  labourPerStone!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalStoneLabour!: number;

  // ─── Gross / Breakdown Weights ───────────────────────────────────────────
  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  grossWeightOfItems!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  piroiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  bStoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  stoneWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  taarPattiWeight!: number;

  @Column({ type: 'decimal', precision: 14, scale: 3, default: 0 })
  colorStoneWeight!: number;

  // ─── Tag / Label Weights (finished product tag details) ──────────────────
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

  // ─── Timestamps ──────────────────────────────────────────────────────────
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
