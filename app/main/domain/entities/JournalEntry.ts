import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { LedgerEntry } from './LedgerEntry';
import { Voucher } from './Voucher';

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOID = 'VOID',
}

/**
 * JournalEntry — Aggregate Root for double-entry accounting.
 * Business Rule: Sum of all debit LedgerEntries MUST equal sum of all credit LedgerEntries.
 */
@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  voucherId!: string;

  @OneToOne(() => Voucher)
  @JoinColumn({ name: 'voucherId' })
  voucher!: Voucher;

  @Column({ type: 'date' })
  entryDate!: string;

  @Column({ type: 'text', nullable: true })
  narration?: string;

  /**
   * Source reference — e.g. batch ID or transaction ID that triggered this entry.
   */
  @Column({ type: 'varchar', nullable: true })
  sourceReference?: string;

  @Column({ type: 'varchar', default: JournalEntryStatus.POSTED })
  status!: JournalEntryStatus;

  @OneToMany(() => LedgerEntry, (le) => le.journalEntry, { cascade: true, eager: true })
  ledgerEntries!: LedgerEntry[];

  @CreateDateColumn()
  createdAt!: Date;
}
