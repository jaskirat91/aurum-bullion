import { AppDataSource } from '../../infrastructure/database/data-source';
import { Batch, BatchStatus } from '../../domain/entities/Batch';
import { Party } from '../../domain/entities/Party';
import { MaterialTransaction, TransactionType } from '../../domain/entities/MaterialTransaction';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Weight } from '../../domain/value-objects/Weight';
import { WeightCalculationService } from '../../domain/services/WeightCalculationService';
import { CreateJournalEntryUseCase } from './CreateJournalEntryUseCase';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';
import { Like } from 'typeorm';
export interface ReceiveRawMaterialDTO {
  batchId?: string;
  batchNo: string;
  itemId: string;
  partyId: string;
  debitAccountId: string;
  transactionDate: string;
  overwrite?: boolean;
  weights: {
    grossGoldWeight: number;
    lessWeight: number;
    netWeight: number;
    tenchPercentage: number;
    wastePercentage: number;
    netPureGoldWeight: number;
  };
}

export class ReceiveRawMaterialUseCase {
  private readonly weightService = new WeightCalculationService();

  async execute(dto: ReceiveRawMaterialDTO): Promise<void> {
    console.log('Incoming DTO:', dto);
    await AppDataSource.transaction(async (em) => {
      // 1. Initial Validation / Update Logic
      let batch: Batch | null = null;
      if (dto.batchId) {
        batch = await em.getRepository(Batch).findOne({
          where: { id: dto.batchId },
          relations: ['transactions'],
        });
      } else {
        batch = await em.getRepository(Batch).findOne({
          where: { batchNo: dto.batchNo },
          relations: ['transactions'],
        });
      }

      if (batch) {
        if (!dto.overwrite && !dto.batchId) {
          throw new Error(`Batch number ${dto.batchNo} already exists.`);
        }
        if (batch.status !== BatchStatus.RECEIVED) {
          throw new Error(`Cannot update batch. Current status is ${batch.status}`);
        }
      }

      const party = await em.getRepository(Party).findOne({ where: { id: dto.partyId } });
      if (!party || !party.ledger_account_id) {
        throw new Error('Selected party does not have a linked ledger account.');
      }

      // 2. Domain logic: Precision Weight Calculation
      const gross = Weight.of(dto.weights.grossGoldWeight);
      const less = Weight.of(dto.weights.lessWeight);
      const net = this.weightService.calculateNetWeight(gross, less);
      const pure = this.weightService.calculateNetPureGold(
        net,
        dto.weights.tenchPercentage,
        dto.weights.wastePercentage,
      );

      // 3. Persist Inventory Batch & Material Transaction Atomically
      if (!batch) {
        batch = new Batch();
      }
      batch.batchNo = dto.batchNo;
      batch.itemId = dto.itemId;
      batch.sourcePartyId = dto.partyId;
      batch.status = BatchStatus.RECEIVED;

      let trx = batch.transactions && batch.transactions.length > 0 ? batch.transactions[0] : null;
      if (!trx) {
        trx = new MaterialTransaction();
        trx.type = TransactionType.RECEIPT;
        batch.transactions = [trx];
      }

      trx.transactionDate = dto.transactionDate;
      trx.partyId = dto.partyId;
      trx.grossGoldWeight = gross.grams;
      trx.lessWeight = less.grams;
      trx.netWeight = net.grams;
      trx.tenchPercentage = dto.weights.tenchPercentage;
      trx.wastePercentage = dto.weights.wastePercentage;
      trx.netPureGoldWeight = pure.grams;
      trx.debitAccountId = dto.debitAccountId;

      trx.kundanWeight = 0;
      trx.totalStones = 0;
      trx.labourPerStone = 0;
      trx.totalStoneLabour = 0;
      trx.grossWeightOfItems = 0;
      trx.piroiWeight = 0;
      trx.bStoneWeight = 0;
      trx.stoneWeight = 0;
      trx.taarPattiWeight = 0;
      trx.colorStoneWeight = 0;
      trx.tagGrossWeight = 0;
      trx.tagKundanWeight = 0;
      trx.tagStoneWeight = 0;
      trx.tagMottiWeight = 0;
      trx.tagNetWeight = 0;
      trx.tagAmount = 0;

      const savedBatch = await em.save(batch);

      // Now save the transaction explicitly linking it to the saved batch ID
      if (trx) {
        trx.batchId = savedBatch.id;
        await em.save(trx);
      }

      // 4. Create or Update Accounting Journal Entry
      let je = await em.getRepository(JournalEntry).findOne({
        where: { sourceReference: savedBatch.id },
        relations: ['ledgerEntries'],
      });

      if (!je) {
        const year = new Date(dto.transactionDate).getFullYear();
        
        const voucherNo = await Voucher.generateNextVoucherNo(em, 'RM-REC', year);

        const voucher = new Voucher();
        voucher.voucherNo = voucherNo;
        voucher.type = VoucherType.RECEIPT;
        voucher.entryDate = dto.transactionDate;
        voucher.narration = `Raw Material Receipt: Batch ${dto.batchNo} | Party: ${party.name}`;
        voucher.status = VoucherStatus.POSTED;
        const savedVoucher = await em.save(voucher);

        je = new JournalEntry();
        je.voucherId = savedVoucher.id;
      } else {
        // Clear old ledger entries safely
        if (je.ledgerEntries && je.ledgerEntries.length > 0) {
          await em.getRepository(LedgerEntry).remove(je.ledgerEntries);
        }
      }

      je.entryDate = dto.transactionDate;
      je.narration = `Raw Material Receipt: Batch ${dto.batchNo} | Party: ${party.name}`;
      je.sourceReference = savedBatch.id;

      const debitLine = new LedgerEntry();
      debitLine.accountId = dto.debitAccountId;
      debitLine.debitGold = pure.grams;
      debitLine.creditGold = 0;
      debitLine.debitAmount = 0;
      debitLine.creditAmount = 0;
      debitLine.narration = `Stock In - Batch ${dto.batchNo}`;
      debitLine.journalEntry = je;

      const creditLine = new LedgerEntry();
      creditLine.accountId = party.ledger_account_id!;
      creditLine.debitGold = 0;
      creditLine.creditGold = pure.grams;
      creditLine.debitAmount = 0;
      creditLine.creditAmount = 0;
      creditLine.narration = `Gold Credited for Batch ${dto.batchNo}`;
      creditLine.journalEntry = je;

      je.ledgerEntries = [debitLine, creditLine];
      await em.save(je);
    });
  }
}
