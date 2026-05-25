import { AppDataSource } from '../../infrastructure/database/data-source';
import { Party } from '../../domain/entities/Party';
import { Account } from '../../domain/entities/Account';
import { Batch } from '../../domain/entities/Batch';
import { MaterialTransaction } from '../../domain/entities/MaterialTransaction';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { FinishedProduct } from '../../domain/entities/FinishedProduct';
import { In } from 'typeorm';

export class ReportService {
  async getPartyLedgerReport(filters: {
    partyIds?: string[];
    startDate?: string;
    endDate?: string;
  }) {
    const partyRepo = AppDataSource.getRepository(Party);
    const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

    const partyQuery: any = {};
    if (filters.partyIds && filters.partyIds.length > 0) {
      partyQuery.id = In(filters.partyIds);
    }

    const parties = await partyRepo.find({ where: partyQuery });

    const reportData = [];

    for (const party of parties) {
      if (!party.ledger_account_id) continue;

      const queryBuilder = ledgerRepo
        .createQueryBuilder('le')
        .leftJoinAndSelect('le.journalEntry', 'je')
        .where('le.accountId = :accountId', { accountId: party.ledger_account_id });

      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('je.entryDate BETWEEN :start AND :end', {
          start: filters.startDate,
          end: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('je.entryDate >= :start', { start: filters.startDate });
      } else if (filters.endDate) {
        queryBuilder.andWhere('je.entryDate <= :end', { end: filters.endDate });
      }

      const entries = await queryBuilder.getMany();

      let debitGold = 0;
      let debitAmount = 0;
      let creditGold = 0;
      let creditAmount = 0;

      for (const entry of entries) {
        if (entry.debitGold) debitGold += Number(entry.debitGold);
        if (entry.debitAmount) debitAmount += Number(entry.debitAmount);
        if (entry.creditGold) creditGold += Number(entry.creditGold);
        if (entry.creditAmount) creditAmount += Number(entry.creditAmount);
      }

      reportData.push({
        partyId: party.id,
        partyName: party.name,
        partyCode: party.code,
        debitGold,
        debitAmount,
        creditGold,
        creditAmount,
      });
    }

    return reportData;
  }

  async getAccountLedgerReport(filters: {
    accountIds?: string[];
    startDate?: string;
    endDate?: string;
  }) {
    const ledgerRepo = AppDataSource.getRepository(LedgerEntry);
    const accountRepo = AppDataSource.getRepository(Account);

    const accountQuery: any = {};
    if (filters.accountIds && filters.accountIds.length > 0) {
      accountQuery.id = In(filters.accountIds);
    }

    const accounts = await accountRepo.find({ where: accountQuery });

    const reportData = [];

    for (const account of accounts) {
      const queryBuilder = ledgerRepo
        .createQueryBuilder('le')
        .leftJoinAndSelect('le.journalEntry', 'je')
        .where('le.accountId = :accountId', { accountId: account.id });

      if (filters.startDate && filters.endDate) {
        queryBuilder.andWhere('je.entryDate BETWEEN :start AND :end', {
          start: filters.startDate,
          end: filters.endDate,
        });
      } else if (filters.startDate) {
        queryBuilder.andWhere('je.entryDate >= :start', { start: filters.startDate });
      } else if (filters.endDate) {
        queryBuilder.andWhere('je.entryDate <= :end', { end: filters.endDate });
      }

      const entries = await queryBuilder.getMany();

      let debitGold = 0;
      let debitAmount = 0;
      let creditGold = 0;
      let creditAmount = 0;

      for (const entry of entries) {
        if (entry.debitGold) debitGold += Number(entry.debitGold);
        if (entry.debitAmount) debitAmount += Number(entry.debitAmount);
        if (entry.creditGold) creditGold += Number(entry.creditGold);
        if (entry.creditAmount) creditAmount += Number(entry.creditAmount);
      }

      reportData.push({
        accountId: account.id,
        accountName: account.name,
        accountCode: account.code,
        debitGold,
        debitAmount,
        creditGold,
        creditAmount,
      });
    }

    return reportData;
  }

  async getBatchSummary() {
    const batchRepo = AppDataSource.getRepository(Batch);
    const summary = await batchRepo
      .createQueryBuilder('batch')
      .select('batch.status', 'status')
      .addSelect('COUNT(batch.id)', 'count')
      .groupBy('batch.status')
      .getRawMany();

    return summary.map((s) => ({
      status: s.status,
      count: parseInt(s.count),
    }));
  }

  async getKarigarConsumablesReport(
    page: number,
    limit: number,
    filters: { partyId?: string; startDate?: string; endDate?: string },
  ) {
    const mtRepo = AppDataSource.getRepository(MaterialTransaction);
    const skip = (page - 1) * limit;

    const queryBuilder = mtRepo
      .createQueryBuilder('mt')
      .leftJoinAndSelect('mt.batch', 'batch')
      .leftJoinAndSelect('batch.item', 'item')
      .leftJoinAndSelect('mt.party', 'party')
      .where('mt.type = :type', { type: 'RECEIVE_FROM_KARIGAR' });

    if (filters.partyId) {
      queryBuilder.andWhere('mt.partyId = :partyId', { partyId: filters.partyId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('mt.transactionDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('mt.transactionDate >= :start', { start: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('mt.transactionDate <= :end', { end: filters.endDate });
    }

    queryBuilder.orderBy('mt.transactionDate', 'DESC');
    queryBuilder.addOrderBy('mt.createdAt', 'DESC');

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { items, total };
  }

  async getKarigarConsumablesSummary(filters: {
    partyId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const mtRepo = AppDataSource.getRepository(MaterialTransaction);

    const queryBuilder = mtRepo
      .createQueryBuilder('mt')
      .select('SUM(mt.grossGoldWeight)', 'grossGoldWeight')
      .addSelect('SUM(mt.kundanWeight)', 'kundanWeight')
      .addSelect('SUM(mt.piroiWeight)', 'piroiWeight')
      .addSelect('SUM(mt.bStoneWeight)', 'bStoneWeight')
      .addSelect('SUM(mt.stoneWeight)', 'stoneWeight')
      .addSelect('SUM(mt.taarPattiWeight)', 'taarPattiWeight')
      .addSelect('SUM(mt.colorStoneWeight)', 'colorStoneWeight')
      .where('mt.type = :type', { type: 'RECEIVE_FROM_KARIGAR' });

    if (filters.partyId) {
      queryBuilder.andWhere('mt.partyId = :partyId', { partyId: filters.partyId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('mt.transactionDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('mt.transactionDate >= :start', { start: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('mt.transactionDate <= :end', { end: filters.endDate });
    }

    const res = await queryBuilder.getRawOne();

    return {
      grossGoldWeight: parseFloat(res.grossGoldWeight) || 0,
      kundanWeight: parseFloat(res.kundanWeight) || 0,
      piroiWeight: parseFloat(res.piroiWeight) || 0,
      bStoneWeight: parseFloat(res.bStoneWeight) || 0,
      stoneWeight: parseFloat(res.stoneWeight) || 0,
      taarPattiWeight: parseFloat(res.taarPattiWeight) || 0,
      colorStoneWeight: parseFloat(res.colorStoneWeight) || 0,
    };
  }

  async getCustomerPurchaseLedgerReport(filters: {
    partyIds?: string[];
    itemIds?: string[];
    startDate?: string;
    endDate?: string;
  }) {
    const fpRepo = AppDataSource.getRepository(FinishedProduct);

    const queryBuilder = fpRepo
      .createQueryBuilder('fp')
      .leftJoinAndSelect('fp.party', 'party')
      .leftJoinAndSelect('fp.finishedItem', 'item')
      .leftJoinAndSelect('fp.goldLedgerEntry', 'gle')
      .leftJoinAndSelect('fp.amountLedgerEntry', 'ale')
      .where('fp.status = :status', { status: 'SOLD' });

    if (filters.partyIds && filters.partyIds.length > 0) {
      queryBuilder.andWhere('fp.partyId IN (:...partyIds)', { partyIds: filters.partyIds });
    }

    if (filters.itemIds && filters.itemIds.length > 0) {
      queryBuilder.andWhere('fp.finishedItemId IN (:...itemIds)', { itemIds: filters.itemIds });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('DATE(fp.transactionDate) BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('DATE(fp.transactionDate) >= :start', { start: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('DATE(fp.transactionDate) <= :end', { end: filters.endDate });
    }

    queryBuilder.orderBy('fp.transactionDate', 'ASC');
    queryBuilder.addOrderBy('fp.createdAt', 'ASC');
    const data = await queryBuilder.getMany();
    return data;
  }

  async getAccountStatement(filters: {
    accountId: string;
    startDate?: string;
    endDate?: string;
  }) {
    let dateFilter = '';
    const params: any = { accountId: filters.accountId };

    if (filters.startDate && filters.endDate) {
      dateFilter = 'AND je.entryDate BETWEEN ? AND ?';
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    } else if (filters.startDate) {
      dateFilter = 'AND je.entryDate >= ?';
      params.startDate = filters.startDate;
    } else if (filters.endDate) {
      dateFilter = 'AND je.entryDate <= ?';
      params.endDate = filters.endDate;
    }

    const query = `
      WITH base AS (
        SELECT
          je.entryDate,
          je.id,
          le.accountId,
          a.account_freeze_date,
          p."type" AS "partyType",
          p.name AS "partyName", 
          v."type" AS "voucherType", 
          v.voucherNo,
          v.createdAt,
          REPLACE(REPLACE(je.narration, CHAR(10), ' '), CHAR(13), ' ') AS "journalNarration",
          REPLACE(REPLACE(v.narration, CHAR(10), ' '), CHAR(13), ' ') AS "voucherNarration",
          i.name AS "itemName",

          fp.tagGrossWeight,
          fp.tagKundanWeight,
          fp.taarPattiWeight,
          fp.tagMottiWeight,
          fp.tagStoneWeight, 
          fp.tagNetWeight,
          fp.soldGoldPercentage,

          -- Precision-safe Stk
          CASE 
            WHEN v.type = 'SALES' AND svi.productId IS NOT NULL
              THEN CAST(svi.netGoldWeight AS DECIMAL(16,3))
            ELSE 
              CAST(
                SUM(
                  CAST(le.debitGold AS DECIMAL(16,3)) 
                  - CAST(le.creditGold AS DECIMAL(16,3))
                ) AS DECIMAL(16,3)
              )
          END AS Stk,

          -- Precision-safe Amt
          CASE 
            WHEN v.type = 'SALES' AND svi.productId IS NOT NULL
              THEN CAST(svi.soldAmount AS DECIMAL(16,2))
            ELSE 
              CAST(
                SUM(
                  CAST(le.debitAmount AS DECIMAL(16,2)) 
                  - CAST(le.creditAmount AS DECIMAL(16,2))
                ) AS DECIMAL(16,2)
              )
          END AS Amt

        FROM ledger_entries le
        LEFT JOIN journal_entries je ON je.id = le.journalEntryId 
        LEFT JOIN accounts a ON a.id = le.accountId
        LEFT JOIN vouchers v ON v.id = je.voucherId 
        LEFT JOIN parties p ON p.ledger_account_id = le.accountId 
        LEFT JOIN sale_voucher_items svi ON (
          svi.voucherId = v.id 
          AND (p.id IS NOT NULL OR COALESCE(a.account_subtype, '') NOT IN ('CASH', 'BANK', 'GOLD'))
        )
        LEFT JOIN finished_products fp ON fp.id = svi.productId
        LEFT JOIN items i ON i.id = fp.finishedItemId 

        WHERE 
          v.status = 'POSTED'
          AND le.accountId = ?
          ${dateFilter}

        GROUP BY 
          je.entryDate, je.id, le.accountId,
          p."type", p.name,
          v.voucherNo, v.type, v.createdAt,
          REPLACE(REPLACE(je.narration, CHAR(10), ' '), CHAR(13), ' '), 
          REPLACE(REPLACE(v.narration, CHAR(10), ' '), CHAR(13), ' '),
          svi.productId, i.name,
          svi.netGoldWeight, svi.soldAmount,
          fp.tagGrossWeight,
          fp.tagKundanWeight,
          fp.taarPattiWeight,
          fp.tagMottiWeight,
          fp.tagStoneWeight, 
          fp.tagNetWeight
      )

      SELECT
        *,

        -- Dr/Cr split (Stock)
        CASE WHEN Stk >= 0 THEN Stk END AS "DrStk",
        CASE WHEN Stk < 0 THEN ABS(Stk) END AS "CrStk",

        -- 🔥 Precision-safe Running Stock
        CAST(
          SUM(CAST(Stk AS DECIMAL(16,3))) OVER (
            PARTITION BY accountId
            ORDER BY entryDate, createdAt, voucherNo
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          )
        AS DECIMAL(16,3)) AS "BalStk",
        
        -- Dr/Cr split (Amount)
        CASE WHEN Amt >= 0 THEN Amt END AS "DrAmt",
        CASE WHEN Amt < 0 THEN ABS(Amt) END AS "CrAmt",

        -- 🔥 Precision-safe Running Amount
        CAST(
          SUM(CAST(Amt AS DECIMAL(16,2))) OVER (
            PARTITION BY accountId
            ORDER BY entryDate, createdAt, voucherNo
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          )
        AS DECIMAL(16,2)) AS "RunningAmt"

      FROM base

      ORDER BY entryDate ASC, createdAt ASC, voucherNo ASC;
    `;

    return await AppDataSource.query(query, [
      params.accountId,
      ...(params.startDate ? [params.startDate] : []),
      ...(params.endDate ? [params.endDate] : []),
    ]);
  }

  private async getLeafAccountIds(groupId: string): Promise<string[]> {
    const accountRepo = AppDataSource.getRepository(Account);
    const children = await accountRepo.find({ where: { parent_id: groupId } });
    let ids: string[] = [];
    for (const child of children) {
      if (child.is_group) {
        ids = ids.concat(await this.getLeafAccountIds(child.id));
      } else {
        ids.push(child.id);
      }
    }
    return ids;
  }

  async getLenaDenaReport(filters: {
    groupId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const accountRepo = AppDataSource.getRepository(Account);
    const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

    let groupsToProcess: Account[] = [];

    if (filters.groupId) {
      const selected = await accountRepo.findOne({ where: { id: filters.groupId } });
      if (selected) groupsToProcess.push(selected);
    } else {
      // Get all groups
      groupsToProcess = await accountRepo.find({ where: { is_group: true } });
    }

    const reportData = [];

    for (const group of groupsToProcess) {
      const leafAccountIds = await this.getLeafAccountIds(group.id);
      if (leafAccountIds.length === 0) continue;

      const groupEntries = [];

      for (const accountId of leafAccountIds) {
        const account = await accountRepo.findOne({ where: { id: accountId } });
        if (!account) continue;

        const queryBuilder = ledgerRepo
          .createQueryBuilder('le')
          .leftJoin('le.journalEntry', 'je')
          .select('SUM(le.debitAmount)', 'debitAmount')
          .addSelect('SUM(le.creditAmount)', 'creditAmount')
          .addSelect('SUM(le.debitGold)', 'debitGold')
          .addSelect('SUM(le.creditGold)', 'creditGold')
          .where('le.accountId = :accountId', { accountId });

        if (filters.endDate) {
          queryBuilder.andWhere('je.entryDate <= :endDate', { endDate: filters.endDate });
        }

        const balance = await queryBuilder.getRawOne();

        const debitAmt = Number(balance.debitAmount) || 0;
        const creditAmt = Number(balance.creditAmount) || 0;
        const debitStk = Number(balance.debitGold) || 0;
        const creditStk = Number(balance.creditGold) || 0;

        const netAmt = debitAmt - creditAmt;
        const netStk = debitStk - creditStk;

        groupEntries.push({
          accountId: account.id,
          accountName: account.name,
          accountCode: account.code,
          drAmt: netAmt > 0 ? netAmt : 0,
          crAmt: netAmt < 0 ? Math.abs(netAmt) : 0,
          drStk: netStk > 0 ? netStk : 0,
          crStk: netStk < 0 ? Math.abs(netStk) : 0,
        });
      }

      if (groupEntries.length > 0) {
        reportData.push({
          groupId: group.id,
          groupName: group.name,
          accounts: groupEntries,
        });
      }
    }

    return reportData;
  }
}
