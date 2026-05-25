import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { AccountingService } from '../../domain/services/AccountingService';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { Account } from '../../domain/entities/Account';
import { In } from 'typeorm';

export interface LedgerEntryDTO {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  debitGold: number;
  creditGold: number;
  narration?: string;
}

export interface CreateJournalEntryDTO {
  entryDate: string; // ISO date string YYYY-MM-DD
  narration?: string;
  sourceReference?: string; // e.g. batchId or transactionId
  lines: LedgerEntryDTO[];
}

export class CreateJournalEntryUseCase {
  private readonly accountingService = new AccountingService();

  async execute(
    dto: CreateJournalEntryDTO,
  ): Promise<{ journalEntryId: string; voucherNo: string }> {
    // Business rule: minimum 2 lines (one debit, one credit)
    if (!dto.lines || dto.lines.length < 2) {
      throw new Error('A journal entry must have at least 2 ledger lines.');
    }

    return AppDataSource.transaction(async (em) => {
      // 1. Validate freeze dates for all accounts involved
      const accountIds = Array.from(new Set(dto.lines.map((l) => l.accountId)));
      const accountRepo = em.getRepository(Account);
      const accounts = await accountRepo.find({ where: { id: In(accountIds) } });

      for (const account of accounts) {
        Account.validateFreezeDate(account, dto.entryDate);
      }

      // 2. Generate voucher number
      const year = new Date(dto.entryDate).getFullYear();
      const voucherNo = await Voucher.generateNextVoucherNo(em, 'JV', year);

      // 3. Build voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.JOURNAL;
      voucher.voucherNo = voucherNo;
      voucher.entryDate = dto.entryDate;
      voucher.narration = dto.narration;
      voucher.status = VoucherStatus.POSTED;
      const savedVoucher = await em.save(voucher);

      // 4. Build JournalEntry aggregate
      const je = new JournalEntry();
      je.voucherId = savedVoucher.id;
      je.entryDate = dto.entryDate;
      je.narration = dto.narration;
      je.sourceReference = dto.sourceReference;
      je.ledgerEntries = [];

      // 5. Build ledger lines
      for (const line of dto.lines) {
        const le = new LedgerEntry();
        le.accountId = line.accountId;
        le.debitAmount = line.debitAmount;
        le.creditAmount = line.creditAmount;
        le.debitGold = line.debitGold;
        le.creditGold = line.creditGold;
        le.narration = line.narration;
        // Trigger @BeforeInsert validation
        le.validateSingleSide();
        je.ledgerEntries.push(le);
      }

      // 6. Validate balance — domain rule enforcement
      this.accountingService.assertBalanced(je);

      // 7. Persist
      const saved = await em.save(je);
      return { journalEntryId: saved.id, voucherNo: savedVoucher.voucherNo };
    });
  }
}
