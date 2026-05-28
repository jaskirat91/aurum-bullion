/// <reference types="vite/client" />

/**
 * Global type declarations for the Electron IPC bridge.
 * Available as window.electronAPI in the renderer.
 */

export type IPCResult<T = any> = { success: true; data?: T } | { success: false; error: string };

export interface ElectronAPI {
  // Commands
  receiveRawMaterial(dto: unknown): Promise<IPCResult<void>>;
  issueRawMaterial(dto: unknown): Promise<IPCResult<{ transactionId: string }>>;
  updateIssueRawMaterial(id: string, dto: unknown): Promise<IPCResult<void>>;
  reverseMaterialIssue(id: string): Promise<IPCResult<void>>;
  issueGoldEquity(dto: unknown): Promise<IPCResult<{ journalEntryId: string; voucherNo: string }>>;
  receiveFinishedProduct(dto: unknown): Promise<IPCResult<{ finishedProductId: string }>>;
  createJournalEntry(
    dto: unknown,
  ): Promise<IPCResult<{ journalEntryId: string; voucherNo: string }>>;
  updateJournalEntry(id: string, dto: unknown): Promise<IPCResult<{ voucherNo: string }>>;
  deleteJournalEntry(id: string): Promise<IPCResult<void>>;
  createFinishedProduct(dto: any): Promise<IPCResult<{ finishedProductId: string }>>;
  updateFinishedProduct(dto: any): Promise<IPCResult<void>>;
  deleteFinishedProduct(id: string): Promise<IPCResult<void>>;
  deleteBatch(id: string): Promise<IPCResult<void>>;
  deleteReceivedFinishedProduct(id: string): Promise<IPCResult<void>>;
  createParty(dto: unknown): Promise<IPCResult<{ partyId: string }>>;
  getNextPartyCode(): Promise<IPCResult<string>>;
  createItem(dto: unknown): Promise<IPCResult<{ itemId: string }>>;
  updateItem(dto: unknown): Promise<IPCResult<void>>;
  getNextItemCode(): Promise<IPCResult<string>>;
  updateParty(dto: unknown): Promise<IPCResult<void>>;
  deleteParty(partyId: string): Promise<IPCResult<void>>;
  getCompanyInfo(): Promise<IPCResult<any>>;

  // Queries
  listParties(filters: any): Promise<IPCResult<unknown[]>>;
  listItems(): Promise<IPCResult<unknown[]>>;
  listAccounts(): Promise<IPCResult<unknown[]>>;
  listJournalEntries(): Promise<IPCResult<unknown[]>>;
  getPaginatedJournals(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getJournalDetails(id: string): Promise<IPCResult<any>>;
  exportJournals(filters?: any): Promise<IPCResult<any[]>>;
  getNextVoucherNo(): Promise<IPCResult<string>>;
  getPartyBalances(partyId: string): Promise<IPCResult<{ gold: any; cash: any }>>;
  getAccountBalances(accountId: string): Promise<IPCResult<{ gold: any; cash: any }>>;
  getBatchDetails(batchNo: string): Promise<IPCResult<any>>;
  listBatches(filters?: { assignedTo?: string; status?: string }): Promise<IPCResult<unknown[]>>;
  listFinishedProducts(filter?: {
    itemId?: string;
    batchNo?: string;
    grossWeight?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    partyId?: string;
  }): Promise<IPCResult<{ items: any[]; total: number; totals?: any }>>;
  sellFinishedProduct(dto: { productId: string; partyId: string }): Promise<IPCResult<void>>;
  sellStock(dto: any): Promise<IPCResult<void>>;
  updateReceivedFinishedProduct(dto: unknown): Promise<IPCResult<void>>;
  getPartyLedgerReport(filters: {
    partyIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<IPCResult<any[]>>;
  getAccountLedgerReport(filters: {
    accountIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<IPCResult<any[]>>;
  getPaginatedBatches(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getBatchSummary(): Promise<IPCResult<{ status: string; count: number }[]>>;
  getKarigarConsumablesReport(
    page: number,
    limit: number,
    filters: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getKarigarConsumablesSummary(filters: any): Promise<IPCResult<any>>;
  getCustomerPurchaseLedgerReport(filters: {
    partyIds?: string[];
    itemIds?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<IPCResult<any[]>>;
  getAccountStatement(filters: {
    accountId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<IPCResult<any[]>>;
  getLenaDenaReport(filters: {
    groupId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<IPCResult<any[]>>;
  createSaleVoucher(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listSaleVouchers(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextSaleVoucherNo(): Promise<IPCResult<string>>;
  getSaleVoucherDetails(voucherId: string): Promise<IPCResult<any>>;
  deleteSaleVoucher(voucherId: string): Promise<IPCResult<void>>;
  updateSaleVoucher(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  createCashVoucher(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listCashVouchers(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextCashVoucherNo(type: string): Promise<IPCResult<string>>;
  getCashVoucherDetails(voucherId: string): Promise<IPCResult<any>>;
  cancelCashVoucher(voucherId: string): Promise<IPCResult<void>>;
  updateCashVoucher(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  deleteCashVoucher(voucherId: string): Promise<IPCResult<void>>;

  // Bank Statement
  importBankStatement(dto: {
    bankLedgerAccountId: string;
    filePath: string;
    fileBuffer: ArrayBuffer;
    fileName: string;
    uploadedBy: string;
  }): Promise<IPCResult<{ importId: string }>>;
  getStagedRows(importId: string): Promise<IPCResult<any[]>>;
  updateStagedRow(dto: any): Promise<IPCResult<void>>;
  finalizeBankImport(
    importId: string,
  ): Promise<IPCResult<{ createdCount: number; failedCount: number }>>;

  createRateCut(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  createGoldVoucher(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listGoldVouchers(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextGoldVoucherNo(): Promise<IPCResult<string>>;
  getGoldVoucherDetails(voucherId: string): Promise<IPCResult<any>>;
  updateGoldVoucher(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  deleteGoldVoucher(voucherId: string): Promise<IPCResult<void>>;
  createSaleReturnVoucher(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listSaleReturnVouchers(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getNextSaleReturnVoucherNo(): Promise<IPCResult<string>>;
  getSaleReturnVoucherDetails(voucherId: string): Promise<IPCResult<any>>;
  deleteSaleReturnVoucher(voucherId: string): Promise<IPCResult<void>>;
  updateSaleReturnVoucher(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  createCustomerOrder(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listCustomerOrders(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getCustomerOrderDetails(voucherId: string): Promise<IPCResult<any>>;
  cancelCustomerOrder(voucherId: string): Promise<IPCResult<void>>;
  deleteCustomerOrder(voucherId: string): Promise<IPCResult<void>>;
  updateCustomerOrder(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  createSupplierOrder(dto: any): Promise<IPCResult<{ voucherNo: string }>>;
  listSupplierOrders(
    page: number,
    limit: number,
    filters?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  getSupplierOrderDetails(voucherId: string): Promise<IPCResult<any>>;
  cancelSupplierOrder(voucherId: string): Promise<IPCResult<void>>;
  deleteSupplierOrder(voucherId: string): Promise<IPCResult<void>>;
  updateSupplierOrder(voucherId: string, dto: any): Promise<IPCResult<{ voucherNo: string }>>;

  // Setup & Initialization
  isInitialized(): Promise<boolean>;
  checkLicense(): Promise<boolean>;
  activateLicense(key: string): Promise<IPCResult<void>>;
  initializeCompany(data: {
    companyName: string;
    financialYear: string;
    accounts: any[];
    contraAccounts: any[];
    defaultGoldLedgerCode: string;
    defaultCashLedgerCode: string;
  }): Promise<IPCResult<void>>;
  updateDefaultGoldLedger(accountId: string): Promise<IPCResult<void>>;
  updateDefaultCashLedger(accountId: string): Promise<IPCResult<void>>;

  // Accounts Management
  getPaginatedAccounts(
    page: number,
    limit: number,
    options?: any,
  ): Promise<IPCResult<{ items: any[]; total: number }>>;
  createAccount(dto: any): Promise<IPCResult<any>>;
  updateAccount(id: string, dto: any): Promise<IPCResult<any>>;
  getAccountTypes(): Promise<IPCResult<string[]>>;
  getAccountSubtypes(): Promise<IPCResult<string[]>>;
  updateAccountFreezeDate(id: string, freezeDate: string | null): Promise<IPCResult<any>>;
  getAccountDetails(id: string): Promise<IPCResult<any>>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
