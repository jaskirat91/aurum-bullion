import { FinishedProduct, FinishedProductStatus } from '../entities/FinishedProduct';

export interface FinishedProductFilter {
  itemId?: string;
  batchNo?: string;
  status?: FinishedProductStatus;
  startDate?: string;
  endDate?: string;
  grossWeight?: string;
  page?: number;
  limit?: number;
  partyId?: string;
}

export interface FinishedProductTotals {
  grossWeight: number;
  kundanWeight: number;
  mottiWeight: number;
  stoneWeight: number;
  netWeight: number;
  amount: number;
}


export interface IFinishedProductRepository {
  findById(id: string): Promise<FinishedProduct | null>;
  findByBatchId(batchId: string): Promise<FinishedProduct[]>;
  findByStatus(status: FinishedProductStatus): Promise<FinishedProduct[]>;
  findAll(): Promise<FinishedProduct[]>;
  findWithFilters(filter: FinishedProductFilter): Promise<{ items: FinishedProduct[]; total: number; totals?: FinishedProductTotals }>;
  save(product: FinishedProduct): Promise<FinishedProduct>;
  delete(id: string): Promise<void>;
}
