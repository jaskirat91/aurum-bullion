import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party } from '../../domain/entities/Party';
import { Voucher, VoucherStatus } from '../../domain/entities/Voucher';
import { SaleReturnVoucher } from '../../domain/entities/SaleReturnVoucher';
import { SaleReturnVoucherItem } from '../../domain/entities/SaleReturnVoucherItem';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Account } from '../../domain/entities/Account';

export interface SaleReturnVoucherLineItemDTO {
  productId?: string;
  isOldItem?: boolean;
  oldItemName?: string;
  oldItemTag?: string;
  // Tag spec inputs — only for old items
  tagGrossWeight?: number;
  tagKundanWeight?: number;
  tagStoneWeight?: number;
  tagMottiWeight?: number;
  tagNetWeight?: number;
  tagAmount?: number;
  purityPercentage: number;
  goldWeight: number;
  labourPercentage: number;
  labourAmount: number;
}

export interface UpdateSaleReturnVoucherDTO {
  entryDate: string;
  narration?: string;
  customerId: string;
  items: SaleReturnVoucherLineItemDTO[];
  action: 'DRAFT' | 'POST';
}

export class UpdateSaleReturnVoucherUseCase {
  async execute(voucherId: string, dto: UpdateSaleReturnVoucherDTO): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch current voucher and related data
      const voucher = await em.getRepository(Voucher).findOne({ where: { id: voucherId } });
      const saleReturnVoucher = await em.getRepository(SaleReturnVoucher).findOne({
        where: { voucherId },
        relations: ['items'],
      });

      if (!voucher || !saleReturnVoucher) throw new Error('Sale Return Voucher not found.');

      // 1.1 Check Freeze Date for OLD customer at OLD date
      const oldCustomer = await em.getRepository(Party).findOne({
        where: { id: saleReturnVoucher.customerId },
        relations: ['ledgerAccount'],
      });
      if (oldCustomer?.ledgerAccount) {
        Account.validateFreezeDate(oldCustomer.ledgerAccount, voucher.entryDate);
      }

      // 2. Validate Customer
      const partyRepo = em.getRepository(Party);
      const customer = await partyRepo.findOne({
        where: { id: dto.customerId },
        relations: ['ledgerAccount'],
      });
      if (!customer) throw new Error('Customer not found.');

      if (customer.ledgerAccount) {
        Account.validateFreezeDate(customer.ledgerAccount, dto.entryDate);
      }

      // 3. Restore OLD system items (put them back to SOLD for re-processing)
      const productRepo = em.getRepository(FinishedProduct);
      const batchRepo = em.getRepository(Batch);
      if (saleReturnVoucher.items) {
        for (const item of saleReturnVoucher.items) {
          // Skip old items — they have no product in our system
          if (item.isOldItem || !item.productId) continue;

          const product = await productRepo.findOne({
            where: { id: item.productId },
            relations: ['batch'],
          });
          if (product) {
            product.status = FinishedProductStatus.SOLD;
            product.partyId = saleReturnVoucher.customerId;
            await productRepo.save(product);

            if (product.batch) {
              const batch = product.batch;
              batch.status = BatchStatus.SOLD;
              await batchRepo.save(batch);
            }
          }
        }
      }

      // 4. Delete old SaleReturnVoucherItems
      await em.getRepository(SaleReturnVoucherItem).delete({ voucherId });

      // 5. Wipe Accounting Entries
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      const oldJournals = await journalRepo.find({ where: { voucherId } });
      for (const je of oldJournals) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.remove(je);
      }

      // 6. Validate NEW system products (skip for old items)
      const newProducts: (FinishedProduct | null)[] = [];
      for (const item of dto.items) {
        if (item.isOldItem) {
          newProducts.push(null);
          continue;
        }
        if (!item.productId) throw new Error('productId is required for system items.');
        const product = await productRepo.findOne({
          where: { id: item.productId },
          relations: ['batch'],
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        
        // Items must be SOLD to this customer to be returnable
        if (product.status !== FinishedProductStatus.SOLD || product.partyId !== dto.customerId) {
          throw new Error(`Tag "${product.tag}" was not sold to this customer.`);
        }
        newProducts.push(product);
      }

      // 7. Update Voucher Header
      voucher.entryDate = dto.entryDate;
      voucher.narration = dto.narration?.trim() || `Sale Return Voucher for ${customer.name}`;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      await em.save(voucher);

      // 8. Update SaleReturnVoucher Header
      const totalGold = dto.items.reduce((s, i) => s + Number(i.goldWeight), 0);
      const totalAmount = dto.items.reduce((s, i) => s + Number(i.labourAmount), 0);
      saleReturnVoucher.customerId = dto.customerId;
      saleReturnVoucher.totalGoldWeight = totalGold;
      saleReturnVoucher.totalAmount = totalAmount;
      await em.save(saleReturnVoucher);

      // 9. Create NEW SaleReturnVoucherItems and mark IN_STOCK if posted (system items only)
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        const product = newProducts[i]; // null for old items

        const srv = new SaleReturnVoucherItem();
        srv.voucherId = voucherId;
        srv.isOldItem = !!item.isOldItem;

        if (item.isOldItem) {
          srv.productId = null;
          srv.oldItemName = item.oldItemName ?? null;
          srv.oldItemTag = item.oldItemTag ?? null;
          // Persist tag specs so the edit dialog can re-populate them
          srv.tagGrossWeight = item.tagGrossWeight ?? undefined;
          srv.tagKundanWeight = item.tagKundanWeight ?? undefined;
          srv.tagStoneWeight = item.tagStoneWeight ?? undefined;
          srv.tagMottiWeight = item.tagMottiWeight ?? undefined;
          srv.tagNetWeight = item.tagNetWeight ?? undefined;
          srv.tagAmount = item.tagAmount ?? undefined;
        } else {
          srv.productId = item.productId!;
        }

        srv.netGoldWeight = item.goldWeight;
        srv.goldPurity = item.purityPercentage;
        srv.pureGoldWeight = item.goldWeight;
        srv.netAmount = item.labourAmount;
        srv.amountPercentage = item.labourPercentage;
        srv.soldAmount = item.labourAmount;
        await em.save(srv);

        if (dto.action === 'POST' && !item.isOldItem && product) {
          product.status = FinishedProductStatus.IN_STOCK;
          product.partyId = null!;
          product.soldGoldPercentage = null!;
          product.soldGoldWeight = null!;
          product.soldAmountPercentage = null!;
          product.soldAmount = null!;
          product.transactionDate = new Date(dto.entryDate);
          await productRepo.save(product);

          if (product.batch) {
            const batch = product.batch;
            batch.status = BatchStatus.COMPLETED;
            await batchRepo.save(batch);
          }
        }
      }

      // 10. Recreate Journal + Ledger only when posting
      if (dto.action === 'POST') {
        const settingsRepo = em.getRepository(CompanySetting);
        const settings = await settingsRepo.findOne({ where: {} });
        if (!settings?.defaultGoldLedgerId || !settings?.defaultCashLedgerId) {
          throw new Error('Default Gold or Cash ledger is not configured.');
        }

        const je = new JournalEntry();
        je.voucherId = voucherId;
        je.entryDate = dto.entryDate;
        je.narration = voucher.narration;
        je.sourceReference = voucherId;
        je.status = JournalEntryStatus.POSTED;

        const entries: LedgerEntry[] = [];
        if (totalGold > 0) {
          // Cr Customer — gold return
          const custGoldCr = new LedgerEntry();
          custGoldCr.accountId = customer.ledger_account_id!;
          custGoldCr.debitGold = 0;
          custGoldCr.creditGold = totalGold;
          custGoldCr.debitAmount = 0;
          custGoldCr.creditAmount = 0;
          custGoldCr.narration = `Gold Return - ${voucher.voucherNo}`;
          custGoldCr.journalEntry = je;
          entries.push(custGoldCr);

          // Dr Default Gold Ledger — stock in
          const goldDr = new LedgerEntry();
          goldDr.accountId = settings.defaultGoldLedgerId;
          goldDr.debitGold = totalGold;
          goldDr.creditGold = 0;
          goldDr.debitAmount = 0;
          goldDr.creditAmount = 0;
          goldDr.narration = `Stock in (Gold) - ${voucher.voucherNo}`;
          goldDr.journalEntry = je;
          entries.push(goldDr);
        }

        if (totalAmount > 0) {
          // Cr Customer — INR return
          const custInrCr = new LedgerEntry();
          custInrCr.accountId = customer.ledger_account_id!;
          custInrCr.debitAmount = 0;
          custInrCr.debitGold = 0;
          custInrCr.creditGold = 0;
          custInrCr.creditAmount = totalAmount;
          custInrCr.narration = `Labour/Amount Return - ${voucher.voucherNo}`;
          custInrCr.journalEntry = je;
          entries.push(custInrCr);

          // Dr Default Cash Ledger — revenue reversal
          const cashDr = new LedgerEntry();
          cashDr.accountId = settings.defaultCashLedgerId;
          cashDr.debitAmount = totalAmount;
          cashDr.debitGold = 0;
          cashDr.creditGold = 0;
          cashDr.creditAmount = 0;
          cashDr.narration = `Revenue Reversal - ${voucher.voucherNo}`;
          cashDr.journalEntry = je;
          entries.push(cashDr);
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true };
    });
  }
}
