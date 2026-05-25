import { JournalEntry } from '../entities/JournalEntry';

export interface JournalFilter {
  voucherNo?: string;
  sourceReference?: string;
  startDate?: string;
  endDate?: string;
}

export interface IJournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  findBySourceReference(sourceRef: string): Promise<JournalEntry[]>;
  findAll(): Promise<JournalEntry[]>;
  findPaginated(
    page: number,
    limit: number,
    filters?: JournalFilter,
  ): Promise<{ items: JournalEntry[]; total: number }>;
  findAllFiltered(filters?: JournalFilter): Promise<JournalEntry[]>;
  getDetails(id: string): Promise<JournalEntry | null>;
  save(entry: JournalEntry): Promise<JournalEntry>;
  /** Generate the next sequential voucher number e.g. JV-2024-001 */
  generateNextVoucherNo(): Promise<string>;
}
