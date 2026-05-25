import { IpcMain } from 'electron';

// Use Cases
import {
  ReceiveRawMaterialUseCase,
  ReceiveRawMaterialDTO,
} from '../../application/use-cases/ReceiveRawMaterialUseCase';
import {
  IssueRawMaterialToManufacturerUseCase,
  IssueRawMaterialDTO,
} from '../../application/use-cases/IssueRawMaterialToManufacturerUseCase';
import { UpdateIssueRawMaterialUseCase, UpdateIssueRawMaterialDTO } from '../../application/use-cases/UpdateIssueRawMaterialUseCase';
import { ReverseMaterialIssueUseCase } from '../../application/use-cases/ReverseMaterialIssueUseCase';
import {
  ReceiveFinishedProductUseCase,
  ReceiveFinishedProductDTO,
} from '../../application/use-cases/ReceiveFinishedProductUseCase';
import {
  UpdateReceivedFinishedProductUseCase,
  UpdateReceivedFinishedProductDTO,
} from '../../application/use-cases/UpdateReceivedFinishedProductUseCase';
import { DeleteReceivedFinishedProductUseCase } from '../../application/use-cases/DeleteReceivedFinishedProductUseCase';
import {
  CreateJournalEntryUseCase,
  CreateJournalEntryDTO,
} from '../../application/use-cases/CreateJournalEntryUseCase';
import { UpdateJournalEntryUseCase } from '../../application/use-cases/UpdateJournalEntryUseCase';
import { DeleteJournalEntryUseCase } from '../../application/use-cases/DeleteJournalEntryUseCase';
import { DeleteBatchUseCase } from '../../application/use-cases/DeleteBatchUseCase';
import { CreatePartyUseCase, CreatePartyDTO } from '../../application/use-cases/CreatePartyUseCase';
import { UpdatePartyUseCase, UpdatePartyDTO } from '../../application/use-cases/UpdatePartyUseCase';
import { CreateItemUseCase, CreateItemDTO } from '../../application/use-cases/CreateItemUseCase';
import { UpdateItemUseCase, UpdateItemDTO } from '../../application/use-cases/UpdateItemUseCase';
import { DeletePartyUseCase } from '../../application/use-cases/DeletePartyUseCase';
import {
  SellFinishedStockUseCase,
  SellFinishedStockDTO,
} from '../../application/use-cases/SellFinishedStockUseCase';
import { SellStockUseCase, SellStockDTO } from '../../application/use-cases/SellStockUseCase';
import {
  IssueGoldEquityUseCase,
  IssueGoldEquityDTO,
} from '../../application/use-cases/IssueGoldEquityUseCase';
import {
  CreateSaleVoucherUseCase,
  CreateSaleVoucherDTO,
} from '../../application/use-cases/CreateSaleVoucherUseCase';
import {
  CreateFinishedProductUseCase,
  CreateFinishedProductDTO,
} from '../../application/use-cases/CreateFinishedProductUseCase';
import {
  UpdateFinishedProductUseCase,
  UpdateFinishedProductDTO,
} from '../../application/use-cases/UpdateFinishedProductUseCase';
import { DeleteFinishedProductUseCase } from '../../application/use-cases/DeleteFinishedProductUseCase';

// Repositories (for list/query operations)
import { PartyRepository } from '../../infrastructure/repositories/PartyRepository';
import { ItemRepository } from '../../infrastructure/repositories/ItemRepository';
import { AccountRepository } from '../../infrastructure/repositories/AccountRepository';
import { JournalEntryRepository } from '../../infrastructure/repositories/JournalEntryRepository';
import { BatchRepository } from '../../infrastructure/repositories/BatchRepository';
import { FinishedProductRepository } from '../../infrastructure/repositories/FinishedProductRepository';
import {
  SaleVoucherRepository,
  SaleVoucherFilter,
} from '../../infrastructure/repositories/SaleVoucherRepository';
import {
  CashVoucherRepository,
  CashVoucherFilter,
} from '../../infrastructure/repositories/CashVoucherRepository';
import {
  UpdateSaleVoucherUseCase,
  UpdateSaleVoucherDTO,
} from '../../application/use-cases/UpdateSaleVoucherUseCase';
import { DeleteSaleVoucherUseCase } from '../../application/use-cases/DeleteSaleVoucherUseCase';
import {
  CreateCashVoucherUseCase,
  CreateCashVoucherDTO,
} from '../../application/use-cases/CreateCashVoucherUseCase';
import { CreateRateCutUseCase, CreateRateCutDTO } from '../../application/use-cases/CreateRateCutUseCase';
import { UpdateCashVoucherUseCase } from '../../application/use-cases/UpdateCashVoucherUseCase';
import { DeleteCashVoucherUseCase } from '../../application/use-cases/DeleteCashVoucherUseCase';
import { CancelCashVoucherUseCase } from '../../application/use-cases/CancelCashVoucherUseCase';
import { ImportBankStatementUseCase } from '../../application/use-cases/ImportBankStatementUseCase';
import { GetStagedRowsUseCase } from '../../application/use-cases/GetStagedRowsUseCase';
import { UpdateStagedRowUseCase } from '../../application/use-cases/UpdateStagedRowUseCase';
import { FinalizeBankImportUseCase } from '../../application/use-cases/FinalizeBankImportUseCase';
import {
  CreateGoldVoucherUseCase,
  CreateGoldVoucherDTO,
} from '../../application/use-cases/CreateGoldVoucherUseCase';
import { UpdateGoldVoucherUseCase } from '../../application/use-cases/UpdateGoldVoucherUseCase';
import { DeleteGoldVoucherUseCase } from '../../application/use-cases/DeleteGoldVoucherUseCase';
import {
  GoldVoucherRepository,
  GoldVoucherFilter,
} from '../../infrastructure/repositories/GoldVoucherRepository';
import { SetupService } from '../../application/services/SetupService';
import { AccountService } from '../../application/services/AccountService';
import { ReportService } from '../../application/services/ReportService';
import { GetPartiesDTO } from '../../application/dto/GetPartiesDTO';
import { FinishedProductFilter } from '../../domain/repositories/IFinishedProductRepository';
import { VoucherType } from '../../domain/entities/Voucher';
import { CreateSaleReturnVoucherUseCase, CreateSaleReturnVoucherDTO } from '../../application/use-cases/CreateSaleReturnVoucherUseCase';
import { UpdateSaleReturnVoucherUseCase, UpdateSaleReturnVoucherDTO } from '../../application/use-cases/UpdateSaleReturnVoucherUseCase';
import { DeleteSaleReturnVoucherUseCase } from '../../application/use-cases/DeleteSaleReturnVoucherUseCase';
import { SaleReturnVoucherRepository, SaleReturnVoucherFilter } from '../../infrastructure/repositories/SaleReturnVoucherRepository';
import { CreateCustomerOrderUseCase, CreateCustomerOrderDTO } from '../../application/use-cases/CreateCustomerOrderUseCase';
import { UpdateCustomerOrderUseCase } from '../../application/use-cases/UpdateCustomerOrderUseCase';
import { DeleteCustomerOrderUseCase } from '../../application/use-cases/DeleteCustomerOrderUseCase';
import { CustomerOrderVoucherRepository, CustomerOrderVoucherFilter } from '../../infrastructure/repositories/CustomerOrderVoucherRepository';
import { CreateSupplierOrderUseCase, CreateSupplierOrderDTO } from '../../application/use-cases/CreateSupplierOrderUseCase';
import { UpdateSupplierOrderUseCase } from '../../application/use-cases/UpdateSupplierOrderUseCase';
import { DeleteSupplierOrderUseCase } from '../../application/use-cases/DeleteSupplierOrderUseCase';
import { SupplierOrderVoucherRepository, SupplierOrderVoucherFilter } from '../../infrastructure/repositories/SupplierOrderVoucherRepository';


/** Wraps async IPC handlers with consistent error shape { success, data?, error? } */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function safe<T>(fn: () => Promise<T>) {
  return async (): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error]', message);
      return { success: false, error: message };
    }
  };
}

export function setupIpcHandlers(ipcMain: IpcMain) {
  // ─── Inventory: Receive Raw Material ────────────────────────────────────
  const receiveRawMaterialUseCase = new ReceiveRawMaterialUseCase();
  ipcMain.handle('inventory:receive-raw-material', async (_event, dto: ReceiveRawMaterialDTO) => {
    try {
      await receiveRawMaterialUseCase.execute(dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:receive-raw-material:', message);
      return { success: false, error: message };
    }
  });
  
  const deleteBatchUseCase = new DeleteBatchUseCase();
  ipcMain.handle('inventory:delete-batch', async (_event, id: string) => {
    try {
      await deleteBatchUseCase.execute(id);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:delete-batch:', message);
      return { success: false, error: message };
    }
  });

  // ─── Inventory: Issue to Manufacturer ───────────────────────────────────
  const issueRawMaterialUseCase = new IssueRawMaterialToManufacturerUseCase();
  ipcMain.handle('inventory:issue-raw-material', async (_event, dto: IssueRawMaterialDTO) => {
    try {
      const data = await issueRawMaterialUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:issue-raw-material:', message);
      return { success: false, error: message };
    }
  });

  const updateIssueRawMaterialUseCase = new UpdateIssueRawMaterialUseCase();
  ipcMain.handle('inventory:update-issue-raw-material', async (_event, id: string, dto: UpdateIssueRawMaterialDTO) => {
    try {
      await updateIssueRawMaterialUseCase.execute(id, dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:update-issue-raw-material:', message);
      return { success: false, error: message };
    }
  });

  const reverseMaterialIssueUseCase = new ReverseMaterialIssueUseCase();
  ipcMain.handle('inventory:reverse-material-issue', async (_event, id: string) => {
    try {
      await reverseMaterialIssueUseCase.execute(id);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:reverse-material-issue:', message);
      return { success: false, error: message };
    }
  });

  // ─── Inventory: Sell Finished Product ──────────────────────────────────
  const sellFinishedStockUseCase = new SellFinishedStockUseCase();
  ipcMain.handle('inventory:sell-finished-product', async (_event, dto: SellFinishedStockDTO) => {
    try {
      await sellFinishedStockUseCase.execute(dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:sell-finished-product:', message);
      return { success: false, error: message };
    }
  });

  const createFinishedProductUseCase = new CreateFinishedProductUseCase();
  ipcMain.handle('inventory:create-finished-product', async (_event, dto: CreateFinishedProductDTO) => {
    try {
      const data = await createFinishedProductUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:create-finished-product:', message);
      return { success: false, error: message };
    }
  });

  const updateFinishedProductUseCase = new UpdateFinishedProductUseCase();
  ipcMain.handle('inventory:update-finished-product', async (_event, dto: UpdateFinishedProductDTO) => {
    try {
      await updateFinishedProductUseCase.execute(dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:update-finished-product:', message);
      return { success: false, error: message };
    }
  });

  const deleteFinishedProductUseCase = new DeleteFinishedProductUseCase();
  ipcMain.handle('inventory:delete-finished-product', async (_event, id: string) => {
    try {
      await deleteFinishedProductUseCase.execute(id);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:delete-finished-product:', message);
      return { success: false, error: message };
    }
  });

  // ─── Inventory: Sell Stock (New) ──────────────────────────────────────
  const sellStockUseCase = new SellStockUseCase();
  ipcMain.handle('inventory:sell-stock', async (_event, dto: SellStockDTO) => {
    try {
      const data = await sellStockUseCase.execute(dto);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:sell-stock:', message);
      return { success: false, error: message };
    }
  });

  // ─── Inventory: Issue Gold/Equity ──────────────────────────────────────
  const issueGoldEquityUseCase = new IssueGoldEquityUseCase();
  ipcMain.handle('inventory:issue-gold-equity', async (_event, dto: IssueGoldEquityDTO) => {
    try {
      const data = await issueGoldEquityUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] inventory:issue-gold-equity:', message);
      return { success: false, error: message };
    }
  });

  // ─── Manufacturing: Receive Finished Product ─────────────────────────────
  const receiveFinishedProductUseCase = new ReceiveFinishedProductUseCase();
  ipcMain.handle(
    'manufacturing:receive-finished-product',
    async (_event, dto: ReceiveFinishedProductDTO) => {
      try {
        const data = await receiveFinishedProductUseCase.execute(dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] manufacturing:receive-finished-product:', message);
        return { success: false, error: message };
      }
    },
  );
  // ─── Manufacturing: Update Received Finished Product ─────────────────────
  const updateReceivedFinishedProductUseCase = new UpdateReceivedFinishedProductUseCase();
  ipcMain.handle(
    'manufacturing:update-received-finished-product',
    async (_event, dto: UpdateReceivedFinishedProductDTO) => {
      try {
        await updateReceivedFinishedProductUseCase.execute(dto);
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] manufacturing:update-received-finished-product:', message);
        return { success: false, error: message };
      }
    },
  );
  
  const deleteReceivedFinishedProductUseCase = new DeleteReceivedFinishedProductUseCase();
  ipcMain.handle('manufacturing:delete-received-finished-product', async (_event, id: string) => {
    try {
      await deleteReceivedFinishedProductUseCase.execute(id);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] manufacturing:delete-received-finished-product:', message);
      return { success: false, error: message };
    }
  });

  // ─── Accounting: Create Journal Entry ───────────────────────────────────
  const createJournalEntryUseCase = new CreateJournalEntryUseCase();
  ipcMain.handle('accounting:create-journal-entry', async (_event, dto: CreateJournalEntryDTO) => {
    try {
      const data = await createJournalEntryUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:create-journal-entry:', message);
      return { success: false, error: message };
    }
  });

  const updateJournalEntryUseCase = new UpdateJournalEntryUseCase();
  ipcMain.handle(
    'accounting:update-journal-entry',
    async (_event, id: string, dto: CreateJournalEntryDTO) => {
      try {
        const data = await updateJournalEntryUseCase.execute(id, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] accounting:update-journal-entry:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteJournalEntryUseCase = new DeleteJournalEntryUseCase();
  ipcMain.handle('accounting:delete-journal-entry', async (_event, id: string) => {
    try {
      const data = await deleteJournalEntryUseCase.execute(id);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:delete-journal-entry:', message);
      return { success: false, error: message };
    }
  });

  // ─── Parties: Create Party ───────────────────────────────────────────────
  const createPartyUseCase = new CreatePartyUseCase();
  ipcMain.handle('party:create', async (_event, dto: CreatePartyDTO) => {
    try {
      const data = await createPartyUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] party:create:', message);
      return { success: false, error: message };
    }
  });

  // ─── Parties: Update Party ───────────────────────────────────────────────
  // ─── Parties: Update Party ───────────────────────────────────────────────
  const updatePartyUseCase = new UpdatePartyUseCase();
  ipcMain.handle('party:update', async (_event, dto: UpdatePartyDTO) => {
    try {
      await updatePartyUseCase.execute(dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] party:update:', message);
      return { success: false, error: message };
    }
  });

  // ─── Parties: Delete Party ───────────────────────────────────────────────
  const deletePartyUseCase = new DeletePartyUseCase();
  ipcMain.handle('party:delete', async (_event, partyId: string) => {
    try {
      await deletePartyUseCase.execute(partyId);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] party:delete:', message);
      return { success: false, error: message };
    }
  });

  // ─── Items: Create Item ──────────────────────────────────────────────────
  const createItemUseCase = new CreateItemUseCase();
  ipcMain.handle('item:create', async (_event, dto: CreateItemDTO) => {
    try {
      const data = await createItemUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] item:create:', message);
      return { success: false, error: message };
    }
  });

  // ─── Items: Update Item ───────────────────────────────────────────────────
  const updateItemUseCase = new UpdateItemUseCase();
  ipcMain.handle('item:update', async (_event, dto: UpdateItemDTO) => {
    try {
      await updateItemUseCase.execute(dto);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] item:update:', message);
      return { success: false, error: message };
    }
  });

  // ─── Query: List Parties ─────────────────────────────────────────────────
  const partyRepo = new PartyRepository();
  ipcMain.handle('query:list-parties', async (_event, dto: GetPartiesDTO) => {
    try {
      const data = await partyRepo.findWithFilter(dto);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Query: List Items ───────────────────────────────────────────────────
  const itemRepo = new ItemRepository();
  ipcMain.handle('query:list-items', async () => {
    try {
      const data = await itemRepo.findAll(true);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Query: List Accounts ────────────────────────────────────────────────
  const accountRepo = new AccountRepository();
  ipcMain.handle('query:list-accounts', async () => {
    try {
      const data = await accountRepo.findAll(true);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Query: List Journal Entries ─────────────────────────────────────────
  const journalRepo = new JournalEntryRepository();
  ipcMain.handle('query:list-journal-entries', async () => {
    try {
      const data = await journalRepo.findAll();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:export-journals', async (_event, filters) => {
    try {
      const data = await journalRepo.findAllFiltered(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-next-voucher-no', async () => {
    try {
      const data = await journalRepo.generateNextVoucherNo();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle(
    'query:get-paginated-journals',
    async (_event, page: number, limit: number, filters?: any) => {
      try {
        const data = await journalRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('query:get-journal-details', async (_event, id: string) => {
    try {
      const data = await journalRepo.getDetails(id);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Query: Batches ─────────────────────────────────────────────────────
  const batchRepo = new BatchRepository();
  ipcMain.handle('query:list-batches', async (_event, filters?: { assignedTo?: string }) => {
    try {
      const data = await batchRepo.findAll(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-paginated-batches', async (_event, page, limit, filters) => {
    try {
      const data = await batchRepo.findPaginated(page, limit, filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Query: List Finished Products ───────────────────────────────────────
  const finishedProductRepo = new FinishedProductRepository();
  ipcMain.handle('query:list-finished-products', async (_event, filter: FinishedProductFilter) => {
    try {
      const data = await finishedProductRepo.findWithFilters(filter);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Setup & Initialization ─────────────────────────────────────────────
  const setupService = new SetupService();
  ipcMain.handle('setup:is-initialized', () => setupService.isInitialized());

  ipcMain.handle('setup:check-license', () => setupService.checkLicense());

  ipcMain.handle('setup:activate-license', async (_event, key: string) => {
    return await setupService.activateLicense(key);
  });

  ipcMain.handle('setup:initialize-company', async (_event, data) => {
    return await setupService.initializeCompany(data);
  });

  ipcMain.handle('setup:get-company-info', async () => {
    return await setupService.getCompanyInfo();
  });

  ipcMain.handle('party:get-next-code', async () => {
    return await setupService.getNextPartyCode();
  });

  ipcMain.handle('item:get-next-code', async () => {
    return await setupService.getNextItemCode();
  });

  ipcMain.handle('query:get-party-balances', async (_event, partyId: string) => {
    return await setupService.getPartyBalances(partyId);
  });

  ipcMain.handle('query:get-account-balances', async (_event, accountId: string) => {
    return await setupService.getAccountBalances(accountId);
  });

  ipcMain.handle('query:get-batch-details', async (_event, batchNo: string) => {
    return await setupService.getBatchDetails(batchNo);
  });

  ipcMain.handle('setup:update-default-gold-ledger', async (_event, accountId: string) => {
    return await setupService.updateDefaultGoldLedger(accountId);
  });

  ipcMain.handle('setup:update-default-cash-ledger', async (_event, accountId: string) => {
    return await setupService.updateDefaultCashLedger(accountId);
  });

  // ─── Accounts Management ────────────────────────────────────────────────
  const accountService = new AccountService(accountRepo);

  ipcMain.handle(
    'account:get-paginated',
    async (_event, page: number, limit: number, options: any) => {
      try {
        const data = await accountService.getAccounts(page, limit, options);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('account:create', async (_event, dto: any) => {
    try {
      const data = await accountService.createAccount(dto);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('account:update', async (_event, id: string, dto: any) => {
    try {
      const data = await accountService.updateAccount(id, dto);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('account:update-freeze-date', async (_event, id: string, freezeDate: string) => {
    try {
      const data = await accountService.updateFreezeDate(id, freezeDate);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('account:get-details', async (_event, id: string) => {
    try {
      const data = await accountService.getAccountById(id);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('account:get-types', async () => {
    try {
      const data = await accountService.getAccountTypes();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('account:get-subtypes', async () => {
    try {
      const data = await accountService.getAccountSubtypes();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });
  // ─── Reports ───────────────────────────────────────────────────────────
  const reportService = new ReportService();

  ipcMain.handle('query:get-party-ledger-report', async (_event, filters: any) => {
    try {
      const data = await reportService.getPartyLedgerReport(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-account-ledger-report', async (_event, filters: any) => {
    try {
      const data = await reportService.getAccountLedgerReport(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-batch-summary', async () => {
    try {
      const data = await reportService.getBatchSummary();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-karigar-consumables-report', async (_event, page, limit, filters) => {
    try {
      const data = await reportService.getKarigarConsumablesReport(page, limit, filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-karigar-consumables-summary', async (_event, filters) => {
    try {
      const data = await reportService.getKarigarConsumablesSummary(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-customer-purchase-ledger-report', async (_event, filters) => {
    try {
      const data = await reportService.getCustomerPurchaseLedgerReport(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-account-statement', async (_event, filters) => {
    try {
      const data = await reportService.getAccountStatement(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('query:get-lena-dena-report', async (_event, filters) => {
    try {
      const data = await reportService.getLenaDenaReport(filters);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  // ─── Sale Vouchers ──────────────────────────────────────────────────────
  const createSaleVoucherUseCase = new CreateSaleVoucherUseCase();
  ipcMain.handle('sale-voucher:create', async (_event, dto: CreateSaleVoucherDTO) => {
    try {
      const data = await createSaleVoucherUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] sale-voucher:create:', message);
      return { success: false, error: message };
    }
  });

  const saleVoucherRepo = new SaleVoucherRepository();
  ipcMain.handle(
    'query:list-sale-vouchers',
    async (_event, page: number, limit: number, filters?: SaleVoucherFilter) => {
      try {
        const data = await saleVoucherRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('query:get-next-sale-voucher-no', async () => {
    try {
      const data = await saleVoucherRepo.generateNextVoucherNo();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('sale-voucher:get-details', async (_event, voucherId: string) => {
    try {
      const data = await saleVoucherRepo.getFullDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const updateSaleVoucherUseCase = new UpdateSaleVoucherUseCase();
  ipcMain.handle(
    'sale-voucher:update',
    async (_event, voucherId: string, dto: UpdateSaleVoucherDTO) => {
      try {
        const data = await updateSaleVoucherUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] sale-voucher:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteSaleVoucherUseCase = new DeleteSaleVoucherUseCase();
  ipcMain.handle('sale-voucher:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteSaleVoucherUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] sale-voucher:delete:', message);
      return { success: false, error: message };
    }
  });

  // ─── Sale Return Vouchers ───────────────────────────────────────────────
  const createSaleReturnVoucherUseCase = new CreateSaleReturnVoucherUseCase();
  ipcMain.handle('sale-return-voucher:create', async (_event, dto: CreateSaleReturnVoucherDTO) => {
    try {
      const data = await createSaleReturnVoucherUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] sale-return-voucher:create:', message);
      return { success: false, error: message };
    }
  });

  const saleReturnVoucherRepo = new SaleReturnVoucherRepository();
  ipcMain.handle(
    'query:list-sale-return-vouchers',
    async (_event, page: number, limit: number, filters?: SaleReturnVoucherFilter) => {
      try {
        const data = await saleReturnVoucherRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('query:get-next-sale-return-voucher-no', async () => {
    try {
      const data = await saleReturnVoucherRepo.generateNextVoucherNo();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('sale-return-voucher:get-details', async (_event, voucherId: string) => {
    try {
      const data = await saleReturnVoucherRepo.getFullDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const updateSaleReturnVoucherUseCase = new UpdateSaleReturnVoucherUseCase();
  ipcMain.handle(
    'sale-return-voucher:update',
    async (_event, voucherId: string, dto: UpdateSaleReturnVoucherDTO) => {
      try {
        const data = await updateSaleReturnVoucherUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] sale-return-voucher:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteSaleReturnVoucherUseCase = new DeleteSaleReturnVoucherUseCase();
  ipcMain.handle('sale-return-voucher:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteSaleReturnVoucherUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] sale-return-voucher:delete:', message);
      return { success: false, error: message };
    }
  });

  // ─── Cash Vouchers ──────────────────────────────────────────────────────
  const createCashVoucherUseCase = new CreateCashVoucherUseCase();
  ipcMain.handle('cash-voucher:create', async (_event, dto: CreateCashVoucherDTO) => {
    try {
      const data = await createCashVoucherUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] cash-voucher:create:', message);
      return { success: false, error: message };
    }
  });

  const cashVoucherRepo = new CashVoucherRepository();
  ipcMain.handle(
    'query:list-cash-vouchers',
    async (_event, page: number, limit: number, filters?: CashVoucherFilter) => {
      try {
        const data = await cashVoucherRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('query:get-next-cash-voucher-no', async (_event, type: VoucherType) => {
    try {
      const data = await cashVoucherRepo.generateNextVoucherNo(type);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('cash-voucher:get-details', async (_event, voucherId: string) => {
    try {
      const data = await cashVoucherRepo.getDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const cancelCashVoucherUseCase = new CancelCashVoucherUseCase();
  ipcMain.handle('cash-voucher:cancel', async (_event, voucherId: string) => {
    try {
      const data = await cancelCashVoucherUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] cash-voucher:cancel:', message);
      return { success: false, error: message };
    }
  });

  const updateCashVoucherUseCase = new UpdateCashVoucherUseCase();
  ipcMain.handle(
    'cash-voucher:update',
    async (_event, voucherId: string, dto: CreateCashVoucherDTO) => {
      try {
        const data = await updateCashVoucherUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] cash-voucher:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteCashVoucherUseCase = new DeleteCashVoucherUseCase();
  ipcMain.handle('cash-voucher:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteCashVoucherUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] cash-voucher:delete:', message);
      return { success: false, error: message };
    }
  });

  const importBankStatementUseCase = new ImportBankStatementUseCase();
  ipcMain.handle('accounting:import-bank-statement', async (_event, dto: any) => {
    try {
      const data = await importBankStatementUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:import-bank-statement:', message);
      return { success: false, error: message };
    }
  });

  const getStagedRowsUseCase = new GetStagedRowsUseCase();
  ipcMain.handle('accounting:get-staged-rows', async (_event, importId: string) => {
    try {
      const data = await getStagedRowsUseCase.execute(importId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:get-staged-rows:', message);
      return { success: false, error: message };
    }
  });

  const updateStagedRowUseCase = new UpdateStagedRowUseCase();
  ipcMain.handle('accounting:update-staged-row', async (_event, dto: any) => {
    try {
      const data = await updateStagedRowUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:update-staged-row:', message);
      return { success: false, error: message };
    }
  });

  const finalizeBankImportUseCase = new FinalizeBankImportUseCase();
  ipcMain.handle('accounting:finalize-import', async (_event, importId: string) => {
    try {
      const data = await finalizeBankImportUseCase.execute(importId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] accounting:finalize-import:', message);
      return { success: false, error: message };
    }
  });

  // ─── Customer Orders ────────────────────────────────────────────────────
  const createCustomerOrderUseCase = new CreateCustomerOrderUseCase();
  ipcMain.handle('customer-order:create', async (_event, dto: CreateCustomerOrderDTO) => {
    try {
      const data = await createCustomerOrderUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] customer-order:create:', message);
      return { success: false, error: message };
    }
  });

  const customerOrderRepo = new CustomerOrderVoucherRepository();
  ipcMain.handle(
    'query:list-customer-orders',
    async (_event, page: number, limit: number, filters?: CustomerOrderVoucherFilter) => {
      try {
        const data = await customerOrderRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('customer-order:get-details', async (_event, voucherId: string) => {
    try {
      const data = await customerOrderRepo.getDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const updateCustomerOrderUseCase = new UpdateCustomerOrderUseCase();
  ipcMain.handle(
    'customer-order:update',
    async (_event, voucherId: string, dto: CreateCustomerOrderDTO) => {
      try {
        const data = await updateCustomerOrderUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] customer-order:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteCustomerOrderUseCase = new DeleteCustomerOrderUseCase();
  ipcMain.handle('customer-order:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteCustomerOrderUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] customer-order:delete:', message);
      return { success: false, error: message };
    }
  });

  // ─── Supplier Orders ────────────────────────────────────────────────────
  const createSupplierOrderUseCase = new CreateSupplierOrderUseCase();
  ipcMain.handle('supplier-order:create', async (_event, dto: CreateSupplierOrderDTO) => {
    try {
      const data = await createSupplierOrderUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] supplier-order:create:', message);
      return { success: false, error: message };
    }
  });

  const supplierOrderRepo = new SupplierOrderVoucherRepository();
  ipcMain.handle(
    'query:list-supplier-orders',
    async (_event, page: number, limit: number, filters?: SupplierOrderVoucherFilter) => {
      try {
        const data = await supplierOrderRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('supplier-order:get-details', async (_event, voucherId: string) => {
    try {
      const data = await supplierOrderRepo.getDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const updateSupplierOrderUseCase = new UpdateSupplierOrderUseCase();
  ipcMain.handle(
    'supplier-order:update',
    async (_event, voucherId: string, dto: CreateSupplierOrderDTO) => {
      try {
        const data = await updateSupplierOrderUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] supplier-order:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteSupplierOrderUseCase = new DeleteSupplierOrderUseCase();
  ipcMain.handle('supplier-order:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteSupplierOrderUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] supplier-order:delete:', message);
      return { success: false, error: message };
    }
  });


  // ─── Rate Cut ───────────────────────────────────────────────────────────
  const createRateCutUseCase = new CreateRateCutUseCase();
  ipcMain.handle('rate-cut:create', async (_event, dto: CreateRateCutDTO) => {
    try {
      const data = await createRateCutUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] rate-cut:create:', message);
      return { success: false, error: message };
    }
  });

  // ─── Gold Vouchers ──────────────────────────────────────────────────────
  const createGoldVoucherUseCase = new CreateGoldVoucherUseCase();
  ipcMain.handle('gold-voucher:create', async (_event, dto: CreateGoldVoucherDTO) => {
    try {
      const data = await createGoldVoucherUseCase.execute(dto);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] gold-voucher:create:', message);
      return { success: false, error: message };
    }
  });

  const goldVoucherRepo = new GoldVoucherRepository();
  ipcMain.handle(
    'query:list-gold-vouchers',
    async (_event, page: number, limit: number, filters?: GoldVoucherFilter) => {
      try {
        const data = await goldVoucherRepo.findPaginated(page, limit, filters);
        return { success: true, data };
      } catch (err: unknown) {
        return { success: false, error: String(err) };
      }
    },
  );

  ipcMain.handle('query:get-next-gold-voucher-no', async () => {
    try {
      const data = await goldVoucherRepo.generateNextVoucherNo();
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  ipcMain.handle('gold-voucher:get-details', async (_event, voucherId: string) => {
    try {
      const data = await goldVoucherRepo.getDetails(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      return { success: false, error: String(err) };
    }
  });

  const updateGoldVoucherUseCase = new UpdateGoldVoucherUseCase();
  ipcMain.handle(
    'gold-voucher:update',
    async (_event, voucherId: string, dto: CreateGoldVoucherDTO) => {
      try {
        const data = await updateGoldVoucherUseCase.execute(voucherId, dto);
        return { success: true, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[IPC Error] gold-voucher:update:', message);
        return { success: false, error: message };
      }
    },
  );

  const deleteGoldVoucherUseCase = new DeleteGoldVoucherUseCase();
  ipcMain.handle('gold-voucher:delete', async (_event, voucherId: string) => {
    try {
      const data = await deleteGoldVoucherUseCase.execute(voucherId);
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[IPC Error] gold-voucher:delete:', message);
      return { success: false, error: message };
    }
  });
}
