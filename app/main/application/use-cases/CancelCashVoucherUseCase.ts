import { AppDataSource } from '../../infrastructure/database/data-source';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Account } from '../../domain/entities/Account';

export class CancelCashVoucherUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Find & validate the voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');
      if (voucher.status !== VoucherStatus.POSTED)
        throw new Error('Only POSTED vouchers can be cancelled.');

      // 2. Find the original journal entry for this voucher
      const jeRepo = em.getRepository(JournalEntry);
      const originalJe = await jeRepo.findOne({
        where: { voucherId },
        relations: ['ledgerEntries', 'ledgerEntries.account'],
      });

      if (originalJe && originalJe.ledgerEntries?.length > 0) {
        // Check for freeze dates on reversal date
        const reversalDate = new Date().toISOString().split('T')[0];

        for (const le of originalJe.ledgerEntries) {
          if (le.account) {
            Account.validateFreezeDate(le.account, originalJe.entryDate);
          }
        }

        // 2a. Build a reversal voucher
        const year = new Date().getFullYear();
        const vType = voucher.type;
        const prefix = vType === VoucherType.RECEIPT ? 'RCT' : 'PMT';
        const revVoucherNo = await Voucher.generateNextVoucherNo(em, `${prefix}-REV`, year);

        const revVoucher = new Voucher();
        revVoucher.type = vType;
        revVoucher.entryDate = reversalDate;
        revVoucher.voucherNo = revVoucherNo;
        revVoucher.narration = `Reversal of ${voucher.voucherNo}`;
        revVoucher.status = VoucherStatus.CANCELLED;
        const savedRevVoucher = await em.save(revVoucher);

        // 2b. Build reversal journal entry
        const revJe = new JournalEntry();
        revJe.voucherId = savedRevVoucher.id;
        revJe.entryDate = reversalDate;
        revJe.narration = `Reversal of ${voucher.voucherNo}`;
        revJe.sourceReference = voucherId;
        revJe.status = JournalEntryStatus.POSTED;

        const revEntries: LedgerEntry[] = [];
        for (const le of originalJe.ledgerEntries) {
          const revLe = new LedgerEntry();
          revLe.accountId = le.accountId;
          // Swap debit ↔ credit
          revLe.debitAmount = Number(le.creditAmount);
          revLe.creditAmount = Number(le.debitAmount);
          revLe.debitGold = Number(le.creditGold);
          revLe.creditGold = Number(le.debitGold);
          revLe.narration = `Reversal: ${le.narration ?? ''}`;
          revLe.journalEntry = revJe;
          revEntries.push(revLe);
        }

        revJe.ledgerEntries = revEntries;
        await em.save(revJe);

        // 2c. Void the original journal entry
        originalJe.status = JournalEntryStatus.VOID;
        await jeRepo.save(originalJe);
      }

      // 3. Mark the original voucher as CANCELLED
      voucher.status = VoucherStatus.CANCELLED;
      voucher.narration = `[CANCELLED] ${voucher.narration ?? ''}`.trim();
      await voucherRepo.save(voucher);

      return { success: true };
    });
  }
}
