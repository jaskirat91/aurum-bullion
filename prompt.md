You are a senior software architect and expert in Node.js, Electron, React, and Domain-Driven Design (DDD).

Your task is to scaffold a production-grade, cross-platform desktop application for a jewellery accounting system.

# 🧱 Tech Stack Requirements

- Desktop Framework: Electron
- Frontend: React (with TypeScript)
- Backend (inside Electron main process): Node.js with TypeScript
- Database: SQLite (design should allow easy integration with SQLCipher later)
- ORM: TypeORM (or Prisma if cleaner)
- State Management: Zustand or Redux Toolkit
- Styling: Tailwind CSS
- Secure storage: keytar (for future DB encryption key storage)

# 🧠 Architecture Requirements (VERY IMPORTANT)

Follow strict DDD + Clean Architecture:

/app
/main (Electron main process - backend)
/domain
/entities
/value-objects
/repositories (interfaces only)
/services (domain services)
/application
/use-cases
/dto
/infrastructure
/database (SQLite setup)
/repositories (TypeORM/Prisma implementations)
/security (key management placeholder)
/interfaces
/ipc (Electron IPC handlers)

/renderer (React frontend)
/modules
/inventory
/accounting
/manufacturing
/components
/store
/hooks

# 📦 Core Domain to Implement

This is a jewellery accounting system with batch-level tracking.

## Core Entities:

1. Accounts

- id
- name
- code
- parent_id
- account_type (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)
- account_subtype (INVENTORY, PAYABLE, RECEIVABLE, CASH, BANK, GOLD, LABOUR, etc.)
- is_group BOOLEAN NOT NULL DEFAULT 0,
- normal_balance (DR or CR)
- unit (INR or GRAM)
- allow_direct_posting BOOLEAN DEFAULT 1,
- is_system BOOLEAN DEFAULT 0,
- is_active BOOLEAN DEFAULT 1,
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
- updated_at DATETIME,

2. Group

- id
- name
- description

3. Party
   - id
   - name
   - code
   - phone
   - email
   - address_line1
   - address_line2
   - city
   - state
   - pincode
   - country
   - gst_number
   - pan_number
   - group_id
   - ledger_account_id
   - opening_gold_balance
   - opening_balance_type (Cr/Dr)
   - is_active

4. Item
   - id
   - name
   - category (GOLD_KHOLE, FINISHED_GOOD)

5. Batch (CRITICAL AGGREGATE)
   - id
   - batchNo
   - itemId
   - sourcePartyId
   - status (RECEIVED, WIP, COMPLETED)

6. MaterialTransaction
   - id
   - type (RECEIPT, ISSUE_TO_MANUFACTURER, RECEIVE_FROM_MANUFACTURER)
   - batchId
   - partyId
   - weights (gross, net, loss, pure)
   - gross gold weight (all weights in grams with 3 decimal places)
   - less weight
   - net weight
   - tench %age
   - waste %age
   - net pure gold weight
   - kundan weight
   - total stones
   - labour per stone
   - total stone labour
   - gross weight of items
   - kundan weight
   - piroi weight
   - B.stone weight
   - stone weight
   - taar patti weight
   - color stone weight
   - tag gross weight of finished product
   - tag kundan weight
   - tag stone weight
   - tag motti weight
   - tag net weight
   - tag amount

7. FinishedProduct
   - id
   - batchId
   - partyId (Optional, if present means the product is sold, unsold otherwise)
   - finisheItemId
   - grossWeight
   - kundanWeight
   - stoneWeight
   - mottiWeight
   - smallStoneWeight
   - netWeight
   - purity percentage
   - pure gold weight
   - labourCost
   - status (IN_STOCK, SOLD)

8. Accounting (Double Entry)
   - JournalEntry (aggregate root)
   - LedgerEntry (debit/credit lines)

# ⚙️ Application Use Cases

Implement use cases:

1. ReceiveRawMaterialUseCase
2. IssueRawMaterialToManufacturerUseCase
3. ReceiveFinishedProductUseCase
4. CreateJournalEntryUseCase

Each use case should:

- Validate business rules
- Persist data using repositories
- Trigger accounting entries
- All inserts happen via transactional scope using "unit of work" pattern.

# 🔗 Business Rules

- Every MaterialTransaction must be linked to a Batch
- Batch lifecycle must be enforced
- Double-entry accounting:
  - Total debit == total credit
- LedgerEntry must be either debit OR credit (not both)

# 🗄️ Database Setup

- Setup SQLite connection
- Define schema using ORM models
- Include indexing for:
  - batch_id
  - party_id
  - transaction_date

# 🔐 Security Readiness

- Add placeholder for SQLCipher integration
- Add keytar-based secure key storage abstraction

# 🖥️ Electron Setup

- Configure main and renderer process
- Setup IPC communication between frontend and backend
- Create a basic window

# 🎨 Frontend (React)

- Setup basic layout using tailwind css
- Create forms for:
  - Receipt Entry
  - Issue Entry
  - Receive Finished Product

- Use reusable form components
- Connect to backend via IPC

# 🧪 Developer Experience

- Use TypeScript everywhere
- Setup ESLint + Prettier
- Add environment config
- Add basic logging

# 📦 Output Expectations

Generate:

1. Folder structure
2. Key files with starter code
3. Sample entity + repository + use case implementation
4. SQLite connection setup
5. Electron bootstrap code
6. One working flow (Receipt Entry end-to-end)

Focus on clean, maintainable, extensible code — not just quick scaffolding.

Do NOT skip domain modeling.
Do NOT tightly couple UI with business logic.
