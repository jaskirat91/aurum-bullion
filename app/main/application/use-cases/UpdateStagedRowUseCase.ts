import { AppDataSource } from '../../infrastructure/database/data-source';
import { BankStatementRow } from '../../domain/entities/BankStatementRow';
import { PartyDetectionService } from '../services/PartyDetectionService';

export interface UpdateStagedRowDTO {
  id: string;
  detectedPartyId?: string;
  amount?: number;
  type?: string;
  remarks?: string;
  status?: string;
}

export class UpdateStagedRowUseCase {
  private detectionService = new PartyDetectionService();

  async execute(dto: UpdateStagedRowDTO): Promise<void> {
    const rowRepo = AppDataSource.getRepository(BankStatementRow);
    const row = await rowRepo.findOne({ where: { id: dto.id } });
    if (!row) throw new Error('Staged row not found.');

    if (dto.detectedPartyId !== undefined) {
      row.detectedPartyId = dto.detectedPartyId;
      row.confidenceScore = 100; // Manually selected
      
      // Auto-learn alias
      if (dto.detectedPartyId) {
        await this.detectionService.learnAlias(dto.detectedPartyId, row.narration);
      }
    }

    if (dto.amount !== undefined) row.amount = dto.amount;
    if (dto.type !== undefined) row.type = dto.type;
    if (dto.remarks !== undefined) row.remarks = dto.remarks;
    if (dto.status !== undefined) row.status = dto.status;

    await rowRepo.save(row);
  }
}
