import { AppDataSource } from '../../infrastructure/database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher } from '../../domain/entities/Voucher';
import { SupplierOrderVoucher } from '../../domain/entities/SupplierOrderVoucher';
import { Account } from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';

export class DeleteSupplierOrderUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      const voucher = await em.findOne(Voucher, { where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');

      const orderVoucher = await em.findOne(SupplierOrderVoucher, { where: { voucherId } });
      if (orderVoucher) {
        const accountRepo = em.getRepository(Account);
        const supplierAccount = await accountRepo.findOne({ where: { id: orderVoucher.accountId } });
        if (supplierAccount) Account.validateFreezeDate(supplierAccount, voucher.entryDate);

        const companySettingsRepo = em.getRepository(CompanySetting);
        const settings = await companySettingsRepo.findOne({ where: { id: 'current' } });
        if (settings) {
          const cashAccount = await accountRepo.findOne({ where: { id: settings.defaultCashLedgerId } });
          if (cashAccount) Account.validateFreezeDate(cashAccount, voucher.entryDate);

          const goldAccount = await accountRepo.findOne({ where: { id: settings.defaultGoldLedgerId } });
          if (goldAccount) Account.validateFreezeDate(goldAccount, voucher.entryDate);
        }
      }

      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      
      const je = await journalRepo.findOne({ where: { voucherId: voucher.id } });
      
      if (je) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.delete({ id: je.id });
      }

      await em.getRepository(SupplierOrderVoucher).delete({ voucherId: voucher.id });
      await em.getRepository(Voucher).delete({ id: voucher.id });

      return { success: true };
    });
  }
}
