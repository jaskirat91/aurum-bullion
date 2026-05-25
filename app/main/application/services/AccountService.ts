import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../infrastructure/database/data-source';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import {
  Account,
  AccountType,
  AccountSubtype,
  NormalBalance,
  AccountUnit,
} from '../../domain/entities/Account';
import { JournalEntry, JournalEntryStatus } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { Voucher, VoucherStatus, VoucherType } from '../../domain/entities/Voucher';

export interface CreateAccountDTO {
  name: string;
  code: string;
  parent_id?: string;
  account_type?: AccountType;
  account_subtype?: AccountSubtype;
  is_group: boolean;
  normal_balance?: NormalBalance;
  unit: AccountUnit;
  allow_direct_posting: boolean;
  is_system?: boolean;
  is_active?: boolean;
  // Opening Balance Fields
  openingGoldBalance?: number;
  openingGoldBalanceType?: 'DR' | 'CR';
  openingAmountBalance?: number;
  openingAmountBalanceType?: 'DR' | 'CR';
  offsetAccountId?: string;
}

export class AccountService {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async getAccounts(
    page: number,
    limit: number,
    options?: {
      search?: string;
      is_group?: boolean;
      is_active?: boolean;
    },
  ) {
    return this.accountRepository.findPaginated(page, limit, options);
  }

  async getAllAccounts(activeOnly = true) {
    return this.accountRepository.findAll(activeOnly);
  }

  async createAccount(data: CreateAccountDTO) {
    return AppDataSource.transaction(async (em: EntityManager) => {
      const account = new Account();
      account.name = data.name;
      account.code = data.code;
      account.parent_id = data.parent_id || undefined;
      account.is_group = data.is_group;
      account.is_active = data.is_active ?? true;

      if (!data.is_group) {
        if (!data.account_type || !data.normal_balance) {
          throw new Error('Ledger accounts must have account type and normal balance.');
        }
        account.account_type = data.account_type;
        account.account_subtype = data.account_subtype;
        account.normal_balance = data.normal_balance;
        account.unit = data.unit;
        account.allow_direct_posting = data.allow_direct_posting;
        account.is_system = data.is_system ?? false;
      } else {
        account.account_type = AccountType.ASSET;
        account.normal_balance = NormalBalance.DR;
        account.unit = AccountUnit.INR;
        account.allow_direct_posting = false;
        account.is_system = false;
      }

      const savedAccount = await em.save(account);

      // Handle Opening Balance
      const hasGoldOB = (data.openingGoldBalance || 0) > 0;
      const hasAmountOB = (data.openingAmountBalance || 0) > 0;

      if ((hasGoldOB || hasAmountOB) && data.offsetAccountId) {
        const voucher = new Voucher();
        voucher.type = VoucherType.JOURNAL;
        voucher.entryDate = new Date().toISOString().split('T')[0];
        voucher.voucherNo = `OB-ACC-${data.code}`;
        voucher.narration = `Opening balance for Account: ${data.name}`;
        voucher.status = VoucherStatus.POSTED;
        const savedVoucher = await em.save(voucher);

        const journalEntry = new JournalEntry();
        journalEntry.entryDate = new Date().toISOString().split('T')[0];
        journalEntry.voucherId = savedVoucher.id;
        journalEntry.narration = `Opening balance for Account: ${data.name}`;
        journalEntry.status = JournalEntryStatus.POSTED;

        const savedJE = await em.save(journalEntry);

        // Account Side
        const accountLedgerLine = new LedgerEntry();
        accountLedgerLine.journalEntryId = savedJE.id;
        accountLedgerLine.accountId = savedAccount.id;
        accountLedgerLine.debitGold =
          data.openingGoldBalanceType === 'DR' ? data.openingGoldBalance || 0 : 0;
        accountLedgerLine.creditGold =
          data.openingGoldBalanceType === 'CR' ? data.openingGoldBalance || 0 : 0;
        accountLedgerLine.debitAmount =
          data.openingAmountBalanceType === 'DR' ? data.openingAmountBalance || 0 : 0;
        accountLedgerLine.creditAmount =
          data.openingAmountBalanceType === 'CR' ? data.openingAmountBalance || 0 : 0;
        accountLedgerLine.narration = 'Opening balance seeding';
        await em.save(accountLedgerLine);

        // Offset Side (Contra)
        const offsetLedgerLine = new LedgerEntry();
        offsetLedgerLine.journalEntryId = savedJE.id;
        offsetLedgerLine.accountId = data.offsetAccountId;
        offsetLedgerLine.debitGold =
          data.openingGoldBalanceType === 'CR' ? data.openingGoldBalance || 0 : 0;
        offsetLedgerLine.creditGold =
          data.openingGoldBalanceType === 'DR' ? data.openingGoldBalance || 0 : 0;
        offsetLedgerLine.debitAmount =
          data.openingAmountBalanceType === 'CR' ? data.openingAmountBalance || 0 : 0;
        offsetLedgerLine.creditAmount =
          data.openingAmountBalanceType === 'DR' ? data.openingAmountBalance || 0 : 0;
        offsetLedgerLine.narration = 'Opening balance contra offset';
        await em.save(offsetLedgerLine);
      }

      return savedAccount;
    });
  }

  async updateAccount(id: string, data: Partial<CreateAccountDTO>) {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new Error('Account not found');

    if (data.name !== undefined) account.name = data.name;
    if (data.code !== undefined) account.code = data.code;
    if (data.parent_id !== undefined) {
      // Must use `null` to explicitly instruct TypeORM to clear an existing column value
      account.parent_id = (data.parent_id || null) as any;

      // By completely deleting the loaded relation object from memory,
      // we guarantee TypeORM will fallback to looking at our updated `parent_id`
      // instead of checking against the loaded parent object.
      delete account.parent;
    }
    if (data.is_active !== undefined) account.is_active = data.is_active;

    if (!account.is_group) {
      if (data.account_type !== undefined) account.account_type = data.account_type;
      if (data.account_subtype !== undefined) account.account_subtype = data.account_subtype;
      if (data.normal_balance !== undefined) account.normal_balance = data.normal_balance;
      if (data.unit !== undefined) account.unit = data.unit;
      if (data.allow_direct_posting !== undefined)
        account.allow_direct_posting = data.allow_direct_posting;
    }

    return this.accountRepository.save(account);
  }

  async updateFreezeDate(id: string, freezeDate: string | null) {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new Error('Account not found');
    account.account_freeze_date = freezeDate || undefined;
    return this.accountRepository.save(account);
  }

  async getAccountTypes() {
    return Object.values(AccountType);
  }

  async getAccountSubtypes() {
    return Object.values(AccountSubtype);
  }

  async getAccountById(id: string) {
    return this.accountRepository.findById(id);
  }
}
