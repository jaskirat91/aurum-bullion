import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Account, AccountType } from '../../domain/entities/Account';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';

export class AccountRepository implements IAccountRepository {
  private readonly repo: Repository<Account>;

  constructor() {
    this.repo = AppDataSource.getRepository(Account);
  }

  findById(id: string): Promise<Account | null> {
    return this.repo.findOne({ where: { id }, relations: ['parent'] });
  }

  findByCode(code: string): Promise<Account | null> {
    return this.repo.findOne({ where: { code } });
  }

  findAll(activeOnly = true): Promise<Account[]> {
    return this.repo.find({
      where: activeOnly ? { is_active: true } : undefined,
      order: { code: 'ASC' },
      relations: ['parent'],
    });
  }

  findByType(type: AccountType): Promise<Account[]> {
    return this.repo.find({
      where: { account_type: type, is_active: true },
      order: { code: 'ASC' },
      relations: ['parent'],
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    options?: {
      search?: string;
      is_group?: boolean;
      is_active?: boolean;
      parent_id?: string;
    }
  ): Promise<{ items: Account[]; total: number }> {
    const where: FindOptionsWhere<Account> = {};
    
    if (options?.is_active !== undefined) where.is_active = options.is_active;
    if (options?.is_group !== undefined) where.is_group = options.is_group;
    if (options?.parent_id !== undefined) where.parent_id = options.parent_id;

    let query = this.repo.createQueryBuilder('account')
      .leftJoinAndSelect('account.parent', 'parent')
      .where(where);

    if (options?.search) {
      query = query.andWhere('(account.name LIKE :search OR account.code LIKE :search)', {
        search: `%${options.search}%`,
      });
    }

    const [items, total] = await query
      .orderBy('account.code', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  save(account: Account): Promise<Account> {
    return this.repo.save(account);
  }
}
