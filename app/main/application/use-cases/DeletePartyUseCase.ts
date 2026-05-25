import { AppDataSource } from '../../infrastructure/database/data-source';
import { Party } from '../../domain/entities/Party';
import { Account } from '../../domain/entities/Account';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';

export class DeletePartyUseCase {
  async execute(partyId: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const partyRepo = queryRunner.manager.getRepository(Party);
      const accountRepo = queryRunner.manager.getRepository(Account);
      const ledgerRepo = queryRunner.manager.getRepository(LedgerEntry);

      // 1. Find the party
      const party = await partyRepo.findOne({
        where: { id: partyId },
      });

      if (!party) {
        throw new Error('Party not found');
      }

      const accountId = party.ledger_account_id;

      // 2. Check for account data (Ledger Entries)
      if (accountId) {
        // Find all ledger entries for this account
        const ledgerEntries = await ledgerRepo.find({
          where: { accountId },
        });

        const hasRealTransactions = ledgerEntries.some(
          (entry) => 
            entry.narration !== 'Opening balance seeding' && 
            entry.narration !== 'Opening balance contra offset'
        );

        if (hasRealTransactions) {
          throw new Error('Cannot delete party because associated account has existing business transactions.');
        }

        // If only OB exists (or no entries), we should clean up the JournalEntries
        const journalIds = [...new Set(ledgerEntries.map((e) => e.journalEntryId))];
        
        for (const jeId of journalIds) {
          // Delete both sides of the OB transaction
          await ledgerRepo.delete({ journalEntryId: jeId });
          await queryRunner.manager.delete('journal_entries', { id: jeId });
        }
      }

      // 3. Delete Party
      await partyRepo.remove(party);

      // 4. Delete Account if it exists
      if (accountId) {
        const account = await accountRepo.findOne({ where: { id: accountId } });
        if (account) {
          await accountRepo.remove(account);
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
