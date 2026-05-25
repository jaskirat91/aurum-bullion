import { AppDataSource } from '../../infrastructure/database/data-source';
import { BankStatementImport } from '../../domain/entities/BankStatementImport';
import { BankStatementRow } from '../../domain/entities/BankStatementRow';
import { BankStatementParser } from '../services/BankStatementParser';
import { PartyDetectionService } from '../services/PartyDetectionService';
import * as crypto from 'crypto';

export interface ImportBankStatementDTO {
  bankLedgerAccountId: string;
  filePath: string;
  fileBuffer: ArrayBuffer;
  fileName: string;
  uploadedBy: string;
}

export class ImportBankStatementUseCase {
  private parser = new BankStatementParser();
  private detectionService = new PartyDetectionService();

  async execute(dto: ImportBankStatementDTO): Promise<{ importId: string }> {
    const buffer = Buffer.from(dto.fileBuffer);
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
    const extension = dto.fileName.substring(dto.fileName.lastIndexOf('.')).toLowerCase();

    // 2. Parse file
    const rawTransactions = await this.parser.parse(buffer, extension);
    if (rawTransactions.length === 0) {
      throw new Error('No transactions found in the file.');
    }

    // 3. Initialize detection service
    await this.detectionService.initialize();

    return AppDataSource.transaction(async (em) => {
      // 4. Create Import Session
      const session = new BankStatementImport();
      session.bankLedgerAccountId = dto.bankLedgerAccountId;
      session.uploadedFileName = dto.fileName;
      session.uploadedFileHash = fileHash;
      session.uploadedBy = dto.uploadedBy;
      session.status = 'PENDING';
      const savedSession = await em.save(session);

      // 5. Create Staged Rows
      const rows: BankStatementRow[] = [];
      for (const raw of rawTransactions) {
        const detection = this.detectionService.detect(raw.narration);
        
        const row = new BankStatementRow();
        row.importId = savedSession.id;
        row.entryDate = this.formatDate(raw.date);
        row.narration = raw.narration;
        row.normalizedNarration = this.detectionService.cleanNarration(raw.narration);
        row.amount = raw.amount || 0;
        row.type = raw.type || 'CR';
        row.balance = raw.balance;
        row.referenceNo = raw.referenceNo;
        row.detectedPartyId = detection.partyId;
        row.confidenceScore = detection.confidence;
        row.rawRowJson = JSON.stringify(raw.rawRow);
        row.status = 'PENDING';
        rows.push(row);
      }

      await em.save(BankStatementRow, rows);

      return { importId: savedSession.id };
    });
  }

  private formatDate(dateStr: string): string {
    // Basic date normalization. In a real app, this should be more robust.
    // Try to handle DD/MM/YYYY, YYYY-MM-DD, etc.
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}

    // Fallback or more complex parsing could go here
    return dateStr;
  }
}
