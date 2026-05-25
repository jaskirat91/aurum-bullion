import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Party, PartyType } from '../../domain/entities/Party';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';

export interface IssueGoldEquityDTO {
  partyId: string;
  pureGoldWeight: number;
  equityAmount: number;
  entryDate: string;
  type: 'ISSUE' | 'RECEIPT';
}

export class IssueGoldEquityUseCase {
  async execute(dto: IssueGoldEquityDTO): Promise<{ journalEntryId: string; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Load settings and party
      const settings = await em.getRepository(CompanySetting).findOne({ where: {} });
      if (!settings || !settings.defaultGoldLedgerId || !settings.defaultCashLedgerId) {
        throw new Error(
          'Default Gold or Cash ledger account not configured. Check company settings.',
        );
      }

      const party = await em.getRepository(Party).findOne({ where: { id: dto.partyId } });
      if (!party || !party.ledger_account_id) {
        throw new Error('Selected party does not have a linked ledger account.');
      }

      // 2. Build Voucher
      const isIssue = dto.type === 'ISSUE';
      const year = new Date(dto.entryDate).getFullYear();
      const prefix = isIssue ? 'GOLD-ISSUE' : 'GOLD-RCPT';
      const narration = isIssue
        ? `Gold/Equity Issued to ${party.name}`
        : `Gold/Equity Received from ${party.name}`;

      const count = await em.getRepository(JournalEntry).count();
      const voucherNo = await Voucher.generateNextVoucherNo(em, prefix, year);

      const voucher = new Voucher();
      voucher.type = isIssue ? VoucherType.PAYMENT : VoucherType.RECEIPT;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = VoucherStatus.POSTED;
      const savedVoucher = await em.save(voucher);

      // 3. Create Journal Entry
      const je = new JournalEntry();
      je.voucherId = savedVoucher.id;
      je.entryDate = dto.entryDate;
      je.narration = narration;

      const entries: LedgerEntry[] = [];

      // Logic:
      // if ISSUE (Payment):
      // Party Account: DR Gold (Weight), DR Amount (Cash)
      // Our Gold Account: CR Gold (Weight)
      // Our Cash Account: CR Amount (Cash)
      // if RECEIPT:
      // Party Account: CR Gold (Weight), CR Amount (Cash)
      // Our Gold Account: DR Gold (Weight)
      // Our Cash Account: DR Amount (Cash)

      if (isIssue) {
        // Party Line (DR)
        const partyLine = new LedgerEntry();
        partyLine.accountId = party.ledger_account_id!;
        partyLine.debitGold = dto.pureGoldWeight || 0;
        partyLine.creditGold = 0;
        partyLine.debitAmount = dto.equityAmount || 0;
        partyLine.creditAmount = 0;
        partyLine.narration = `Issued Gold: ${dto.pureGoldWeight}g | Equity: ₹${dto.equityAmount}`;
        partyLine.journalEntry = je;
        entries.push(partyLine);

        // Gold Account Line (CR)
        if (dto.pureGoldWeight > 0) {
          const goldLine = new LedgerEntry();
          goldLine.accountId = settings.defaultGoldLedgerId;
          goldLine.debitGold = 0;
          goldLine.creditGold = dto.pureGoldWeight;
          goldLine.debitAmount = 0;
          goldLine.creditAmount = 0;
          goldLine.narration = `Gold Issued to ${party.name}`;
          goldLine.journalEntry = je;
          entries.push(goldLine);
        }

        // Cash Account Line (CR)
        if (dto.equityAmount > 0) {
          const cashLine = new LedgerEntry();
          cashLine.accountId = settings.defaultCashLedgerId;
          cashLine.debitGold = 0;
          cashLine.creditGold = 0;
          cashLine.debitAmount = 0;
          cashLine.creditAmount = dto.equityAmount;
          cashLine.narration = `Equity Issued to ${party.name}`;
          cashLine.journalEntry = je;
          entries.push(cashLine);
        }
      } else {
        // Party Line (CR)
        const partyLine = new LedgerEntry();
        partyLine.accountId = party.ledger_account_id!;
        partyLine.debitGold = 0;
        partyLine.creditGold = dto.pureGoldWeight || 0;
        partyLine.debitAmount = 0;
        partyLine.creditAmount = dto.equityAmount || 0;
        partyLine.narration = `Received Gold: ${dto.pureGoldWeight}g | Equity: ₹${dto.equityAmount}`;
        partyLine.journalEntry = je;
        entries.push(partyLine);

        // Gold Account Line (DR)
        if (dto.pureGoldWeight > 0) {
          const goldLine = new LedgerEntry();
          goldLine.accountId = settings.defaultGoldLedgerId;
          goldLine.debitGold = dto.pureGoldWeight;
          goldLine.creditGold = 0;
          goldLine.debitAmount = 0;
          goldLine.creditAmount = 0;
          goldLine.narration = `Gold Received from ${party.name}`;
          goldLine.journalEntry = je;
          entries.push(goldLine);
        }

        // Cash Account Line (DR)
        if (dto.equityAmount > 0) {
          const cashLine = new LedgerEntry();
          cashLine.accountId = settings.defaultCashLedgerId;
          cashLine.debitGold = 0;
          cashLine.creditGold = 0;
          cashLine.debitAmount = dto.equityAmount;
          cashLine.creditAmount = 0;
          cashLine.narration = `Equity Received from ${party.name}`;
          cashLine.journalEntry = je;
          entries.push(cashLine);
        }
      }

      je.ledgerEntries = entries;

      // 4. Save
      const saved = await em.save(je);
      return { journalEntryId: saved.id, voucherNo };
    });
  }
}
