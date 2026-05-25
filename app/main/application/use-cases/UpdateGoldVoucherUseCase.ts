import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { GoldVoucher } from '../../domain/entities/GoldVoucher';
import { Account } from '../../domain/entities/Account';
import { CreateGoldVoucherDTO } from './CreateGoldVoucherUseCase';

export class UpdateGoldVoucherUseCase {
  async execute(voucherId: string, dto: CreateGoldVoucherDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate the existing voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');
      
      const gvRepo = em.getRepository(GoldVoucher);
      const accountRepo = em.getRepository(Account);

      // 1.1 Check Freeze Date for OLD party account at OLD date
      const oldGv = await gvRepo.findOne({ where: { voucherId } });
      if (oldGv) {
        const oldPartyAccount = await accountRepo.findOne({ where: { id: oldGv.partyAccountId } });
        if (oldPartyAccount) Account.validateFreezeDate(oldPartyAccount, voucher.entryDate);
      }
      
      // If the user wants to edit, we should probably allow even if POSTED, 
      // but we need to handle the ledger entries accordingly.
      // For now, let's allow editing but we will replace the JournalEntry if it exists.

      // 2. Validate party account
      const partyAccount = await accountRepo.findOne({
        where: { id: dto.partyAccountId },
      });
      if (!partyAccount) throw new Error('Party account not found.');

      Account.validateFreezeDate(partyAccount, dto.entryDate);

      // 3. Load settings for default ledgers
      const settings = await em.getRepository(CompanySetting).findOne({ where: {} });
      if (!settings || !settings.defaultGoldLedgerId || !settings.defaultCashLedgerId) {
        throw new Error('Default Gold or Cash ledger account not configured.');
      }

      // 4. Update Voucher base
      let finalNarration = dto.narration;
      if (!finalNarration) {
        const rGold = dto.receiptGold || 0;
        const iGold = dto.issueGold || 0;
        const rAmt = dto.receiptAmount || 0;
        const iAmt = dto.issueAmount || 0;
        
        const parts: string[] = [];
        if (rGold > 0 || rAmt > 0) {
          const g = rGold > 0 ? `${rGold.toFixed(3)}g gold` : '';
          const a = rAmt > 0 ? `₹${rAmt.toLocaleString()}` : '';
          parts.push(`Received from ${partyAccount.name}: ${g}${g && a ? ' and ' : ''}${a}`);
        }
        if (iGold > 0 || iAmt > 0) {
          const g = iGold > 0 ? `${iGold.toFixed(3)}g gold` : '';
          const a = iAmt > 0 ? `₹${iAmt.toLocaleString()}` : '';
          parts.push(`Issued to ${partyAccount.name}: ${g}${g && a ? ' and ' : ''}${a}`);
        }
        finalNarration = parts.join('. ') || `Gold Voucher - ${voucher.voucherNo}`;
      }

      // 4. Load existing GoldVoucher for comparison
      const gv = await gvRepo.findOne({ where: { voucherId } });
      if (!gv) throw new Error('Gold voucher details not found.');

      // 5. Check if significant values changed
      const oldReceiptGold = Number(gv.receiptGold || 0);
      const newReceiptGold = Number(dto.receiptGold || 0);
      const oldIssueGold = Number(gv.issueGold || 0);
      const newIssueGold = Number(dto.issueGold || 0);
      const oldReceiptAmount = Number(gv.receiptAmount || 0);
      const newReceiptAmount = Number(dto.receiptAmount || 0);
      const oldIssueAmount = Number(gv.issueAmount || 0);
      const newIssueAmount = Number(dto.issueAmount || 0);

      // Normalize dates for comparison
      const oldDate = new Date(voucher.entryDate).toISOString().split('T')[0];
      const newDate = new Date(dto.entryDate).toISOString().split('T')[0];

      const hasValuesChanged = 
        oldReceiptGold !== newReceiptGold ||
        oldIssueGold !== newIssueGold ||
        oldReceiptAmount !== newReceiptAmount ||
        oldIssueAmount !== newIssueAmount ||
        gv.partyAccountId !== dto.partyAccountId ||
        oldDate !== newDate;

      // 6. Update Voucher base
      voucher.entryDate = dto.entryDate;
      voucher.narration = finalNarration;
      voucher.status = dto.status;
      await em.save(voucher);

      // 7. Update GoldVoucher header
      gv.partyAccountId = dto.partyAccountId;
      gv.receiptGold = dto.receiptGold;
      gv.issueGold = dto.issueGold;
      gv.receiptAmount = dto.receiptAmount;
      gv.issueAmount = dto.issueAmount;
      gv.remarks = dto.remarks;
      gv.remarksTime = dto.remarksTime;
      await em.save(gv);

      // 8. Handle Ledger Entries (Wipe and Recreate to ensure integrity)
      const jeRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      
      // Find any existing Journal Entry for this voucher
      const existingJE = await jeRepo.findOne({ where: { voucherId: voucher.id } });
      
      if (existingJE) {
        // Delete all ledger entries first
        await ledgerRepo.delete({ journalEntryId: existingJE.id });
        // Delete the journal entry itself
        await jeRepo.delete({ id: existingJE.id });
      }

      // If the voucher is now POSTED, create a fresh Journal Entry and Ledger Entries
      if (dto.status === VoucherStatus.POSTED) {
        const je = new JournalEntry();
        je.voucherId = voucher.id;
        je.entryDate = dto.entryDate;
        je.narration = finalNarration;
        je.sourceReference = voucher.id;
        je.status = JournalEntryStatus.POSTED;
        const savedJE = await em.save(je);

        const entries: LedgerEntry[] = [];

        // Gold Entries
        if ((dto.receiptGold || 0) > 0 || (dto.issueGold || 0) > 0) {
          const goldLedgerId = settings.defaultGoldLedgerId;
          
          const partyGoldEntry = new LedgerEntry();
          partyGoldEntry.accountId = partyAccount.id;
          partyGoldEntry.debitGold = dto.issueGold || 0;
          partyGoldEntry.creditGold = dto.receiptGold || 0;
          partyGoldEntry.narration = savedJE.narration;
          partyGoldEntry.journalEntry = savedJE;
          entries.push(partyGoldEntry);

          const contraGoldEntry = new LedgerEntry();
          contraGoldEntry.accountId = goldLedgerId;
          contraGoldEntry.debitGold = dto.receiptGold || 0;
          contraGoldEntry.creditGold = dto.issueGold || 0;
          contraGoldEntry.narration = savedJE.narration;
          contraGoldEntry.journalEntry = savedJE;
          entries.push(contraGoldEntry);
        }

        // Amount Entries
        if ((dto.receiptAmount || 0) > 0 || (dto.issueAmount || 0) > 0) {
          const cashLedgerId = settings.defaultCashLedgerId;

          const partyAmountEntry = new LedgerEntry();
          partyAmountEntry.accountId = partyAccount.id;
          partyAmountEntry.debitAmount = dto.issueAmount || 0;
          partyAmountEntry.creditAmount = dto.receiptAmount || 0;
          partyAmountEntry.narration = savedJE.narration;
          partyAmountEntry.journalEntry = savedJE;
          entries.push(partyAmountEntry);

          const contraCashEntry = new LedgerEntry();
          contraCashEntry.accountId = cashLedgerId;
          contraCashEntry.debitAmount = dto.receiptAmount || 0;
          contraCashEntry.creditAmount = dto.issueAmount || 0;
          contraCashEntry.narration = savedJE.narration;
          contraCashEntry.journalEntry = savedJE;
          entries.push(contraCashEntry);
        }

        if (entries.length > 0) {
          await em.save(LedgerEntry, entries);
        }
      }

      return { success: true, voucherNo: voucher.voucherNo };
    });
  }
}
