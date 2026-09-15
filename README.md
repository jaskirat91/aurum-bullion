# Aurum Bullion - Jewellery & Bullion Accounting Software

> **Production-grade Electron + React accounting system tailored for the jewellery and bullion industry, built with Clean Architecture and Domain-Driven Design (DDD).**

## 📖 Overview

**Aurum Bullion** is a focused, desktop-based accounting and inventory management software engineered for jewellers and bullion traders. By combining the power of modern web technologies (React, TypeScript, Vite) with the native desktop capabilities of Electron, it delivers a high-performance, secure, and intuitive experience. The system uses SQLite as the local database, ensuring data integrity, offline capability, and maximum privacy.

---

## ✨ Core Features

Based on the active modules, the application provides the following core functionalities:

### 📊 1. Accounting Management
- **Cash Vouchers:** Create and manage cash receipts and payment vouchers.
- **Gold Vouchers:** Specialized vouchers for tracking metal (fine gold/silver) balances alongside currency.
- **Manage Journal:** Standard double-entry bookkeeping for complex adjustments and transfers.
- **Accounts:** Dedicated section to manage and review individual accounts.
- **Customer & Supplier Orders:** Track and process orders from customers and to suppliers.

### 👥 2. Party Directory
- **Party Directory:** A central ledger to view and manage all business parties (Customers, Suppliers, etc.).
- **Register New Party:** Streamlined onboarding for adding new parties to the system with their opening balances and details.

### 📦 3. Inventory
- **Items Master:** Define and manage the catalog of items handled by the business, including categories and groups.

### 📈 4. Financial Reports
- **Account Statement:** Generate detailed statements for individual accounts showing all transaction history.
- **Lena Dena Report:** A consolidated dashboard tracking "Lena" (Receivables) and "Dena" (Payables), giving an immediate snapshot of outstanding balances in both monetary and metal terms.

### ⚙️ 5. System Setup & Administration
- **Setup Wizard:** Streamlined onboarding for first-time company setup.
- **Licensing:** Built-in License Wizard for software activation.
- **Local Data Security:** Fully local SQLite database (`aurum-ledger.sqlite`) ensuring absolute privacy and data sovereignty.

---

## 🛠️ Technology Stack

- **Framework:** Electron (Desktop Environment)
- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, PostCSS, Lucide React (Icons)
- **State Management:** Zustand
- **Database / ORM:** SQLite3, TypeORM
- **Architecture:** Clean Architecture, Domain-Driven Design (DDD)

---

## 🚀 Getting Started

Follow these steps to set up the development environment locally.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aurum-bullion.git
   cd aurum-bullion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the application in Development Mode:**
   ```bash
   npm run dev
   ```
   > This command uses `concurrently` to launch the Vite dev server for the React frontend and automatically boot the Electron application.

### Build & Packaging

To compile the TypeScript code, build the React frontend, and package the application into a distributable executable:

- **Build everything:**
  ```bash
  npm run build
  ```
- **Package for macOS (.dmg):**
  ```bash
  npm run dist:mac
  ```
- **Package for Windows (.exe):**
  ```bash
  npm run dist:win
  ```
- **Package for Linux (.AppImage, .deb):**
  ```bash
  npm run dist:linux
  ```

*Build artifacts will be located in the `release/` directory.*

---

## 🏗️ Project Structure

The project strictly follows Clean Architecture principles, separating concerns between the UI, Application logic, Domain models, and Infrastructure.

```
app/
├── main/                 # Electron Main Process (Backend)
│   ├── application/      # Use Cases / Application Services
│   ├── domain/           # Entities, Value Objects, Domain Interfaces
│   ├── infrastructure/   # TypeORM, SQLite Repositories, Security
│   └── interfaces/       # IPC Controllers
├── renderer/             # Electron Renderer Process (Frontend - React)
│   ├── components/       # Reusable UI Components
│   ├── modules/          # Feature Modules (Accounting, Inventory, Parties, Reports)
│   ├── store/            # Zustand State Store
│   └── context/          # React Contexts
└── preload/              # Electron Preload Scripts (IPC Bridge)
```

---

## 📝 Code Quality & Linting

To ensure code quality and consistency across the project:

- **Type Check:** `npm run typecheck`
- **Linting:** `npm run lint`
- **Auto-Fix Lint Errors:** `npm run lint:fix`
- **Format Code (Prettier):** `npm run format`

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/your-username/aurum-bullion/issues).

## 📄 License

[Specify your license here, e.g., MIT, Proprietary, etc.]
