import { Between, Like, Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import {
  IJournalEntryRepository,
  JournalFilter,
} from '../../domain/repositories/IJournalEntryRepository';

export class JournalEntryRepository implements IJournalEntryRepository {
  private readonly repo: Repository<JournalEntry>;

  constructor() {
    this.repo = AppDataSource.getRepository(JournalEntry);
  }

  findById(id: string): Promise<JournalEntry | null> {
    return this.repo.findOne({ where: { id }, relations: ['ledgerEntries', 'voucher'] });
  }

  findBySourceReference(sourceRef: string): Promise<JournalEntry[]> {
    return this.repo.find({
      where: { sourceReference: sourceRef },
      relations: ['ledgerEntries', 'voucher'],
    });
  }

  findAll(): Promise<JournalEntry[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['ledgerEntries', 'voucher'],
    });
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: JournalFilter,
  ): Promise<{ items: JournalEntry[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = this.repo
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.voucher', 'voucher')
      .orderBy('journal.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.sourceReference) {
      query.andWhere('journal.sourceReference LIKE :sourceReference', {
        sourceReference: `%${filters.sourceReference}%`,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('journal.entryDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters?.startDate) {
      query.andWhere('journal.entryDate >= :start', { start: filters.startDate });
    } else if (filters?.endDate) {
      query.andWhere('journal.entryDate <= :end', { end: filters.endDate });
    }

    const [items, total] = await query.getManyAndCount();

    return { items, total };
  }

  async findAllFiltered(filters?: JournalFilter): Promise<JournalEntry[]> {
    const query = this.repo
      .createQueryBuilder('journal')
      .leftJoinAndSelect('journal.voucher', 'voucher')
      .leftJoinAndSelect('journal.ledgerEntries', 'ledgerEntries')
      .leftJoinAndSelect('ledgerEntries.account', 'account')
      .orderBy('journal.createdAt', 'DESC');

    if (filters?.voucherNo) {
      query.andWhere('voucher.voucherNo LIKE :voucherNo', {
        voucherNo: `%${filters.voucherNo}%`,
      });
    }

    if (filters?.sourceReference) {
      query.andWhere('journal.sourceReference LIKE :sourceReference', {
        sourceReference: `%${filters.sourceReference}%`,
      });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('journal.entryDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters?.startDate) {
      query.andWhere('journal.entryDate LIKE :start', { start: `${filters.startDate}%` });
    }

    return query.getMany();
  }

  getDetails(id: string): Promise<JournalEntry | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['ledgerEntries', 'ledgerEntries.account', 'voucher'],
    });
  }

  save(entry: JournalEntry): Promise<JournalEntry> {
    return this.repo.save(entry);
  }

  async generateNextVoucherNo(): Promise<string> {
    const year = new Date().getFullYear();
    const { Voucher } = require('../../domain/entities/Voucher');
    const { AppDataSource } = require('../database/data-source');
    return Voucher.generateNextVoucherNo(AppDataSource.manager, 'JV', year);
  }
}
