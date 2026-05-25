import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher } from '../../domain/entities/Voucher';
import { GoldVoucher } from '../../domain/entities/GoldVoucher';
import { Account } from '../../domain/entities/Account';

export class DeleteGoldVoucherUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch the voucher header to make sure it exists
      const voucher = await em.findOne(Voucher, { where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');

      // 1.1 Check Freeze Date for involved accounts
      const goldVoucher = await em.findOne(GoldVoucher, { where: { voucherId } });
      if (goldVoucher) {
        const accountRepo = em.getRepository(Account);
        const partyAccount = await accountRepo.findOne({ where: { id: goldVoucher.partyAccountId } });
        if (partyAccount) Account.validateFreezeDate(partyAccount, voucher.entryDate);
      }

      // 2. Find and delete Journal Entry + Ledger Entries
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      
      // A Gold Voucher could have a Journal Entry linked via voucherId
      const je = await journalRepo.findOne({ where: { voucherId: voucher.id } });
      
      if (je) {
        // Delete ledger entries linked to this journal entry
        await ledgerRepo.delete({ journalEntryId: je.id });
        
        // Delete the journal entry itself
        await journalRepo.delete({ id: je.id });
      }

      // 3. Delete GoldVoucher specific header
      await em.getRepository(GoldVoucher).delete({ voucherId: voucher.id });

      // 4. Delete the base Voucher
      await em.getRepository(Voucher).delete({ id: voucher.id });

      return { success: true };
    });
  }
}
