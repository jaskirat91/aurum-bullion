import { AppDataSource } from '../../infrastructure/database/data-source';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Account } from '../../domain/entities/Account';

export class CancelSaleVoucherUseCase {
  async execute(voucherId: string): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Find & validate the voucher
      const voucherRepo = em.getRepository(Voucher);
      const voucher = await voucherRepo.findOne({ where: { id: voucherId } });
      if (!voucher) throw new Error('Voucher not found.');
      if (voucher.status !== VoucherStatus.POSTED)
        throw new Error('Only POSTED vouchers can be cancelled.');

      // 2. Restore products to IN_STOCK
      const sviRepo = em.getRepository(SaleVoucherItem);
      const items = await sviRepo.find({ where: { voucherId } });
      const productRepo = em.getRepository(FinishedProduct);

      for (const item of items) {
        const product = await productRepo.findOne({ where: { id: item.productId } });
        if (product && product.status === FinishedProductStatus.SOLD) {
          product.status = FinishedProductStatus.IN_STOCK;
          product.partyId = undefined;
          product.soldGoldPercentage = undefined;
          product.soldGoldWeight = undefined;
          product.soldAmountPercentage = undefined;
          product.soldAmount = undefined;
          product.goldLedgerEntryId = undefined;
          product.amountLedgerEntryId = undefined;
          // product.transactionDate = undefined;
          await productRepo.save(product);
        }
      }

      // 3. Find the original journal entry for this voucher
      const jeRepo = em.getRepository(JournalEntry);
      const originalJe = await jeRepo.findOne({
        where: { voucherId },
        relations: ['ledgerEntries', 'ledgerEntries.account'],
      });

      if (originalJe && originalJe.ledgerEntries?.length > 0) {
        // Validate freeze date against original entry date
        for (const le of originalJe.ledgerEntries) {
          if (le.account) {
            Account.validateFreezeDate(le.account, originalJe.entryDate);
          }
        }

        // 3a. Build a reversal voucher
        const year = new Date().getFullYear();
        const revVoucherNo = await Voucher.generateNextVoucherNo(em, 'SV-REV', year);

        const revVoucher = new Voucher();
        revVoucher.type = VoucherType.SALES;
        revVoucher.entryDate = new Date().toISOString().split('T')[0];
        revVoucher.voucherNo = revVoucherNo;
        revVoucher.narration = `Reversal of ${voucher.voucherNo}`;
        revVoucher.status = VoucherStatus.CANCELLED;
        const savedRevVoucher = await em.save(revVoucher);

        // 3b. Build reversal journal entry
        const revJe = new JournalEntry();
        revJe.voucherId = savedRevVoucher.id;
        revJe.entryDate = new Date().toISOString().split('T')[0];
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

        // 3c. Void the original journal entry
        originalJe.status = JournalEntryStatus.VOID;
        await jeRepo.save(originalJe);
      }

      // 4. Mark the original voucher as CANCELLED
      voucher.status = VoucherStatus.CANCELLED;
      voucher.narration = `[CANCELLED] ${voucher.narration ?? ''}`.trim();
      await voucherRepo.save(voucher);

      return { success: true };
    });
  }
}
