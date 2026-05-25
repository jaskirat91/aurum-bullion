import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { JournalEntry } from './JournalEntry';
import { Account } from './Account';

/**
 * LedgerEntry — a single debit OR credit line in a journal entry.
 * Business Rule: A LedgerEntry must be EITHER debit OR credit — never both.
 */
@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  journalEntryId!: string;

  @ManyToOne(() => JournalEntry, (je) => je.ledgerEntries)
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry!: JournalEntry;

  @Column({ type: 'varchar' })
  accountId!: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  /**
   * Debit amount in INR — must be 0 if this is a credit line.
   */
  @Column({ type: 'decimal', precision: 16, scale: 3, default: 0 })
  debitAmount!: number;

  /**
   * Credit amount in INR — must be 0 if this is a debit line.
   */
  @Column({ type: 'decimal', precision: 16, scale: 3, default: 0 })
  creditAmount!: number;

  /**
   * Debit weight in Gold (grams)
   */
  @Column({ type: 'decimal', precision: 16, scale: 3, default: 0 })
  debitGold!: number;

  /**
   * Credit weight in Gold (grams)
   */
  @Column({ type: 'decimal', precision: 16, scale: 3, default: 0 })
  creditGold!: number;

  @Column({ type: 'text', nullable: true })
  narration?: string;

  @CreateDateColumn()
  createdAt!: Date;

  /** Enforces business rules: 
   * 1. Cannot have both debit and credit of the same type (Amount or Gold)
   * 2. Must have at least one non-zero value among the four fields.
   */
  @BeforeInsert()
  validateSingleSide() {
    const hasDebitAmount = Number(this.debitAmount) > 0;
    const hasCreditAmount = Number(this.creditAmount) > 0;
    const hasDebitGold = Number(this.debitGold) > 0;
    const hasCreditGold = Number(this.creditGold) > 0;

    if (hasDebitAmount && hasCreditAmount) {
      throw new Error('LedgerEntry cannot have both debit and credit amounts set.');
    }
    if (hasDebitGold && hasCreditGold) {
      throw new Error('LedgerEntry cannot have both debit and credit gold weight set.');
    }
    if (!hasDebitAmount && !hasCreditAmount && !hasDebitGold && !hasCreditGold) {
      throw new Error('LedgerEntry must have at least one amount or gold weight set.');
    }
  }
}
