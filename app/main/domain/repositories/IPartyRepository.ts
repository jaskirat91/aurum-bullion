import { GetPartiesDTO } from '@main/application/dto/GetPartiesDTO';
import { Party } from '../entities/Party';

export interface IPartyRepository {
  findById(id: string): Promise<Party | null>;
  findByCode(code: string): Promise<Party | null>;
  findAll(activeOnly?: boolean): Promise<Party[]>;
  save(party: Party): Promise<Party>;
  delete(id: string): Promise<void>;
  findWithFilter(dto: GetPartiesDTO): Promise<Party[]>;
}
