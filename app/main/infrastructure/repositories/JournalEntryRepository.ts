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

  async getOrderTransactions(
    orderVoucherId: string,
    accountId: string,
    isCustomerOrder: boolean,
  ): Promise<any[]> {
    const { LedgerEntry } = require('../../domain/entities/LedgerEntry');
    const { VoucherStatus } = require('../../domain/entities/Voucher');

    const qb = AppDataSource.createQueryBuilder(LedgerEntry, 'le')
      .innerJoin('journal_entries', 'je', 'le.journalEntryId = je.id')
      .innerJoin('vouchers', 'v', 'je.voucherId = v.id')
      .leftJoin('cash_vouchers', 'cv', 'v.id = cv.voucherId')
      .leftJoin('gold_vouchers', 'gv', 'v.id = gv.voucherId')
      .where('le.accountId = :accountId', { accountId })
      .andWhere('v.status = :status', { status: VoucherStatus.POSTED });

    if (isCustomerOrder) {
      qb.andWhere(
        '(cv.customerOrderVoucherId = :orderVoucherId OR gv.customerOrderVoucherId = :orderVoucherId)',
        { orderVoucherId },
      );
    } else {
      qb.andWhere(
        '(cv.supplierOrderVoucherId = :orderVoucherId OR gv.supplierOrderVoucherId = :orderVoucherId)',
        { orderVoucherId },
      );
    }

    return qb
      .select([
        'je.entryDate as entryDate',
        'v.voucherNo as voucherNo',
        'je.narration as narration',
        'SUM(le.creditAmount) as creditAmount',
        'SUM(le.debitAmount) as debitAmount',
        'SUM(le.creditGold) as creditGold',
        'SUM(le.debitGold) as debitGold',
      ])
      .groupBy('je.id')
      .orderBy('je.entryDate', 'ASC')
      .getRawMany();
  }

  async getOrderFulfillmentStats(
    orderVoucherId: string,
    accountId: string,
    isCustomerOrder: boolean,
    em?: any,
  ): Promise<any> {
    const { LedgerEntry } = require('../../domain/entities/LedgerEntry');
    const { VoucherStatus } = require('../../domain/entities/Voucher');

    const manager = em || AppDataSource.manager;
    const qb = manager
      .createQueryBuilder(LedgerEntry, 'le')
      .innerJoin('journal_entries', 'je', 'le.journalEntryId = je.id')
      .innerJoin('vouchers', 'v', 'je.voucherId = v.id')
      .leftJoin('cash_vouchers', 'cv', 'v.id = cv.voucherId')
      .leftJoin('gold_vouchers', 'gv', 'v.id = gv.voucherId')
      .where('le.accountId = :accountId', { accountId })
      .andWhere('v.status = :status', { status: VoucherStatus.POSTED });

    if (isCustomerOrder) {
      qb.andWhere(
        '(cv.customerOrderVoucherId = :orderVoucherId OR gv.customerOrderVoucherId = :orderVoucherId)',
        { orderVoucherId },
      );
    } else {
      qb.andWhere(
        '(cv.supplierOrderVoucherId = :orderVoucherId OR gv.supplierOrderVoucherId = :orderVoucherId)',
        { orderVoucherId },
      );
    }

    return qb
      .select([
        'SUM(le.debitAmount) as totalDebitAmount',
        'SUM(le.creditAmount) as totalCreditAmount',
        'SUM(le.debitGold) as totalDebitGold',
        'SUM(le.creditGold) as totalCreditGold',
      ])
      .getRawOne();
  }
}
