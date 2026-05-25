import { AppDataSource } from '../../infrastructure/database/data-source';
import { BankStatementRow } from '../../domain/entities/BankStatementRow';

export class GetStagedRowsUseCase {
  async execute(importId: string): Promise<BankStatementRow[]> {
    const rowRepo = AppDataSource.getRepository(BankStatementRow);
    return rowRepo.find({
      where: { importId },
      relations: ['detectedParty'],
      order: { entryDate: 'ASC', createdAt: 'ASC' }
    });
  }
}
