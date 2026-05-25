import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { Account } from '../../domain/entities/Account';

export interface CreateRateCutDTO {
  partyAccountId: string;
  accountId: string; // Selected Cash/Bank Account
  goldAccountId: string; // Selected Gold Account
  entryDate: string;
  amount: number;
  goldRate: number;
  goldWeight: number;
  narration?: string;
}

export class CreateRateCutUseCase {
  async execute(dto: CreateRateCutDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate party account
      const accountRepo = em.getRepository(Account);
      const partyAccount = await accountRepo.findOne({
        where: { id: dto.partyAccountId },
      });
      if (!partyAccount) throw new Error('Party account not found.');

      Account.validateFreezeDate(partyAccount, dto.entryDate);

      // 2. Validate Cash/Bank account
      const cashAccount = await accountRepo.findOne({
        where: { id: dto.accountId },
      });
      if (!cashAccount) throw new Error('Selected Cash/Bank account not found.');
      Account.validateFreezeDate(cashAccount, dto.entryDate);

      // 3. Validate Gold Account
      const rawGoldAccount = await accountRepo.findOne({
        where: { id: dto.goldAccountId },
      });
      if (!rawGoldAccount) throw new Error('Selected Gold account not found.');
      Account.validateFreezeDate(rawGoldAccount, dto.entryDate);

      // 4. Generate unique Voucher No (Prefix RC)
      const year = new Date(dto.entryDate).getFullYear();
      const voucherNo = await Voucher.generateNextVoucherNo(em, 'RC', year);

      // 5. Generate Narration
      let narration = dto.narration?.trim();
      if (!narration) {
        narration = `Rate Cut Journal Voucher for ${partyAccount.name} \n ${dto.amount} @ ${dto.goldRate} = ${dto.goldWeight} on ${dto.entryDate}`;
      }

      // 6. Create Voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.JOURNAL;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = VoucherStatus.POSTED;
      const savedVoucher = await em.save(voucher);

      // 7. Create Journal Entry
      const je = new JournalEntry();
      je.voucherId = savedVoucher.id;
      je.entryDate = dto.entryDate;
      je.narration = savedVoucher.narration;
      je.sourceReference = savedVoucher.id;
      je.status = JournalEntryStatus.POSTED;

      const entries: LedgerEntry[] = [];

      // a. Debit Amount from Party's Account.
      const partyAmtDr = new LedgerEntry();
      partyAmtDr.accountId = partyAccount.id;
      partyAmtDr.debitAmount = dto.amount;
      partyAmtDr.creditAmount = 0;
      partyAmtDr.narration = `Rate Cut - ${voucherNo}`;
      partyAmtDr.journalEntry = je;
      entries.push(partyAmtDr);

      // b. Credit Amount from our selected Cash/Bank Account.
      const cashAmtCr = new LedgerEntry();
      cashAmtCr.accountId = cashAccount.id;
      cashAmtCr.debitAmount = 0;
      cashAmtCr.creditAmount = dto.amount;
      cashAmtCr.narration = `Rate Cut - ${voucherNo}`;
      cashAmtCr.journalEntry = je;
      entries.push(cashAmtCr);

      // c. Debit Gold Weight from our Gold account.
      const goldStkDr = new LedgerEntry();
      goldStkDr.accountId = rawGoldAccount.id;
      goldStkDr.debitAmount = 0;
      goldStkDr.creditAmount = 0;
      goldStkDr.debitGold = dto.goldWeight;
      goldStkDr.creditGold = 0;
      goldStkDr.narration = `Rate Cut - ${voucherNo}`;
      goldStkDr.journalEntry = je;
      entries.push(goldStkDr);

      // d. Credit Gold Weight from Party's account.
      const partyGoldCr = new LedgerEntry();
      partyGoldCr.accountId = partyAccount.id;
      partyGoldCr.debitAmount = 0;
      partyGoldCr.creditAmount = 0;
      partyGoldCr.debitGold = 0;
      partyGoldCr.creditGold = dto.goldWeight;
      partyGoldCr.narration = `Rate Cut - ${voucherNo}`;
      partyGoldCr.journalEntry = je;
      entries.push(partyGoldCr);

      je.ledgerEntries = entries;
      await em.save(je);

      return { success: true, voucherNo };
    });
  }
}
