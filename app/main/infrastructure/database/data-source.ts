import { DataSource } from 'typeorm';
import { join } from 'path';
import { app } from 'electron';

// Domain Entities
import { Batch } from '../../domain/entities/Batch';
import { MaterialTransaction } from '../../domain/entities/MaterialTransaction';
import { Account } from '../../domain/entities/Account';
import { Group } from '../../domain/entities/Group';
import { Party } from '../../domain/entities/Party';
import { Item } from '../../domain/entities/Item';
import { FinishedProduct } from '../../domain/entities/FinishedProduct';
import { JournalEntry } from '../../domain/entities/JournalEntry';
import { LedgerEntry } from '../../domain/entities/LedgerEntry';
import { CompanySetting } from '../../domain/entities/CompanySetting';
import { Voucher } from '../../domain/entities/Voucher';
import { SaleVoucher } from '../../domain/entities/SaleVoucher';
import { SaleVoucherItem } from '../../domain/entities/SaleVoucherItem';
import { CashVoucher } from '../../domain/entities/CashVoucher';
import { GoldVoucher } from '../../domain/entities/GoldVoucher';
import { SaleReturnVoucher } from '../../domain/entities/SaleReturnVoucher';
import { SaleReturnVoucherItem } from '../../domain/entities/SaleReturnVoucherItem';
import { CustomerOrderVoucher } from '../../domain/entities/CustomerOrderVoucher';
import { SupplierOrderVoucher } from '../../domain/entities/SupplierOrderVoucher';
import { BankStatementImport } from '../../domain/entities/BankStatementImport';
import { BankStatementRow } from '../../domain/entities/BankStatementRow';
import { PartyAlias } from '../../domain/entities/PartyAlias';

import { AddVoucherModules1715086800000 } from './migrations/1715086800000-AddVoucherModules';
import { AddSaleReturnAndDebitAccount1715610000000 } from './migrations/1715610000000-AddSaleReturnAndDebitAccount';
import { AddOldItemSupportToSaleReturnItems1747237200000 } from './migrations/1747237200000-AddOldItemSupportToSaleReturnItems';
import { AddCustomerOrderVouchers1747842000000 } from './migrations/1747842000000-AddCustomerOrderVouchers';
import { AddSupplierOrderVouchers1747854000000 } from './migrations/1747854000000-AddSupplierOrderVouchers';
import { AddCashVouchers1747900000000 } from './migrations/1747900000000-AddCashVouchers';
import { AddOrderStatusToOrderVouchers1748000000000 } from './migrations/1748000000000-AddOrderStatusToOrderVouchers';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: join(app.getPath('userData'), 'aurum_bullion.sqlite'),
  /**
   * SQLCipher readiness:
   * When switching to better-sqlite3-with-cipher / typeorm-sqlcipher:
   *   type: 'better-sqlite3',
   *   database: join(app.getPath('userData'), 'aurum_ledger.db'),
   *   prepareDatabase: (db) => { db.pragma(`key='${encryptionKey}'`); }
   */
  synchronize: !app.isPackaged, // Dev only — use migrations in production
  logging: ['error'],
  entities: [
    Batch,
    MaterialTransaction,
    Account,
    Group,
    Party,
    Item,
    FinishedProduct,
    JournalEntry,
    LedgerEntry,
    CompanySetting,
    Voucher,
    SaleVoucher,
    SaleVoucherItem,
    CashVoucher,
    GoldVoucher,
    SaleReturnVoucher,
    SaleReturnVoucherItem,
    CustomerOrderVoucher,
    SupplierOrderVoucher,
    BankStatementImport,
    BankStatementRow,
    PartyAlias,
  ],
  subscribers: [],
  migrations: [
    AddVoucherModules1715086800000,
    AddSaleReturnAndDebitAccount1715610000000,
    AddOldItemSupportToSaleReturnItems1747237200000,
    AddCustomerOrderVouchers1747842000000,
    AddSupplierOrderVouchers1747854000000,
    AddCashVouchers1747900000000,
    AddOrderStatusToOrderVouchers1748000000000,
  ],
});
