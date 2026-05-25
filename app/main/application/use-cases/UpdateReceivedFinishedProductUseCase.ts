import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { FinishedProduct } from '../../domain/entities/FinishedProduct';
import { Weight } from '../../domain/value-objects/Weight';
import { Party } from '../../domain/entities/Party';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';

export interface UpdateReceivedFinishedProductDTO {
  batchId: string;
  partyId: string;
  finishedItemId: string;
  transactionDate: string;
  grossWeight: number;
  kundanWeight?: number;
  stoneWeight?: number;
  mottiWeight?: number;
  piroiWeight?: number;
  netWeight: number;
  purityPercentage: number;
  labourCost?: number;

  grossWeightOfItems?: number;
  totalStones?: number;
  taarPattiWeight?: number;
  bStoneWeight?: number;
  colorStoneWeight?: number;
  labourRatePerStone?: number;

  tagGrossWeight?: number;
  tagKundanWeight?: number;
  tagStoneWeight?: number;
  tagMottiWeight?: number;
  tagNetWeight?: number;
  tagAmount?: number;
  tagValue?: string;
}

export class UpdateReceivedFinishedProductUseCase {
  async execute(dto: UpdateReceivedFinishedProductDTO): Promise<void> {
    return AppDataSource.transaction(async (em) => {
      // 1. Load batch and verify status
      const batch = await em.getRepository(Batch).findOne({
        where: { id: dto.batchId },
      });

      if (!batch) throw new Error(`Batch not found: ${dto.batchId}`);
      if (batch.status !== BatchStatus.COMPLETED) {
        throw new Error(`Only completed batches can be updated using this flow.`);
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
        throw new Error('Company settings (Default Ledgers) not found.');
      }

      // 2. Find existing receipt records
      const trx = await em.getRepository(MaterialTransaction).findOne({
        where: { batchId: dto.batchId, type: TransactionType.RECEIVE_FROM_KARIGAR },
      });
      if (!trx) throw new Error('Original receipt transaction not found for this batch.');

      const fp = await em.getRepository(FinishedProduct).findOne({
        where: { batchId: dto.batchId },
      });
      if (!fp) throw new Error('Finished Product record not found for this batch.');

      const je = await em.getRepository(JournalEntry).findOne({
        where: { sourceReference: fp.id },
        relations: ['ledgerEntries'],
      });
      if (!je) throw new Error('Accounting journal entry not found for this product.');

      // 3. Update records
      const net = Weight.of(dto.netWeight);
      const pureGold = net.multiply(dto.purityPercentage / 100);

      // Update Material Transaction
      trx.partyId = dto.partyId;
      trx.transactionDate = dto.transactionDate;
      trx.grossGoldWeight = dto.grossWeight;
      trx.lessWeight = dto.grossWeight - dto.netWeight;
      trx.netWeight = dto.netWeight;
      trx.tenchPercentage = dto.purityPercentage;
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

      // Update Finished Product
      fp.tag = dto.tagValue || '';
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
      await em.save(fp);

      // Update Journal Entry
      je.entryDate = dto.transactionDate;
      je.narration = `Updated: Finished Goods Receipt: Batch ${batch.batchNo} | Party: ${party.name}`;

      // Clear old ledger entries and create new ones (simplest way to handle unbalanced changes)
      await em.getRepository(LedgerEntry).remove(je.ledgerEntries);

      const newEntries: LedgerEntry[] = [];

      // Gold entries
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

      newEntries.push(goldDr, goldCr);

      // Labour entries
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

        newEntries.push(cashDr, labourCr);
      }

      je.ledgerEntries = newEntries;
      await em.save(je);
    });
  }
}
