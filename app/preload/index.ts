import { GetPartiesDTO } from '@main/application/dto/GetPartiesDTO';
import { contextBridge, ipcRenderer } from 'electron';

/**
 * Strongly-typed Electron API bridge.
 * All IPC channels exposed here — add new ones as they are registered in handlers.ts.
 */
export type ElectronAPI = {
  // Commands
  receiveRawMaterial: (dto: unknown) => Promise<IPCResult<void>>;
  issueRawMaterial: (dto: unknown) => Promise<IPCResult<{ transactionId: string }>>;
  updateIssueRawMaterial: (id: string, dto: unknown) => Promise<IPCResult<void>>;
  reverseMaterialIssue: (id: string) => Promise<IPCResult<void>>;
  issueGoldEquity: (
    dto: unknown,
  ) => Promise<IPCResult<{ journalEntryId: string; voucherNo: string }>>;
  receiveFinishedProduct: (dto: unknown) => Promise<IPCResult<{ finishedProductId: string }>>;
  createJournalEntry: (
    dto: unknown,
  ) => Promise<IPCResult<{ journalEntryId: string; voucherNo: string }>>;
  updateJournalEntry: (id: string, dto: unknown) => Promise<IPCResult<{ voucherNo: string }>>;
  deleteJournalEntry: (id: string) => Promise<IPCResult<void>>;
  createFinishedProduct: (dto: any) => Promise<IPCResult<{ finishedProductId: string }>>;
  updateFinishedProduct: (dto: any) => Promise<IPCResult<void>>;
  deleteFinishedProduct: (id: string) => Promise<IPCResult<void>>;
  deleteBatch: (id: string) => Promise<IPCResult<void>>;
  deleteReceivedFinishedProduct: (id: string) => Promise<IPCResult<void>>;
  createParty: (dto: unknown) => Promise<IPCResult<{ partyId: string }>>;
  getNextPartyCode: () => Promise<IPCResult<string>>;
  createItem: (dto: unknown) => Promise<IPCResult<{ itemId: string }>>;
  updateItem: (dto: unknown) => Promise<IPCResult<void>>;
  getNextItemCode: () => Promise<IPCResult<string>>;
  updateParty: (dto: unknown) => Promise<IPCResult<void>>;
  deleteParty: (partyId: string) => Promise<IPCResult<void>>;
  getCompanyInfo: () => Promise<IPCResult<{ name: string; financialYear: string } | null>>;
  // Queries
  listParties: (filters: GetPartiesDTO) => Promise<IPCResult<unknown[]>>;
  listItems: () => Promise<IPCResult<unknown[]>>;
  listAccounts: () => Promise<IPCResult<unknown[]>>;
  listJournalEntries: () => Promise<IPCResult<unknown[]>>;
  getPaginatedJournals: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getJournalDetails: (id: string) => Promise<IPCResult<any>>;
  exportJournals: (filters?: any) => Promise<IPCResult<any[]>>;
  getNextVoucherNo: () => Promise<IPCResult<string>>;
  getPartyBalances: (partyId: string) => Promise<IPCResult<{ gold: any; cash: any }>>;
  getAccountBalances: (accountId: string) => Promise<IPCResult<{ gold: any; cash: any }>>;
  getBatchDetails: (batchNo: string) => Promise<IPCResult<any>>;
  getPartyByAccountId: (accountId: string) => Promise<IPCResult<any>>;
  getOpenOrdersByAccountId: (accountId: string, partyType: string) => Promise<IPCResult<any[]>>;
  getOrderTransactions: (
    orderVoucherId: string,
    accountId: string,
    isCustomerOrder: boolean,
  ) => Promise<IPCResult<any[]>>;
  listBatches: (filters?: {
    assignedTo?: string;
    status?: string;
  }) => Promise<IPCResult<unknown[]>>;
  listFinishedProducts: (
    filter: any,
  ) => Promise<IPCResult<{ items: any[]; total: number; totals?: any }>>;
  sellFinishedProduct: (dto: { productId: string; partyId: string }) => Promise<IPCResult<void>>;
  sellStock: (dto: any) => Promise<IPCResult<any>>;
  updateReceivedFinishedProduct: (dto: any) => Promise<IPCResult<void>>;
  getPartyLedgerReport: (filters: {
    partyIds?: string[];
    startDate?: string;
    endDate?: string;
  }) => Promise<IPCResult<any[]>>;
  getAccountLedgerReport: (filters: {
    accountIds?: string[];
    startDate?: string;
    endDate?: string;
  }) => Promise<IPCResult<any[]>>;
  getPaginatedBatches: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getBatchSummary: () => Promise<IPCResult<{ status: string; count: number }[]>>;
  getKarigarConsumablesReport: (
    page: number,
    limit: number,
    filters: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getKarigarConsumablesSummary: (filters: any) => Promise<IPCResult<any>>;
  getCustomerPurchaseLedgerReport: (filters: {
    partyIds?: string[];
    itemIds?: string[];
    startDate?: string;
    endDate?: string;
  }) => Promise<IPCResult<any[]>>;
  getAccountStatement: (filters: {
    accountId: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<IPCResult<any[]>>;
  getLenaDenaReport: (filters: {
    groupId: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<IPCResult<any[]>>;
  createSaleVoucher: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listSaleVouchers: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextSaleVoucherNo: () => Promise<IPCResult<string>>;
  getSaleVoucherDetails: (voucherId: string) => Promise<IPCResult<any>>;
  deleteSaleVoucher: (voucherId: string) => Promise<IPCResult<void>>;
  updateSaleVoucher: (voucherId: string, dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  createCashVoucher: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listCashVouchers: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextCashVoucherNo: (type: string) => Promise<IPCResult<string>>;
  getCashVoucherDetails: (voucherId: string) => Promise<IPCResult<any>>;
  cancelCashVoucher: (voucherId: string) => Promise<IPCResult<void>>;
  updateCashVoucher: (voucherId: string, dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  deleteCashVoucher: (voucherId: string) => Promise<IPCResult<void>>;
  importBankStatement: (dto: {
    bankLedgerAccountId: string;
    filePath: string;
    fileBuffer: ArrayBuffer;
    fileName: string;
    uploadedBy: string;
  }) => Promise<IPCResult<{ importId: string }>>;
  getStagedRows: (importId: string) => Promise<IPCResult<any[]>>;
  updateStagedRow: (dto: any) => Promise<IPCResult<void>>;
  finalizeBankImport: (
    importId: string,
  ) => Promise<IPCResult<{ createdCount: number; failedCount: number }>>;
  createRateCut: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  createGoldVoucher: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listGoldVouchers: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextGoldVoucherNo: () => Promise<IPCResult<string>>;
  getGoldVoucherDetails: (voucherId: string) => Promise<IPCResult<any>>;
  updateGoldVoucher: (voucherId: string, dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  deleteGoldVoucher: (voucherId: string) => Promise<IPCResult<void>>;
  createSaleReturnVoucher: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listSaleReturnVouchers: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextSaleReturnVoucherNo: () => Promise<IPCResult<string>>;
  getSaleReturnVoucherDetails: (voucherId: string) => Promise<IPCResult<any>>;
  deleteSaleReturnVoucher: (voucherId: string) => Promise<IPCResult<void>>;
  updateSaleReturnVoucher: (
    voucherId: string,
    dto: any,
  ) => Promise<IPCResult<{ voucherNo: string }>>;
  createCustomerOrder: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listCustomerOrders: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getCustomerOrderDetails: (voucherId: string) => Promise<IPCResult<any>>;
  cancelCustomerOrder: (voucherId: string) => Promise<IPCResult<any>>;
  deleteCustomerOrder: (voucherId: string) => Promise<IPCResult<void>>;
  updateCustomerOrder: (voucherId: string, dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  createSupplierOrder: (dto: any) => Promise<IPCResult<{ voucherNo: string }>>;
  listSupplierOrders: (
    page: number,
    limit: number,
    filters?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  getSupplierOrderDetails: (voucherId: string) => Promise<IPCResult<any>>;
  cancelSupplierOrder: (voucherId: string) => Promise<IPCResult<void>>;
  deleteSupplierOrder: (voucherId: string) => Promise<IPCResult<void>>;
  updateSupplierOrder: (voucherId: string, dto: any) => Promise<IPCResult<{ voucherNo: string }>>;

  // Setup
  isInitialized: () => Promise<boolean>;
  checkLicense: () => Promise<boolean>;
  activateLicense: (key: string) => Promise<IPCResult<void>>;
  initializeCompany: (data: {
    companyName: string;
    financialYear: string;
    accounts: any[];
    contraAccounts: any[];
    defaultGoldLedgerCode: string;
    defaultCashLedgerCode: string;
  }) => Promise<IPCResult<void>>;
  updateDefaultGoldLedger: (accountId: string) => Promise<IPCResult<void>>;
  updateDefaultCashLedger: (accountId: string) => Promise<IPCResult<void>>;
  getPaginatedAccounts: (
    page: number,
    limit: number,
    options?: any,
  ) => Promise<IPCResult<{ items: any[]; total: number }>>;
  createAccount: (dto: any) => Promise<IPCResult<any>>;
  updateAccount: (id: string, dto: any) => Promise<IPCResult<any>>;
  getAccountTypes: () => Promise<IPCResult<string[]>>;
  getAccountSubtypes: () => Promise<IPCResult<string[]>>;
  updateAccountFreezeDate: (id: string, freezeDate: string | null) => Promise<IPCResult<any>>;
  getAccountDetails: (id: string) => Promise<IPCResult<any>>;
};

export type IPCResult<T> = { success: true; data?: T } | { success: false; error: string };

const api: ElectronAPI = {
  receiveRawMaterial: (dto) => ipcRenderer.invoke('inventory:receive-raw-material', dto),
  issueRawMaterial: (dto) => ipcRenderer.invoke('inventory:issue-raw-material', dto),
  updateIssueRawMaterial: (id, dto) =>
    ipcRenderer.invoke('inventory:update-issue-raw-material', id, dto),
  reverseMaterialIssue: (id) => ipcRenderer.invoke('inventory:reverse-material-issue', id),
  issueGoldEquity: (dto) => ipcRenderer.invoke('inventory:issue-gold-equity', dto),
  receiveFinishedProduct: (dto) =>
    ipcRenderer.invoke('manufacturing:receive-finished-product', dto),
  createJournalEntry: (dto) => ipcRenderer.invoke('accounting:create-journal-entry', dto),
  updateJournalEntry: (id, dto) => ipcRenderer.invoke('accounting:update-journal-entry', id, dto),
  deleteJournalEntry: (id) => ipcRenderer.invoke('accounting:delete-journal-entry', id),
  createFinishedProduct: (dto) => ipcRenderer.invoke('inventory:create-finished-product', dto),
  updateFinishedProduct: (dto) => ipcRenderer.invoke('inventory:update-finished-product', dto),
  deleteFinishedProduct: (id) => ipcRenderer.invoke('inventory:delete-finished-product', id),
  deleteBatch: (id) => ipcRenderer.invoke('inventory:delete-batch', id),
  deleteReceivedFinishedProduct: (id) =>
    ipcRenderer.invoke('manufacturing:delete-received-finished-product', id),
  createParty: (dto) => ipcRenderer.invoke('party:create', dto),
  getNextPartyCode: () => ipcRenderer.invoke('party:get-next-code'),
  createItem: (dto) => ipcRenderer.invoke('item:create', dto),
  updateItem: (dto) => ipcRenderer.invoke('item:update', dto),
  getNextItemCode: () => ipcRenderer.invoke('item:get-next-code'),
  updateParty: (dto) => ipcRenderer.invoke('party:update', dto),
  deleteParty: (partyId) => ipcRenderer.invoke('party:delete', partyId),
  getCompanyInfo: () => ipcRenderer.invoke('setup:get-company-info'),
  listParties: (filters: GetPartiesDTO) => ipcRenderer.invoke('query:list-parties', filters),
  listItems: () => ipcRenderer.invoke('query:list-items'),
  listAccounts: () => ipcRenderer.invoke('query:list-accounts'),
  getPartyBalances: (partyId) => ipcRenderer.invoke('query:get-party-balances', partyId),
  getAccountBalances: (accountId) => ipcRenderer.invoke('query:get-account-balances', accountId),
  getBatchDetails: (batchNo) => ipcRenderer.invoke('query:get-batch-details', batchNo),
  getPartyByAccountId: (accountId) =>
    ipcRenderer.invoke('query:get-party-by-account-id', accountId),
  getOpenOrdersByAccountId: (accountId, partyType) =>
    ipcRenderer.invoke('query:get-open-orders-by-account-id', accountId, partyType),
  getOrderTransactions: (orderVoucherId, accountId, isCustomerOrder) =>
    ipcRenderer.invoke('query:get-order-transactions', orderVoucherId, accountId, isCustomerOrder),
  listJournalEntries: () => ipcRenderer.invoke('query:list-journal-entries'),
  getPaginatedJournals: (page, limit, filters) =>
    ipcRenderer.invoke('query:get-paginated-journals', page, limit, filters),
  getJournalDetails: (id) => ipcRenderer.invoke('query:get-journal-details', id),
  exportJournals: (filters) => ipcRenderer.invoke('query:export-journals', filters),
  getNextVoucherNo: () => ipcRenderer.invoke('query:get-next-voucher-no'),
  listBatches: (filters) => ipcRenderer.invoke('query:list-batches', filters),
  listFinishedProducts: (filter) => ipcRenderer.invoke('query:list-finished-products', filter),
  sellFinishedProduct: (dto) => ipcRenderer.invoke('inventory:sell-finished-product', dto),
  sellStock: (dto) => ipcRenderer.invoke('inventory:sell-stock', dto),
  updateReceivedFinishedProduct: (dto) =>
    ipcRenderer.invoke('manufacturing:update-received-finished-product', dto),
  getPartyLedgerReport: (filters) => ipcRenderer.invoke('query:get-party-ledger-report', filters),
  getAccountLedgerReport: (filters) =>
    ipcRenderer.invoke('query:get-account-ledger-report', filters),
  getPaginatedBatches: (page, limit, filters) =>
    ipcRenderer.invoke('query:get-paginated-batches', page, limit, filters),
  getBatchSummary: () => ipcRenderer.invoke('query:get-batch-summary'),
  getKarigarConsumablesReport: (page, limit, filters) =>
    ipcRenderer.invoke('query:get-karigar-consumables-report', page, limit, filters),
  getKarigarConsumablesSummary: (filters) =>
    ipcRenderer.invoke('query:get-karigar-consumables-summary', filters),
  getCustomerPurchaseLedgerReport: (filters) =>
    ipcRenderer.invoke('query:get-customer-purchase-ledger-report', filters),
  getAccountStatement: (filters) => ipcRenderer.invoke('query:get-account-statement', filters),
  getLenaDenaReport: (filters) => ipcRenderer.invoke('query:get-lena-dena-report', filters),
  createSaleVoucher: (dto) => ipcRenderer.invoke('sale-voucher:create', dto),
  listSaleVouchers: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-sale-vouchers', page, limit, filters),
  getNextSaleVoucherNo: () => ipcRenderer.invoke('query:get-next-sale-voucher-no'),
  getSaleVoucherDetails: (voucherId) => ipcRenderer.invoke('sale-voucher:get-details', voucherId),
  deleteSaleVoucher: (voucherId) => ipcRenderer.invoke('sale-voucher:delete', voucherId),
  updateSaleVoucher: (voucherId, dto) => ipcRenderer.invoke('sale-voucher:update', voucherId, dto),
  createCashVoucher: (dto) => ipcRenderer.invoke('cash-voucher:create', dto),
  listCashVouchers: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-cash-vouchers', page, limit, filters),
  getNextCashVoucherNo: (type) => ipcRenderer.invoke('query:get-next-cash-voucher-no', type),
  getCashVoucherDetails: (voucherId) => ipcRenderer.invoke('cash-voucher:get-details', voucherId),
  cancelCashVoucher: (voucherId) => ipcRenderer.invoke('cash-voucher:cancel', voucherId),
  updateCashVoucher: (voucherId, dto) => ipcRenderer.invoke('cash-voucher:update', voucherId, dto),
  deleteCashVoucher: (voucherId) => ipcRenderer.invoke('cash-voucher:delete', voucherId),
  importBankStatement: (dto) => ipcRenderer.invoke('accounting:import-bank-statement', dto),
  getStagedRows: (importId) => ipcRenderer.invoke('accounting:get-staged-rows', importId),
  updateStagedRow: (dto) => ipcRenderer.invoke('accounting:update-staged-row', dto),
  finalizeBankImport: (importId) => ipcRenderer.invoke('accounting:finalize-import', importId),
  createRateCut: (dto) => ipcRenderer.invoke('rate-cut:create', dto),
  createGoldVoucher: (dto) => ipcRenderer.invoke('gold-voucher:create', dto),
  listGoldVouchers: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-gold-vouchers', page, limit, filters),
  getNextGoldVoucherNo: () => ipcRenderer.invoke('query:get-next-gold-voucher-no'),
  getGoldVoucherDetails: (voucherId) => ipcRenderer.invoke('gold-voucher:get-details', voucherId),
  updateGoldVoucher: (voucherId, dto) => ipcRenderer.invoke('gold-voucher:update', voucherId, dto),
  deleteGoldVoucher: (voucherId) => ipcRenderer.invoke('gold-voucher:delete', voucherId),
  createSaleReturnVoucher: (dto) => ipcRenderer.invoke('sale-return-voucher:create', dto),
  listSaleReturnVouchers: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-sale-return-vouchers', page, limit, filters),
  getNextSaleReturnVoucherNo: () => ipcRenderer.invoke('query:get-next-sale-return-voucher-no'),
  getSaleReturnVoucherDetails: (voucherId) =>
    ipcRenderer.invoke('sale-return-voucher:get-details', voucherId),
  deleteSaleReturnVoucher: (voucherId) =>
    ipcRenderer.invoke('sale-return-voucher:delete', voucherId),
  updateSaleReturnVoucher: (voucherId, dto) =>
    ipcRenderer.invoke('sale-return-voucher:update', voucherId, dto),
  createCustomerOrder: (dto) => ipcRenderer.invoke('customer-order:create', dto),
  listCustomerOrders: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-customer-orders', page, limit, filters),
  getCustomerOrderDetails: (voucherId) =>
    ipcRenderer.invoke('customer-order:get-details', voucherId),
  cancelCustomerOrder: (voucherId) => ipcRenderer.invoke('customer-order:cancel', voucherId),
  deleteCustomerOrder: (voucherId) => ipcRenderer.invoke('customer-order:delete', voucherId),
  updateCustomerOrder: (voucherId, dto) =>
    ipcRenderer.invoke('customer-order:update', voucherId, dto),
  createSupplierOrder: (dto) => ipcRenderer.invoke('supplier-order:create', dto),
  listSupplierOrders: (page, limit, filters) =>
    ipcRenderer.invoke('query:list-supplier-orders', page, limit, filters),
  getSupplierOrderDetails: (voucherId) =>
    ipcRenderer.invoke('supplier-order:get-details', voucherId),
  cancelSupplierOrder: (voucherId) => ipcRenderer.invoke('supplier-order:cancel', voucherId),
  deleteSupplierOrder: (voucherId) => ipcRenderer.invoke('supplier-order:delete', voucherId),
  updateSupplierOrder: (voucherId, dto) =>
    ipcRenderer.invoke('supplier-order:update', voucherId, dto),

  isInitialized: () => ipcRenderer.invoke('setup:is-initialized'),
  checkLicense: () => ipcRenderer.invoke('setup:check-license'),
  activateLicense: (key) => ipcRenderer.invoke('setup:activate-license', key),
  initializeCompany: (data) => ipcRenderer.invoke('setup:initialize-company', data),
  updateDefaultGoldLedger: (accountId) =>
    ipcRenderer.invoke('setup:update-default-gold-ledger', accountId),
  updateDefaultCashLedger: (accountId) =>
    ipcRenderer.invoke('setup:update-default-cash-ledger', accountId),
  getPaginatedAccounts: (page, limit, options) =>
    ipcRenderer.invoke('account:get-paginated', page, limit, options),
  createAccount: (dto) => ipcRenderer.invoke('account:create', dto),
  updateAccount: (id, dto) => ipcRenderer.invoke('account:update', id, dto),
  getAccountTypes: () => ipcRenderer.invoke('account:get-types'),
  getAccountSubtypes: () => ipcRenderer.invoke('account:get-subtypes'),
  updateAccountFreezeDate: (id, freezeDate) =>
    ipcRenderer.invoke('account:update-freeze-date', id, freezeDate),
  getAccountDetails: (id) => ipcRenderer.invoke('account:get-details', id),
};

contextBridge.exposeInMainWorld('electronAPI', api);
