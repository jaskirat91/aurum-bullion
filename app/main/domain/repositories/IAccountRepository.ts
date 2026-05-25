import { Account, AccountType } from '../entities/Account';

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findAll(activeOnly?: boolean): Promise<Account[]>;
  findByType(type: AccountType): Promise<Account[]>;
  findPaginated(
    page: number,
    limit: number,
    options?: {
      search?: string;
      is_group?: boolean;
      is_active?: boolean;
      parent_id?: string;
    }
  ): Promise<{ items: Account[]; total: number }>;
  save(account: Account): Promise<Account>;
}
