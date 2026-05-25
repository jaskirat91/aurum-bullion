import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party } from '../../domain/entities/Party';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { SaleReturnVoucher } from '../../domain/entities/SaleReturnVoucher';
import { SaleReturnVoucherItem } from '../../domain/entities/SaleReturnVoucherItem';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Account } from '../../domain/entities/Account';
import { SaleReturnVoucherRepository } from '../../infrastructure/repositories/SaleReturnVoucherRepository';

export interface SaleReturnVoucherLineItemDTO {
  productId?: string;
  isOldItem?: boolean;
  oldItemName?: string;
  oldItemTag?: string;
  // Tag spec inputs — only for old items, used to re-populate the edit dialog
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

export interface CreateSaleReturnVoucherDTO {
  entryDate: string;
  narration?: string;
  customerId: string;
  items: SaleReturnVoucherLineItemDTO[];
  action: 'DRAFT' | 'POST';
}

export class CreateSaleReturnVoucherUseCase {
  async execute(dto: CreateSaleReturnVoucherDTO): Promise<{ success: boolean; voucherNo: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Validate customer
      const partyRepo = em.getRepository(Party);
      const batchRepo = em.getRepository(Batch);
      const customer = await partyRepo.findOne({
        where: { id: dto.customerId },
        relations: ['ledgerAccount'],
      });
      if (!customer) throw new Error('Customer not found.');

      if (customer.ledgerAccount) {
        Account.validateFreezeDate(customer.ledgerAccount, dto.entryDate);
      }

      if (dto.action === 'POST' && !customer.ledger_account_id) {
        throw new Error(
          'Customer does not have a linked ledger account. Please configure it first.',
        );
      }

      if (!dto.items || dto.items.length === 0) {
        throw new Error('At least one line item is required.');
      }

      // 2. Validate system products upfront (skip for old items)
      const productRepo = em.getRepository(FinishedProduct);
      const products: (FinishedProduct | null)[] = [];
      for (const item of dto.items) {
        if (item.isOldItem) {
          // Old items bypass product lookup entirely
          products.push(null);
          continue;
        }
        if (!item.productId) throw new Error('productId is required for system items.');
        const product = await productRepo.findOne({
          where: { id: item.productId },
          relations: ['finishedItem', 'batch'],
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        // Sale Return: only items sold to this customer can be returned
        if (product.status !== FinishedProductStatus.SOLD || product.partyId !== dto.customerId) {
          throw new Error(
            `Tag "${product.tag}" was not sold to this customer and cannot be returned.`,
          );
        }
        products.push(product);
      }

      // 3. Validate settings when posting
      const settingsRepo = em.getRepository(CompanySetting);
      const settings = await settingsRepo.findOne({ where: {} });
      if (dto.action === 'POST') {
        if (!settings?.defaultGoldLedgerId || !settings?.defaultCashLedgerId) {
          throw new Error(
            'Default Gold or Cash ledger is not configured. Please configure in Setup.',
          );
        }
      }

      // 4. Generate unique Voucher No (SALE_RETURN type)
      const saleReturnVoucherRepo = new SaleReturnVoucherRepository();
      const voucherNo = await saleReturnVoucherRepo.generateNextVoucherNo();
      const totalGold = dto.items.reduce((s, i) => s + Number(i.goldWeight), 0);
      const totalAmount = dto.items.reduce((s, i) => s + Number(i.labourAmount), 0);

      // 5. Create Voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.SALE_RETURN;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = dto.narration?.trim() || `Sale Return Voucher for ${customer.name}`;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      const savedVoucher = await em.save(voucher);

      // 6. Create SaleReturnVoucher header
      const saleReturnVoucher = new SaleReturnVoucher();
      saleReturnVoucher.voucherId = savedVoucher.id;
      saleReturnVoucher.customerId = dto.customerId;
      saleReturnVoucher.totalGoldWeight = totalGold;
      saleReturnVoucher.totalAmount = totalAmount;
      await em.save(saleReturnVoucher);

      // 7. Create SaleReturnVoucherItems & optionally mark system products IN_STOCK
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        const product = products[i]; // null for old items

        const srv = new SaleReturnVoucherItem();
        srv.voucherId = savedVoucher.id;
        srv.isOldItem = !!item.isOldItem;

        if (item.isOldItem) {
          // Old item — no product reference
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

        // Only restore stock for system products when posting
        if (dto.action === 'POST' && !item.isOldItem && product) {
          product.status = FinishedProductStatus.IN_STOCK;
          product.partyId = null!; // Clear the customer
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

      // 8. Create Journal + Ledger entries only when posting
      if (dto.action === 'POST') {
        const je = new JournalEntry();
        je.voucherId = savedVoucher.id;
        je.entryDate = dto.entryDate;
        je.narration = savedVoucher.narration;
        je.sourceReference = savedVoucher.id;
        je.status = JournalEntryStatus.POSTED;

        const entries: LedgerEntry[] = [];

        if (totalGold > 0) {
          // Cr Customer — gold return (credit gold)
          const custGoldCr = new LedgerEntry();
          custGoldCr.accountId = customer.ledger_account_id!;
          custGoldCr.debitGold = 0;
          custGoldCr.creditGold = totalGold;
          custGoldCr.debitAmount = 0;
          custGoldCr.creditAmount = 0;
          custGoldCr.narration = `Gold Return - ${voucherNo}`;
          custGoldCr.journalEntry = je;
          entries.push(custGoldCr);

          // Dr Default Gold Ledger — stock in (debit gold)
          const goldDr = new LedgerEntry();
          goldDr.accountId = settings!.defaultGoldLedgerId;
          goldDr.debitGold = totalGold;
          goldDr.creditGold = 0;
          goldDr.debitAmount = 0;
          goldDr.creditAmount = 0;
          goldDr.narration = `Stock in (Gold) - ${voucherNo}`;
          goldDr.journalEntry = je;
          entries.push(goldDr);
        }

        if (totalAmount > 0) {
          // Cr Customer — INR return (credit amount)
          const custInrCr = new LedgerEntry();
          custInrCr.accountId = customer.ledger_account_id!;
          custInrCr.debitAmount = 0;
          custInrCr.debitGold = 0;
          custInrCr.creditGold = 0;
          custInrCr.creditAmount = totalAmount;
          custInrCr.narration = `Labour/Amount Return - ${voucherNo}`;
          custInrCr.journalEntry = je;
          entries.push(custInrCr);

          // Dr Default Cash Ledger — revenue reversal (debit amount)
          const cashDr = new LedgerEntry();
          cashDr.accountId = settings!.defaultCashLedgerId;
          cashDr.debitAmount = totalAmount;
          cashDr.debitGold = 0;
          cashDr.creditGold = 0;
          cashDr.creditAmount = 0;
          cashDr.narration = `Revenue Reversal - ${voucherNo}`;
          cashDr.journalEntry = je;
          entries.push(cashDr);
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true, voucherNo };
    });
  }
}
