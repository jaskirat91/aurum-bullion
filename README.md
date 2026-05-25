# Aurum Bullion — Jewellery Accounting System

A **production-grade, cross-platform desktop application** for jewellery accounting with batch-level gold tracking and full double-entry bookkeeping.

---

## 🏗️ Architecture

```
/app
  /main                     ← Electron main process (Node.js backend)
    /domain
      /entities             ← TypeORM entities (Batch, Account, Party, …)
      /repositories         ← Repository interfaces (IBatchRepository, …)
      /services             ← Domain services (AccountingService, WeightCalculationService)
      /value-objects        ← Weight, Money value objects
    /application
      /use-cases            ← Business use cases (all transactional)
    /infrastructure
      /database             ← TypeORM DataSource (SQLite, SQLCipher-ready)
      /repositories         ← Concrete implementations
      /security             ← keytar-based key management (stub → production)
    /interfaces
      /ipc                  ← Electron IPC handlers (main ↔ renderer bridge)

  /preload                  ← Electron context bridge (typed API surface)

  /renderer                 ← React frontend
    /modules
      /inventory            ← Receipt Entry, Issue Material forms
      /manufacturing        ← Receive Finished Product form
      /accounting           ← Journal Entry form
    /components             ← Reusable: Button, FormField, StatusChip
    /store                  ← Zustand state management
    /hooks                  ← useIpc (generic IPC calling hook)
```

### Key Design Decisions

| Concern          | Decision                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| **Architecture** | DDD + Clean Architecture (strict layer separation)                       |
| **ORM**          | TypeORM with decorators                                                  |
| **Database**     | SQLite (`synchronize: true` in dev; use migrations in prod)              |
| **Encryption**   | SQLCipher-ready — swap `type: 'sqlite'` for `better-sqlite3-with-cipher` |
| **Key storage**  | OS keychain via `keytar` (stub in place, production class commented in)  |
| **Transactions** | Unit of Work via `AppDataSource.transaction()` in every use case         |
| **State**        | Zustand (renderer only)                                                  |
| **IPC**          | Typed `contextBridge` with `ipcRenderer.invoke` / `ipcMain.handle`       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts:

1. **Vite dev server** on `http://localhost:5173` (hot-reload React)
2. **Electron** (waits for Vite, then compiles main process and launches)

### Build (Production)

```bash
npm run build
```

### Package (Distributable)

```bash
npx electron-builder
```

---

## 📦 Core Modules

### Inventory (Raw Material)

| Screen         | IPC Channel                      | Use Case                                |
| -------------- | -------------------------------- | --------------------------------------- |
| Receipt Entry  | `inventory:receive-raw-material` | `ReceiveRawMaterialUseCase`             |
| Issue Material | `inventory:issue-raw-material`   | `IssueRawMaterialToManufacturerUseCase` |

### Manufacturing

| Screen                   | IPC Channel                              | Use Case                        |
| ------------------------ | ---------------------------------------- | ------------------------------- |
| Receive Finished Product | `manufacturing:receive-finished-product` | `ReceiveFinishedProductUseCase` |

### Accounting

| Screen        | IPC Channel                       | Use Case                    |
| ------------- | --------------------------------- | --------------------------- |
| Journal Entry | `accounting:create-journal-entry` | `CreateJournalEntryUseCase` |

---

## 🏦 Business Rules

1. **Every MaterialTransaction** must be linked to a Batch
2. **Batch lifecycle**: `RECEIVED → WIP → COMPLETED`
3. **Double-entry**: `Σ Debit == Σ Credit` enforced in `AccountingService.assertBalanced()`
4. **LedgerEntry**: must be debit-only OR credit-only (validated on `@BeforeInsert`)
5. **All writes** are wrapped in `AppDataSource.transaction()` (Unit of Work pattern)

---

## 🔐 Security Roadmap

| Step                                             | Status                                    |
| ------------------------------------------------ | ----------------------------------------- |
| SQLite (plain)                                   | ✅ Done                                   |
| keytar stub (no-op)                              | ✅ Done                                   |
| keytar production (`KeytarKeyManagementService`) | 🔲 Uncomment in `KeyManagementService.ts` |
| SQLCipher integration                            | 🔲 Swap driver in `data-source.ts`        |

---

## 🧑‍💻 Developer Scripts

```bash
npm run dev           # Start dev (Vite + Electron)
npm run build         # Production build (main + renderer)
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run typecheck     # Full TypeScript check (main + renderer)
```

---

## 📝 Adding a New Use Case

1. **Domain**: Add/update entity in `app/main/domain/entities/`
2. **Repository interface**: Add method to `app/main/domain/repositories/I*.ts`
3. **Repository impl**: Implement in `app/main/infrastructure/repositories/`
4. **Use case**: Create in `app/main/application/use-cases/` (wrap in `AppDataSource.transaction`)
5. **IPC handler**: Register in `app/main/interfaces/ipc/handlers.ts`
6. **Preload**: Expose new method in `app/preload/index.ts`
7. **UI**: Add form/component in `app/renderer/modules/`

---

## 📁 Database

The SQLite file is stored in the OS user-data directory:

- **macOS**: `~/Library/Application Support/aurum-ledger/aurum_ledger.sqlite`
- **Windows**: `%APPDATA%\aurum-ledger\aurum_ledger.sqlite`
- **Linux**: `~/.config/aurum-ledger/aurum_ledger.sqlite`
