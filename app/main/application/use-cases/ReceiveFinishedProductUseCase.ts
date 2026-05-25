import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { FinishedProduct, FinishedProductStatus } from '../../domain/entities/FinishedProduct';
import { Weight } from '../../domain/value-objects/Weight';
import { Party } from '../../domain/entities/Party';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';

export interface ReceiveFinishedProductDTO {
  batchId: string;
  partyId: string; // karigar returning the goods
  finishedItemId: string;
  transactionDate: string;
  grossWeight: number; // gross gold weight
  kundanWeight?: number;
  stoneWeight?: number;
  mottiWeight?: number;
  piroiWeight?: number;
  netWeight: number; // net gold weight
  purityPercentage: number; // tench
  labourCost?: number;

  // Persistence fields
  grossWeightOfItems?: number;
  totalStones?: number;
  taarPattiWeight?: number;
  bStoneWeight?: number;
  colorStoneWeight?: number;
  labourRatePerStone?: number;

  // Tag details
  tagGrossWeight?: number;
  tagKundanWeight?: number;
  tagStoneWeight?: number;
  tagMottiWeight?: number;
  tagNetWeight?: number;
  tagAmount?: number;
  tagValue?: string;
}

export class ReceiveFinishedProductUseCase {
  async execute(dto: ReceiveFinishedProductDTO): Promise<{ finishedProductId: string }> {
    return AppDataSource.transaction(async (em) => {
      // 1. Load & validate batch
      const batchRepo = em.getRepository(Batch);
      const batch = await batchRepo.findOne({
        where: { id: dto.batchId },
        relations: ['item', 'party'],
      });

      if (!batch) throw new Error(`Batch not found: ${dto.batchId}`);
      if (batch.status !== BatchStatus.WIP) {
        throw new Error(
          `Batch must be in WIP status to receive finished products. Current: ${batch.status}`,
        );
      }
      if (batch.assignedTo !== dto.partyId) {
        throw new Error(`Batch is not assigned to the selected party.`);
      }

      // Check for ISSUE_TO_KARIGAR transaction date
      const issueTrx = await em.getRepository(MaterialTransaction).findOne({
        where: { batchId: dto.batchId, type: TransactionType.ISSUE_TO_KARIGAR },
      });

      if (!issueTrx) {
        throw new Error('This batch has not been issued to any Karigar yet.');
      }

      const receiptDate = new Date(dto.transactionDate);
      const issueDate = new Date(issueTrx.transactionDate);

      if (receiptDate < issueDate) {
        throw new Error(
          `Receipt date (${dto.transactionDate}) cannot be earlier than the issue date (${issueTrx.transactionDate}).`,
        );
      }

      const party = await em.getRepository(Party).findOne({ where: { id: dto.partyId } });
      if (!party || !party.ledger_account_id) {
        throw new Error('Selected party does not have a linked ledger account.');
      }

      const settings = await em.getRepository(CompanySetting).findOne({ where: {} });
      if (!settings || !settings.defaultGoldLedgerId || !settings.defaultCashLedgerId) {
        throw new Error(
          'Default Gold or Cash ledger account not configured check company settings.',
        );
      }

      // 2. Calculate pure gold weight
      const net = Weight.of(dto.netWeight);
      const purity = dto.purityPercentage / 100;
      const pureGold = net.multiply(purity);

      // 3. Record the RECEIVE_FROM_MANUFACTURER (Karigar) transaction
      const trx = new MaterialTransaction();
      trx.type = TransactionType.RECEIVE_FROM_KARIGAR;
      trx.batchId = dto.batchId;
      trx.partyId = dto.partyId;
      trx.transactionDate = dto.transactionDate;
      trx.grossGoldWeight = dto.grossWeight;
      trx.lessWeight = dto.grossWeight - dto.netWeight; // Calculated less
      trx.netWeight = dto.netWeight;
      trx.tenchPercentage = dto.purityPercentage;
      trx.wastePercentage = 0;
      trx.netPureGoldWeight = pureGold.grams;
      trx.kundanWeight = dto.kundanWeight ?? 0;
      trx.stoneWeight = dto.stoneWeight ?? 0;
      trx.totalStones = dto.totalStones ?? 0;
      trx.labourPerStone = dto.labourRatePerStone ?? 0;
      trx.totalStoneLabour = dto.labourCost ?? 0;
      trx.grossWeightOfItems = dto.grossWeightOfItems ?? 0;
      trx.piroiWeight = dto.piroiWeight ?? 0;
      trx.bStoneWeight = dto.bStoneWeight ?? 0;
      trx.taarPattiWeight = dto.taarPattiWeight ?? 0;
      trx.colorStoneWeight = dto.colorStoneWeight ?? 0;
      trx.finishedItemId = dto.finishedItemId;

      trx.tagGrossWeight = dto.tagGrossWeight ?? 0;
      trx.tagKundanWeight = dto.tagKundanWeight ?? 0;
      trx.tagStoneWeight = dto.tagStoneWeight ?? 0;
      trx.tagMottiWeight = dto.tagMottiWeight ?? 0;
      trx.tagNetWeight = dto.tagNetWeight ?? 0;
      trx.tagAmount = dto.tagAmount ?? 0;
      await em.save(trx);

      // 4. Create Finished Product record
      const fp = new FinishedProduct();
      fp.batchId = dto.batchId;
      fp.tag = dto.tagValue || '';
      fp.partyId = undefined; // Kept null for customer sale later
      fp.finishedItemId = dto.finishedItemId;
      fp.grossWeight = dto.grossWeight;
      fp.kundanWeight = dto.kundanWeight ?? 0;
      fp.stoneWeight = dto.stoneWeight ?? 0;
      fp.mottiWeight = dto.mottiWeight ?? 0;
      fp.piroiWeight = dto.piroiWeight ?? 0;
      fp.netWeight = dto.netWeight;
      fp.purityPercentage = dto.purityPercentage;
      fp.pureGoldWeight = pureGold.grams;
      fp.labourCost = dto.labourCost ?? 0;

      fp.tagGrossWeight = dto.tagGrossWeight ?? 0;
      fp.tagKundanWeight = dto.tagKundanWeight ?? 0;
      fp.tagStoneWeight = dto.tagStoneWeight ?? 0;
      fp.tagMottiWeight = dto.tagMottiWeight ?? 0;
      fp.tagNetWeight = dto.tagNetWeight ?? 0;
      fp.tagAmount = dto.tagAmount ?? 0;
      fp.totalStones = dto.totalStones ?? 0;
      fp.bStoneWeight = dto.bStoneWeight ?? 0;
      fp.colorStoneWeight = dto.colorStoneWeight ?? 0;
      fp.taarPattiWeight = dto.taarPattiWeight ?? 0;
      fp.grossWeightOfItems = dto.grossWeightOfItems ?? 0;

      fp.status = FinishedProductStatus.IN_STOCK;
      const savedFP = await em.save(fp);

      // 5. Build Voucher
      const year = new Date(dto.transactionDate).getFullYear();
      const narration = `Finished Goods Receipt: Batch ${batch.batchNo} | Party: ${party.name}`;
      const voucherNo = await Voucher.generateNextVoucherNo(em, 'FP-REC', year);

      const voucher = new Voucher();
      voucher.type = VoucherType.RECEIPT;
      voucher.entryDate = dto.transactionDate;
      voucher.voucherNo = voucherNo;
      voucher.narration = narration;
      voucher.status = VoucherStatus.POSTED;
      const savedVoucher = await em.save(voucher);

      // 6. Create Accounting Journal Entry
      const je = new JournalEntry();
      je.voucherId = savedVoucher.id;
      je.entryDate = dto.transactionDate;
      je.narration = narration;
      je.sourceReference = savedFP.id;

      // Ledger entries - Gold (Balanced)
      const goldDr = new LedgerEntry();
      goldDr.accountId = settings.defaultGoldLedgerId;
      goldDr.debitGold = dto.kundanWeight ?? 0;
      goldDr.creditGold = 0;
      goldDr.debitAmount = 0;
      goldDr.creditAmount = 0;
      goldDr.narration = `Stock In (Gold) - FP ${dto.tagValue}`;
      goldDr.journalEntry = je;

      const goldCr = new LedgerEntry();
      goldCr.accountId = party.ledger_account_id!;
      goldCr.debitGold = 0;
      goldCr.creditGold = dto.kundanWeight ?? 0;
      goldCr.debitAmount = 0;
      goldCr.creditAmount = 0;
      goldCr.narration = `Gold Credited for FP ${dto.tagValue}`;
      goldCr.journalEntry = je;

      // Ledger entries - Labour (Balanced) if applicable
      const entries = [goldDr, goldCr];
      if (dto.labourCost && dto.labourCost > 0) {
        const cashDr = new LedgerEntry();
        cashDr.accountId = settings.defaultCashLedgerId;
        cashDr.debitAmount = dto.labourCost;
        cashDr.debitGold = 0;
        cashDr.creditGold = 0;
        cashDr.creditAmount = 0;
        cashDr.narration = `Labour Charges Contra`;
        cashDr.journalEntry = je;

        const labourCr = new LedgerEntry();
        labourCr.accountId = party.ledger_account_id!;
        labourCr.debitAmount = 0;
        labourCr.creditAmount = dto.labourCost;
        labourCr.debitGold = 0;
        labourCr.creditGold = 0;
        labourCr.narration = `Labour Charges Credited`;
        labourCr.journalEntry = je;
        entries.push(cashDr, labourCr);
      }

      je.ledgerEntries = entries;
      await em.save(je);

      // 7. Mark batch as COMPLETED
      batch.status = BatchStatus.COMPLETED;
      // batch.assignedTo = null;
      await em.save(batch);

      return { finishedProductId: savedFP.id };
    });
  }
}
