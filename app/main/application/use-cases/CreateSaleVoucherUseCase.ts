import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party } from '../../domain/entities/Party';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Account } from '../../domain/entities/Account';
import { SaleVoucherRepository } from '../../infrastructure/repositories/SaleVoucherRepository';

export interface SaleVoucherLineItemDTO {
  productId: string;
  purityPercentage: number; // e.g. 91.67 for 22K
  goldWeight: number; // (purityPercentage / 100) * tagNetWeight
  labourPercentage: number; // e.g. 100 for full labour
  labourAmount: number; // (labourPercentage / 100) * tagAmount
}

export interface CreateSaleVoucherDTO {
  entryDate: string;
  narration?: string;
  customerId: string; // Party ID (type = CUSTOMER)
  items: SaleVoucherLineItemDTO[];
  action: 'DRAFT' | 'POST';
}

export class CreateSaleVoucherUseCase {
  async execute(dto: CreateSaleVoucherDTO): Promise<{ success: boolean; voucherNo: string }> {
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

      // 2. Validate all products upfront
      const productRepo = em.getRepository(FinishedProduct);
      const products: FinishedProduct[] = [];
      for (const item of dto.items) {
        const product = await productRepo.findOne({
          where: { id: item.productId },
          relations: ['finishedItem', 'batch'],
        });
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        if (product.status === FinishedProductStatus.SOLD) {
          throw new Error(`Tag "${product.tag}" is already sold and cannot be added.`);
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

      // 4. Generate unique Voucher No (SALES type)
      const saleVoucherRepo = new SaleVoucherRepository();
      const voucherNo = await saleVoucherRepo.generateNextVoucherNo();
      const totalGold = dto.items.reduce((s, i) => s + Number(i.goldWeight), 0);
      const totalAmount = dto.items.reduce((s, i) => s + Number(i.labourAmount), 0);

      // 5. Create Voucher
      const voucher = new Voucher();
      voucher.type = VoucherType.SALES;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = dto.narration?.trim() || `Sale Voucher for ${customer.name}`;
      voucher.status = dto.action === 'POST' ? VoucherStatus.POSTED : VoucherStatus.DRAFT;
      const savedVoucher = await em.save(voucher);

      // 6. Create SaleVoucher header
      const saleVoucher = new SaleVoucher();
      saleVoucher.voucherId = savedVoucher.id;
      saleVoucher.customerId = dto.customerId;
      saleVoucher.totalGoldWeight = totalGold;
      saleVoucher.totalAmount = totalAmount;
      await em.save(saleVoucher);

      // 7. Create SaleVoucherItems & optionally mark products SOLD
      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i];
        const product = products[i];

        const svi = new SaleVoucherItem();
        svi.voucherId = savedVoucher.id;
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
          // Dr Customer — gold receivable
          const custGoldDr = new LedgerEntry();
          custGoldDr.accountId = customer.ledger_account_id!;
          custGoldDr.debitGold = totalGold;
          custGoldDr.creditGold = 0;
          custGoldDr.debitAmount = 0;
          custGoldDr.creditAmount = 0;
          custGoldDr.narration = `Gold charged - ${voucherNo}`;
          custGoldDr.journalEntry = je;
          entries.push(custGoldDr);

          // Cr Default Gold Ledger — stock out
          const goldCr = new LedgerEntry();
          goldCr.accountId = settings!.defaultGoldLedgerId;
          goldCr.debitGold = 0;
          goldCr.creditGold = totalGold;
          goldCr.debitAmount = 0;
          goldCr.creditAmount = 0;
          goldCr.narration = `Stock out (Gold) - ${voucherNo}`;
          goldCr.journalEntry = je;
          entries.push(goldCr);
        }

        if (totalAmount > 0) {
          // Dr Customer — INR receivable
          const custInrDr = new LedgerEntry();
          custInrDr.accountId = customer.ledger_account_id!;
          custInrDr.debitAmount = totalAmount;
          custInrDr.debitGold = 0;
          custInrDr.creditGold = 0;
          custInrDr.creditAmount = 0;
          custInrDr.narration = `Labour/Amount charged - ${voucherNo}`;
          custInrDr.journalEntry = je;
          entries.push(custInrDr);

          // Cr Default Cash Ledger — revenue
          const cashCr = new LedgerEntry();
          cashCr.accountId = settings!.defaultCashLedgerId;
          cashCr.debitAmount = 0;
          cashCr.debitGold = 0;
          cashCr.creditGold = 0;
          cashCr.creditAmount = totalAmount;
          cashCr.narration = `Revenue - ${voucherNo}`;
          cashCr.journalEntry = je;
          entries.push(cashCr);
        }

        je.ledgerEntries = entries;
        await em.save(je);
      }

      return { success: true, voucherNo };
    });
  }
}
