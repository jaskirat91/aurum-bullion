import { AppDataSource } from '../../infrastructure/database/data-source';
import { Party, BalanceType } from '../../domain/entities/Party';
import { Item } from '../../domain/entities/Item';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Batch } from '../../domain/entities/Batch';
import {
  Account,
  AccountType,
  NormalBalance,
  AccountUnit,
  AccountSubtype,
} from '../../domain/entities/Account';
import { CompanySetting } from '../../domain/entities/CompanySetting';

export interface SetupAccountDTO {
  code: string;
  name: string;
  type: string;
  subType: string;
  normalBalance: string;
  unit: string;
}

export class SetupService {
  async isInitialized(): Promise<boolean> {
    if (!AppDataSource.isInitialized) return false;
    const count = await AppDataSource.getRepository(CompanySetting).count();
    return count > 0;
  }

  async initializeCompany(data: {
    companyName: string;
    financialYear: string;
    accounts: SetupAccountDTO[];
    contraAccounts: SetupAccountDTO[];
    defaultGoldLedgerCode: string;
    defaultCashLedgerCode: string;
  }): Promise<{ success: boolean; error?: string }> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. Save Settings
      const settingsRepo = queryRunner.manager.getRepository(CompanySetting);
      let settings = await settingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) {
        settings = new CompanySetting();
        settings.id = 'current';
      }
      settings.name = data.companyName;
      settings.financialYear = data.financialYear;

      // 2. Setup Base Accounts
      const accountRepo = queryRunner.manager.getRepository(Account);
      let goldLedgerId = '';
      let cashLedgerId = '';
      for (const acc of [...data.accounts, ...data.contraAccounts]) {
        const entity = new Account();
        entity.code = acc.code;
        entity.name = acc.name;
        entity.account_type = acc.type as AccountType;
        entity.account_subtype = acc.subType as AccountSubtype;
        entity.normal_balance = acc.normalBalance as NormalBalance;
        entity.unit = (acc.unit as AccountUnit) || AccountUnit.INR;
        entity.is_group = false;
        entity.allow_direct_posting = true;
        entity.is_active = true;
        entity.is_system = true;
        const savedAccount = await accountRepo.save(entity);

        if (acc.code === data.defaultGoldLedgerCode) {
          goldLedgerId = savedAccount.id;
        }
        if (acc.code === data.defaultCashLedgerCode) {
          cashLedgerId = savedAccount.id;
        }
      }

      if (!goldLedgerId) {
        throw new Error(
          `Default gold ledger code ${data.defaultGoldLedgerCode} not found in accounts list.`,
        );
      }
      if (!cashLedgerId) {
        throw new Error(
          `Default cash ledger code ${data.defaultCashLedgerCode} not found in accounts list.`,
        );
      }

      settings.defaultGoldLedgerId = goldLedgerId;
      settings.defaultCashLedgerId = cashLedgerId;

      for (const contraAccount of data.contraAccounts) {
        const acc = await accountRepo.findOne({ where: { code: contraAccount.code } });
        if (acc && acc.id) {
          if (contraAccount.subType === 'CASH') {
            settings.defaultContraCashLedgerId = acc.id;
          }
          if (contraAccount.subType === 'GOLD') {
            settings.defaultContraGoldLedgerId = acc.id;
          }
        }
      }

      await settingsRepo.save(settings);
      await queryRunner.commitTransaction();
      return { success: true };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      return { success: false, error: err.message };
    } finally {
      await queryRunner.release();
    }
  }

  async checkLicense(): Promise<boolean> {
    try {
      if (!AppDataSource.isInitialized) return false;
      const repo = AppDataSource.getRepository(CompanySetting);
      const settings = await repo.findOne({ where: { id: 'current' } });
      if (!settings) return false;
      if (settings.syslog === 'b457c00e-6f8e-4a6f-9988-825dd5db63bd' && settings.syslogex) {
        const expiryDate = new Date(settings.syslogex);
        if (new Date() < expiryDate) {
          return true; // License valid
        }
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async activateLicense(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (key.toUpperCase() === 'AL-8286-9888-1313-8276-1602-2026') {
        // Harcoded Key
        const repo = AppDataSource.getRepository(CompanySetting);
        let settings = await repo.findOne({ where: { id: 'current' } });
        if (!settings) {
          settings = new CompanySetting();
          settings.id = 'current';
        }
        settings.syslog = 'b457c00e-6f8e-4a6f-9988-825dd5db63bd';
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        settings.syslogex = expiry.toISOString();
        await repo.save(settings);
        return { success: true };
      }
      return { success: false, error: 'Invalid License Key' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getCompanyInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!AppDataSource.isInitialized) return { success: false, error: 'Database not ready' };
      const repo = AppDataSource.getRepository(CompanySetting);
      const settings = await repo.findOne({ where: { id: 'current' } });
      if (!settings) return { success: false, error: 'Settings not initialized' };

      const accountRepo = AppDataSource.getRepository(Account);
      const defaultGoldAccount = await accountRepo.findOne({
        where: { id: settings.defaultGoldLedgerId },
      });
      const defaultCashAccount = await accountRepo.findOne({
        where: { id: settings.defaultCashLedgerId },
      });

      return {
        success: true,
        data: {
          name: settings.name,
          financialYear: settings.financialYear,
          address: settings.address,
          gstNumber: settings.gstNumber,
          defaultGoldLedgerId: settings.defaultGoldLedgerId,
          defaultGoldLedgerName: defaultGoldAccount?.name || 'Unknown',
          defaultCashLedgerId: settings.defaultCashLedgerId,
          defaultCashLedgerName: defaultCashAccount?.name || 'Unknown',
        },
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getNextPartyCode(): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const repo = AppDataSource.getRepository(Party);
      const { Like } = require('typeorm');
      const lastParty = await repo.findOne({
        where: { code: Like('PTY-%') },
        order: { created_at: 'DESC' },
      });
      let nextNum = 1;
      if (lastParty && lastParty.code) {
        const parts = lastParty.code.split('-');
        if (parts.length >= 2) {
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
          }
        }
      }
      const code = `PTY-${String(nextNum).padStart(3, '0')}`;
      return { success: true, data: code };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getNextItemCode(): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const repo = AppDataSource.getRepository(Item);
      const { Like } = require('typeorm');
      const lastItem = await repo.findOne({
        where: { code: Like('ITM-%') },
        order: { created_at: 'DESC' },
      });
      let nextNum = 1;
      if (lastItem && lastItem.code) {
        const parts = lastItem.code.split('-');
        if (parts.length >= 2) {
          const lastNum = parseInt(parts[1], 10);
          if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
          }
        }
      }
      const code = `ITM-${String(nextNum).padStart(3, '0')}`;
      return { success: true, data: code };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getPartyBalances(
    partyId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!AppDataSource.isInitialized) return { success: false, error: 'Database not ready' };
      const partyRepo = AppDataSource.getRepository(Party);
      const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

      const party = await partyRepo.findOne({ where: { id: partyId } });
      if (!party) return { success: false, error: 'Party not found' };

      const obWeight = Number(party.opening_gold_balance) || 0;
      const obAmount = Number(party.opening_amount_balance) || 0;
      const accountId = party.ledger_account_id;

      if (!accountId) {
        return {
          success: true,
          data: {
            gold: {
              opening: obWeight,
              openingType: party.opening_gold_balance_type,
              credits: 0,
              debits: 0,
              net: obWeight,
            },
            cash: {
              opening: obAmount,
              openingType: party.opening_amount_balance_type,
              credits: 0,
              debits: 0,
              net: obAmount,
            },
          },
        };
      }

      const entries = await ledgerRepo
        .createQueryBuilder('le')
        .leftJoinAndSelect('le.journalEntry', 'je')
        .leftJoinAndSelect('je.voucher', 'voucher')
        .where('le.accountId = :accountId', { accountId })
        .getMany();

      // Gold Calculations
      const gramEntries = entries.filter((e) => {
        const hasGold = Number(e.debitGold) > 0 || Number(e.creditGold) > 0;
        const isOB = e.journalEntry?.voucher?.voucherNo?.startsWith('OB-');
        return hasGold && !isOB;
      });

      const goldCredits = gramEntries.reduce((sum, e) => sum + (Number(e.creditGold) || 0), 0);
      const goldDebits = gramEntries.reduce((sum, e) => sum + (Number(e.debitGold) || 0), 0);
      const goldBaseOpening =
        party.opening_gold_balance_type === BalanceType.CR ? obWeight : -obWeight;
      const goldNet = goldBaseOpening + goldCredits - goldDebits;

      // Cash/Amount Calculations
      const cashEntries = entries.filter((e) => {
        const hasAmount = Number(e.debitAmount) > 0 || Number(e.creditAmount) > 0;
        const isOB = e.journalEntry?.voucher?.voucherNo?.startsWith('OB-');
        return hasAmount && !isOB;
      });

      const cashCredits = cashEntries.reduce((sum, e) => sum + (Number(e.creditAmount) || 0), 0);
      const cashDebits = cashEntries.reduce((sum, e) => sum + (Number(e.debitAmount) || 0), 0);
      const cashBaseOpening =
        party.opening_amount_balance_type === BalanceType.CR ? obAmount : -obAmount;
      const cashNet = cashBaseOpening + cashCredits - cashDebits;

      return {
        success: true,
        data: {
          gold: {
            opening: obWeight,
            openingType: party.opening_gold_balance_type,
            credits: goldCredits,
            debits: goldDebits,
            net: goldNet,
          },
          cash: {
            opening: obAmount,
            openingType: party.opening_amount_balance_type,
            credits: cashCredits,
            debits: cashDebits,
            net: cashNet,
          },
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async getAccountBalances(
    accountId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!AppDataSource.isInitialized) return { success: false, error: 'Database not ready' };
      const partyRepo = AppDataSource.getRepository(Party);
      const ledgerRepo = AppDataSource.getRepository(LedgerEntry);

      const party = await partyRepo.findOne({ where: { ledger_account_id: accountId } });

      const obWeight = party ? Number(party.opening_gold_balance) || 0 : 0;
      const obAmount = party ? Number(party.opening_amount_balance) || 0 : 0;
      const goldBalanceType = party ? party.opening_gold_balance_type : BalanceType.DR;
      const cashBalanceType = party ? party.opening_amount_balance_type : BalanceType.DR;

      if (!accountId) {
        return {
          success: true,
          data: {
            gold: {
              opening: obWeight,
              openingType: goldBalanceType,
              credits: 0,
              debits: 0,
              net: obWeight,
            },
            cash: {
              opening: obAmount,
              openingType: cashBalanceType,
              credits: 0,
              debits: 0,
              net: obAmount,
            },
          },
        };
      }

      const entries = await ledgerRepo
        .createQueryBuilder('le')
        .leftJoinAndSelect('le.journalEntry', 'je')
        .leftJoinAndSelect('je.voucher', 'voucher')
        .where('le.accountId = :accountId', { accountId })
        .getMany();

      // Gold Calculations
      const gramEntries = entries.filter((e) => {
        const hasGold = Number(e.debitGold) > 0 || Number(e.creditGold) > 0;
        const isOB = e.journalEntry?.voucher?.voucherNo?.startsWith('OB-');
        return hasGold && !isOB;
      });

      const goldCredits = gramEntries.reduce((sum, e) => sum + (Number(e.creditGold) || 0), 0);
      const goldDebits = gramEntries.reduce((sum, e) => sum + (Number(e.debitGold) || 0), 0);
      const goldBaseOpening = goldBalanceType === BalanceType.CR ? obWeight : -obWeight;
      const goldNet = goldBaseOpening + goldCredits - goldDebits;

      // Cash/Amount Calculations
      const cashEntries = entries.filter((e) => {
        const hasAmount = Number(e.debitAmount) > 0 || Number(e.creditAmount) > 0;
        const isOB = e.journalEntry?.voucher?.voucherNo?.startsWith('OB-');
        return hasAmount && !isOB;
      });

      const cashCredits = cashEntries.reduce((sum, e) => sum + (Number(e.creditAmount) || 0), 0);
      const cashDebits = cashEntries.reduce((sum, e) => sum + (Number(e.debitAmount) || 0), 0);
      const cashBaseOpening = cashBalanceType === BalanceType.CR ? obAmount : -obAmount;
      const cashNet = cashBaseOpening + cashCredits - cashDebits;

      return {
        success: true,
        data: {
          gold: {
            opening: obWeight,
            openingType: goldBalanceType,
            credits: goldCredits,
            debits: goldDebits,
            net: goldNet,
          },
          cash: {
            opening: obAmount,
            openingType: cashBalanceType,
            credits: cashCredits,
            debits: cashDebits,
            net: cashNet,
          },
        },
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async getBatchDetails(
    batchNo: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!AppDataSource.isInitialized) return { success: false, error: 'Database not ready' };
      const repo = AppDataSource.getRepository(Batch);
      const batch = await repo.findOne({
        where: { batchNo },
        relations: ['item', 'party', 'transactions', 'transactions.party', 'assignedParty'],
      });
      if (!batch) return { success: false, error: 'Batch not found' };
      return { success: true, data: batch };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  async updateDefaultGoldLedger(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsRepo = AppDataSource.getRepository(CompanySetting);
      let settings = await settingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) {
        return { success: false, error: 'Company settings not found' };
      }
      settings.defaultGoldLedgerId = accountId;
      await settingsRepo.save(settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async updateDefaultCashLedger(accountId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const settingsRepo = AppDataSource.getRepository(CompanySetting);
      let settings = await settingsRepo.findOne({ where: { id: 'current' } });
      if (!settings) {
        return { success: false, error: 'Company settings not found' };
      }
      settings.defaultCashLedgerId = accountId;
      await settingsRepo.save(settings);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
