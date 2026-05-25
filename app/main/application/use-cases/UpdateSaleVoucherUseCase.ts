import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party } from '../../domain/entities/Party';
import { Voucher, VoucherStatus } from '../../domain/entities/Voucher';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Account } from '../../domain/entities/Account';

export interface SaleVoucherLineItemDTO {
  productId: string;
  purityPercentage: number;
  goldWeight: number;
  labourPercentage: number;
  labourAmount: number;
}

export interface UpdateSaleVoucherDTO {
  entryDate: string;
  narration?: string;
  customerId: string;
  items: SaleVoucherLineItemDTO[];
  action: 'DRAFT' | 'POST';
}

export class UpdateSaleVoucherUseCase {
  async execute(voucherId: string, dto: UpdateSaleVoucherDTO): Promise<{ success: boolean }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Fetch current voucher and related data
      const voucher = await em.getRepository(Voucher).findOne({ where: { id: voucherId } });
      const saleVoucher = await em.getRepository(SaleVoucher).findOne({
        where: { voucherId },
        relations: ['items'],
      });

      if (!voucher || !saleVoucher) throw new Error('Sale Voucher not found.');

      // 1.1 Check Freeze Date for OLD customer at OLD date
      const oldCustomer = await em.getRepository(Party).findOne({
        where: { id: saleVoucher.customerId },
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

      // 3. Restore OLD items to INSTOCK
      const productRepo = em.getRepository(FinishedProduct);
      const batchRepo = em.getRepository(Batch);
      if (saleVoucher.items) {
        for (const item of saleVoucher.items) {
          const product = await productRepo.findOne({
            where: { id: item.productId },
            relations: ['batch'],
          });
          if (product) {
            product.status = FinishedProductStatus.IN_STOCK;
            product.partyId = null!;
            product.soldGoldPercentage = null!;
            product.soldGoldWeight = null!;
            product.soldAmountPercentage = null!;
            product.soldAmount = null!;
            product.transactionDate = null!;
            await productRepo.save(product);

            if (product.batch) {
              const batch = product.batch;
              batch.status = BatchStatus.COMPLETED;
              await batchRepo.save(batch);
            }
          }
        }
      }

      // 4. Delete old SaleVoucherItems
      await em.getRepository(SaleVoucherItem).delete({ voucherId });

      // 5. Wipe Accounting Entries
      const journalRepo = em.getRepository(JournalEntry);
      const ledgerRepo = em.getRepository(LedgerEntry);
      const oldJournals = await journalRepo.find({ where: { voucherId } });
      for (const je of oldJournals) {
        await ledgerRepo.delete({ journalEntryId: je.id });
        await journalRepo.remove(je);
      }

      // 6. Validate NEW products
      const newProducts: FinishedProduct[] = [];
      for (const item of dto.items) {
        const product = await productRepo.findOne({
          where: { id: item.productId },
          relations: ['batch'],
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        // Note: product.status should be INSTOCK now (either it already was or we just restored it)
        if (product.status === FinishedProductStatus.SOLD) {
          throw new Error(`Tag "${product.tag}" is already sold in another voucher.`);
        }
        newProducts.push(product);
      }

      // 7. Update Voucher Header
      voucher.entryDate = dto.entryDate;
      voucher.narration = dto.narration?.trim() || `Sale Voucher for ${customer.name}`;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      await em.save(voucher);

      // 8. Update SaleVoucher Header
      const totalGold = dto.items.reduce((s, i) => s + Number(i.goldWeight), 0);
      const totalAmount = dto.items.reduce((s, i) => s + Number(i.labourAmount), 0);
      saleVoucher.customerId = dto.customerId;
      saleVoucher.totalGoldWeight = totalGold;
      saleVoucher.totalAmount = totalAmount;
      await em.save(saleVoucher);

      // 9. Create NEW SaleVoucherItems and mark SOLD if posted
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        const product = newProducts[i];

        const svi = new SaleVoucherItem();
        svi.voucherId = voucherId;
        svi.productId = item.productId;
        svi.netGoldWeight = item.goldWeight;
        svi.goldPurity = item.purityPercentage;
        svi.pureGoldWeight = item.goldWeight;
        svi.netAmount = item.labourAmount;
        svi.amountPercentage = item.labourPercentage;
        svi.soldAmount = item.labourAmount;
        await em.save(svi);

        if (dto.action === 'POST') {
          product.status = FinishedProductStatus.SOLD;
          product.partyId = dto.customerId;
          product.soldGoldPercentage = item.purityPercentage;
          product.soldGoldWeight = item.goldWeight;
          product.soldAmountPercentage = item.labourPercentage;
          product.soldAmount = item.labourAmount;
          product.transactionDate = new Date(dto.entryDate);
          await productRepo.save(product);

          if (product.batch) {
            const batch = product.batch;
            batch.status = BatchStatus.SOLD;
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
          const custGoldDr = new LedgerEntry();
          custGoldDr.accountId = customer.ledger_account_id!;
          custGoldDr.debitGold = totalGold;
          custGoldDr.creditGold = 0;
          custGoldDr.debitAmount = 0;
          custGoldDr.creditAmount = 0;
          custGoldDr.narration = `Gold charged - ${voucher.voucherNo}`;
          custGoldDr.journalEntry = je;
          entries.push(custGoldDr);

          const goldCr = new LedgerEntry();
          goldCr.accountId = settings.defaultGoldLedgerId;
          goldCr.debitGold = 0;
          goldCr.creditGold = totalGold;
          goldCr.debitAmount = 0;
          goldCr.creditAmount = 0;
          goldCr.narration = `Stock out (Gold) - ${voucher.voucherNo}`;
          goldCr.journalEntry = je;
          entries.push(goldCr);
        }

        if (totalAmount > 0) {
          const custInrDr = new LedgerEntry();
          custInrDr.accountId = customer.ledger_account_id!;
          custInrDr.debitAmount = totalAmount;
          custInrDr.debitGold = 0;
          custInrDr.creditGold = 0;
          custInrDr.creditAmount = 0;
          custInrDr.narration = `Labour/Amount charged - ${voucher.voucherNo}`;
          custInrDr.journalEntry = je;
          entries.push(custInrDr);

          const cashCr = new LedgerEntry();
          cashCr.accountId = settings.defaultCashLedgerId;
          cashCr.debitAmount = 0;
          cashCr.debitGold = 0;
          cashCr.creditGold = 0;
          cashCr.creditAmount = totalAmount;
          cashCr.narration = `Revenue - ${voucher.voucherNo}`;
          cashCr.journalEntry = je;
          entries.push(cashCr);
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true };
    });
  }
}
