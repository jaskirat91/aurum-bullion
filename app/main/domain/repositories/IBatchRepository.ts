import { Batch } from '../entities/Batch';

export interface IBatchRepository {
  findById(id: string): Promise<Batch | null>;
  findByBatchNo(batchNo: string): Promise<Batch | null>;
  findAll(filters?: { assignedTo?: string; status?: string }): Promise<Batch[]>;
  findPaginated(page: number, limit: number, filters?: any): Promise<{ items: Batch[]; total: number }>;
  save(batch: Batch): Promise<Batch>;
}
