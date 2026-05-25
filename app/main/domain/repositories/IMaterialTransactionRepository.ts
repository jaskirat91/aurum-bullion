import { MaterialTransaction, TransactionType } from '../entities/MaterialTransaction';

export interface IMaterialTransactionRepository {
  findById(id: string): Promise<MaterialTransaction | null>;
  findByBatchId(batchId: string): Promise<MaterialTransaction[]>;
  findByPartyId(partyId: string): Promise<MaterialTransaction[]>;
  findByType(type: TransactionType): Promise<MaterialTransaction[]>;
  save(transaction: MaterialTransaction): Promise<MaterialTransaction>;
}
