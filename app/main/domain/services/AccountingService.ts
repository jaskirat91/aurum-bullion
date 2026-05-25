import { LedgerEntry } from '../entities/LedgerEntry';
import { JournalEntry } from '../entities/JournalEntry';

/**
 * AccountingService — Domain Service for double-entry accounting rules.
 */
export class AccountingService {
  /**
   * Validates that a journal entry is balanced:
   * sum(debits) === sum(credits)
   *
   * Uses precise integer arithmetic to avoid floating-point errors.
   */
  isBalanced(journalEntry: JournalEntry): boolean {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of journalEntry.ledgerEntries) {
      totalDebit += Math.round(Number(entry.debitAmount) * 1000);
      totalCredit += Math.round(Number(entry.creditAmount) * 1000);
    }

    return totalDebit === totalCredit;
  }

  /**
   * Throws if the journal entry is not balanced.
   */
  assertBalanced(journalEntry: JournalEntry): void {
    if (!this.isBalanced(journalEntry)) {
      const totals = this.getTotals(journalEntry);
      throw new Error(
        `Journal entry is not balanced. Total Debit: ${totals.debit.toFixed(3)}, Total Credit: ${totals.credit.toFixed(3)}`,
      );
    }
  }

  getTotals(journalEntry: JournalEntry): { debit: number; credit: number } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of journalEntry.ledgerEntries) {
      totalDebit += Number(entry.debitAmount);
      totalCredit += Number(entry.creditAmount);
    }

    return {
      debit: Math.round(totalDebit * 1000) / 1000,
      credit: Math.round(totalCredit * 1000) / 1000,
    };
  }

  /**
   * Build a simple debit ledger entry (helper factory).
   */
  buildDebitEntry(accountId: string, amount: number, narration?: string): Partial<LedgerEntry> {
    return { accountId, debitAmount: amount, creditAmount: 0, narration };
  }

  /**
   * Build a simple credit ledger entry (helper factory).
   */
  buildCreditEntry(accountId: string, amount: number, narration?: string): Partial<LedgerEntry> {
    return { accountId, debitAmount: 0, creditAmount: amount, narration };
  }
}
