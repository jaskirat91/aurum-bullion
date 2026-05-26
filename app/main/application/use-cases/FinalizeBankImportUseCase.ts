import { AppDataSource } from '../../infrastructure/database/data-source';
import { BankStatementImport } from '../../domain/entities/BankStatementImport';
import { BankStatementRow } from '../../domain/entities/BankStatementRow';
import { CreateCashVoucherUseCase } from './CreateCashVoucherUseCase';

export class FinalizeBankImportUseCase {
  private createVoucherUseCase = new CreateCashVoucherUseCase();

  async execute(importId: string): Promise<{ createdCount: number; failedCount: number }> {
    const importRepo = AppDataSource.getRepository(BankStatementImport);
    const session = await importRepo.findOne({ where: { id: importId } });
    if (!session) throw new Error('Import session not found.');

    // Duplicate check
    const existingSuccessfulImport = await importRepo.findOne({
      where: { uploadedFileHash: session.uploadedFileHash, status: 'PROCESSED' },
    });
    if (existingSuccessfulImport) {
      throw new Error(
        `This file has already been successfully processed on ${existingSuccessfulImport.createdAt.toLocaleDateString()}`,
      );
    }

    const rowRepo = AppDataSource.getRepository(BankStatementRow);
    const rows = await rowRepo.find({ where: { importId, status: 'PENDING' } });

    let createdCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      if (row.status === 'EXCLUDED') {
        continue;
      }

      if (!row.detectedPartyId) {
        row.status = 'SKIPPED';
        row.remarks = (row.remarks ? row.remarks + ' | ' : '') + 'No party selected.';
        await rowRepo.save(row);
        failedCount++;
        continue;
      }

      try {
        const result = await this.createVoucherUseCase.execute({
          type: row.type === 'CR' ? 'Receipt' : 'Payment',
          partyAccountId: await this.getPartyLedgerAccountId(row.detectedPartyId),
          accountId: session.bankLedgerAccountId,
          entryDate: row.entryDate,
          receiptAmount: row.type === 'CR' ? row.amount : 0,
          paymentAmount: row.type === 'DR' ? row.amount : 0,
          narration: row.narration,
          remarks: row.remarks,
          remarksTime: row.entryTime,
          action: 'POST',
        });

        if (result.success) {
          row.status = 'CREATED';
          row.remarks =
            (row.remarks ? row.remarks + ' | ' : '') + `Voucher Created: ${result.voucherNo}`;
          await rowRepo.save(row);
          createdCount++;
        } else {
          throw new Error('Voucher creation failed.');
        }
      } catch (err: any) {
        row.status = 'FAILED';
        row.remarks = (row.remarks ? row.remarks + ' | ' : '') + `Error: ${err.message}`;
        await rowRepo.save(row);
        failedCount++;
      }
    }

    session.status = failedCount === 0 ? 'PROCESSED' : createdCount > 0 ? 'PARTIAL' : 'FAILED';
    await importRepo.save(session);

    return { createdCount, failedCount };
  }

  private async getPartyLedgerAccountId(partyId: string): Promise<string> {
    const partyRepo = AppDataSource.getRepository('Party'); // Avoid circular if any, but string name works
    const party: any = await partyRepo.findOne({ where: { id: partyId } });
    if (!party || !party.ledger_account_id) {
      throw new Error(`Party ${partyId} does not have a linked ledger account.`);
    }
    return party.ledger_account_id;
  }
}
