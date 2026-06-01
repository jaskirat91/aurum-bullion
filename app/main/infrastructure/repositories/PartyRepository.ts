import { In, Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Party, PartyType } from '../../domain/entities/Party';
import { IPartyRepository } from '../../domain/repositories/IPartyRepository';
import { GetPartiesDTO } from '@main/application/dto/GetPartiesDTO';

export class PartyRepository implements IPartyRepository {
  private readonly repo: Repository<Party>;

  constructor() {
    this.repo = AppDataSource.getRepository(Party);
  }

  findById(id: string): Promise<Party | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(code: string): Promise<Party | null> {
    return this.repo.findOne({ where: { code } });
  }

  findByLedgerAccountId(ledgerAccountId: string): Promise<Party | null> {
    return this.repo.findOne({
      where: { ledger_account_id: ledgerAccountId },
      relations: ['ledgerAccount'],
    });
  }

  findAll(activeOnly = true): Promise<Party[]> {
    return this.repo.find({
      where: activeOnly ? { is_active: true } : undefined,
      relations: ['ledgerAccount', 'ledgerAccount.parent'],
      order: { name: 'ASC' },
    });
  }

  findWithFilter(dto: GetPartiesDTO): Promise<Party[]> {
    return this.repo.find({
      where: {
        is_active: true,
        name: dto.search,
        type: dto.types && dto.types.length > 0 ? In(dto.types as PartyType[]) : undefined,
      },
      relations: ['ledgerAccount', 'ledgerAccount.parent'],
      order: { name: 'ASC' },
      skip: dto.offset,
      take: dto.limit,
    });
  }

  async save(party: Party): Promise<Party> {
    return this.repo.save(party);
  }

  async delete(id: string): Promise<void> {
    await this.repo.update(id, { is_active: false }); // soft delete
  }
}
