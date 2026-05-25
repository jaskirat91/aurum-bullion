import { AppDataSource } from '../../infrastructure/database/data-source';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Party } from '../../domain/entities/Party';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';

export interface SellStockDTO {
  entryDate: string;
  productId: string; // The selected tag's ID
  customerId: string;
  goldToCharge: number; // calculated gold weight to charge
  inrToCharge: number; // calculated INR to charge
  goldPercent: number; // saved for audit/history if needed (optional)
  inrPercent: number; // saved for audit/history if needed (optional)
}

export class SellStockUseCase {
  async execute(dto: SellStockDTO): Promise<{ success: boolean; voucherNo?: string }> {
    return AppDataSource.transaction(async (em) => {
      const productRepo = em.getRepository(FinishedProduct);
      const partyRepo = em.getRepository(Party);
      const batchRepo = em.getRepository(Batch);
      const settingsRepo = em.getRepository(CompanySetting);
      const journalRepo = em.getRepository(JournalEntry);

      // 1. Validate Product
      const product = await productRepo.findOne({
        where: { id: dto.productId },
        relations: ['batch', 'finishedItem'],
      });
      if (!product) throw new Error('Product not found');
      if (product.status === FinishedProductStatus.SOLD) throw new Error('Product already sold');

      // Validation: Cannot sell before received from Karigar
      if (product.batchId) {
        const receiptTrx = await em.getRepository(MaterialTransaction).findOne({
          where: {
            batchId: product.batchId,
            type: TransactionType.RECEIVE_FROM_KARIGAR,
          },
        });

        if (!receiptTrx) {
          throw new Error('This product has not been recorded as received from a Karigar.');
        }

        const saleDate = new Date(dto.entryDate);
        const receiptDate = new Date(receiptTrx.transactionDate);

        if (saleDate < receiptDate) {
          throw new Error(
            `Sale date (${dto.entryDate}) cannot be earlier than the receipt date (${receiptTrx.transactionDate}).`,
          );
        }
      }

      // 2. Validate Customer
      const customer = await partyRepo.findOne({ where: { id: dto.customerId } });
      if (!customer || !customer.ledger_account_id) {
        throw new Error('Selected customer does not have a linked ledger account.');
      }

      // 3. Get Settings
      const settings = await settingsRepo.findOne({ where: {} });
      if (!settings || !settings.defaultGoldLedgerId || !settings.defaultCashLedgerId) {
        throw new Error('Default Gold or Cash ledger account not configured.');
      }

      // 4. Update Product & Batch Status
      product.status = FinishedProductStatus.SOLD;
      product.partyId = dto.customerId;
      product.soldGoldPercentage = dto.goldPercent;
      product.soldGoldWeight = dto.goldToCharge;
      product.soldAmountPercentage = dto.inrPercent;
      product.soldAmount = dto.inrToCharge;
      await productRepo.save(product);

      if (product.batch) {
        const batch = product.batch;
        // Check if all products in this batch are sold?
        // For now just follow the pattern of the old use case which marks it SOLD.
        batch.status = BatchStatus.SOLD;
        await batchRepo.save(batch);
      }

      // 5. Build Voucher
      const year = new Date(dto.entryDate).getFullYear();
      const narration = `Sale of Tag: ${product.tag} | Item: ${product.finishedItem?.name} | to: ${customer.name}`;
      const voucherNo = await Voucher.generateNextVoucherNo(em, 'SALE', year);

      const voucher = new Voucher();
      voucher.type = VoucherType.SALES;
      voucher.entryDate = dto.entryDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = VoucherStatus.POSTED;
      const savedVoucher = await em.save(voucher);

      // 5. Create Accounting Entry
      const je = new JournalEntry();

      je.voucherId = savedVoucher.id;
      je.entryDate = dto.entryDate;
      je.narration = narration;
      je.sourceReference = product.id;

      const entries: LedgerEntry[] = [];
      let custGoldDr: LedgerEntry | undefined;
      let custInrDr: LedgerEntry | undefined;

      // Gold Transactions
      if (dto.goldToCharge > 0) {
        // Dr Customer
        custGoldDr = new LedgerEntry();
        custGoldDr.accountId = customer.ledger_account_id!;
        custGoldDr.debitGold = dto.goldToCharge;
        custGoldDr.creditGold = 0;
        custGoldDr.debitAmount = 0;
        custGoldDr.creditAmount = 0;
        custGoldDr.narration = `Gold Charged for Tag ${product.tag}`;
        custGoldDr.journalEntry = je;
        entries.push(custGoldDr);

        // Cr Default Gold Account
        const goldCr = new LedgerEntry();
        goldCr.accountId = settings.defaultGoldLedgerId;
        goldCr.debitGold = 0;
        goldCr.creditGold = dto.goldToCharge;
        goldCr.debitAmount = 0;
        goldCr.creditAmount = 0;
        goldCr.narration = `Stock Out (Gold) - Tag ${product.tag}`;
        goldCr.journalEntry = je;
        entries.push(goldCr);
      }

      // INR Transactions
      if (dto.inrToCharge > 0) {
        // Dr Customer
        custInrDr = new LedgerEntry();
        custInrDr.accountId = customer.ledger_account_id!;
        custInrDr.debitAmount = dto.inrToCharge;
        custInrDr.debitGold = 0;
        custInrDr.creditGold = 0;
        custInrDr.creditAmount = 0;
        custInrDr.narration = `INR Charged for Tag ${product.tag}`;
        custInrDr.journalEntry = je;
        entries.push(custInrDr);

        // Cr Default Cash Account
        const cashCr = new LedgerEntry();
        cashCr.accountId = settings.defaultCashLedgerId;
        cashCr.debitAmount = 0;
        cashCr.debitGold = 0;
        cashCr.creditGold = 0;
        cashCr.creditAmount = dto.inrToCharge;
        cashCr.narration = `Revenue/Cash - Tag ${product.tag}`;
        cashCr.journalEntry = je;
        entries.push(cashCr);
      }

      je.ledgerEntries = entries;
      await em.save(je);

      // 6. Link Product to Ledger Entry and set transaction date
      product.goldLedgerEntryId = custGoldDr?.id;
      product.amountLedgerEntryId = custInrDr?.id;
      product.transactionDate = new Date(dto.entryDate);
      await productRepo.save(product);

      return { success: true, data: { voucherNo } };
    });
  }
}
