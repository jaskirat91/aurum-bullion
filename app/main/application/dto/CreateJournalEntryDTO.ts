export interface LedgerEntryDTO {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

export interface CreateJournalEntryDTO {
  entryDate: string;          // ISO date string YYYY-MM-DD
  narration?: string;
  sourceReference?: string;   // e.g. batchId or transactionId
  unit?: string;              // 'INR' | 'GRAM'
  lines: LedgerEntryDTO[];
}
