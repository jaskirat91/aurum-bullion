import React, { useState } from 'react';
import { InventoryLayout } from '@/modules/inventory/InventoryLayout';
import { ManufacturingLayout } from '@/modules/manufacturing/ManufacturingLayout';
import { AccountingLayout } from '@/modules/accounting/AccountingLayout';
import { PartyManager } from '@/modules/parties/PartyManager';
import { ReportsLayout } from '@/modules/reports/ReportsLayout';
import { SetupWizard } from '@/modules/setup/SetupWizard';
import { LicenseWizard } from '@/modules/setup/LicenseWizard';
import { useThemeStore } from '@/store/themeStore';
import { useSetupStore } from '@/store/setupStore';
import { useNavigationStore } from '@/store/navigationStore';
import { Sun, Moon, Building2, Calendar, ChevronDown, Package, Send, Coins, Archive, ShoppingCart, Inbox, Factory, Folder, Repeat, Users, UserPlus, FileText, BarChart3, Receipt, Wallet } from 'lucide-react';
import { DeveloperInfo } from '@/components/about/DeveloperInfo';
import aurumLogo from './icon.png';

type Module = 'INVENTORY' | 'MANUFACTURING' | 'ACCOUNTING' | 'PARTIES' | 'REPORTS';

interface SubNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  id: Module;
  label: string;
  icon: string;
  gradient: string;
  activeColor: string;
  subItems: SubNavItem[];
}

const NAV: NavItem[] = [
  {
    id: 'INVENTORY',
    label: 'Inventory',
    icon: '◈',
    gradient: 'from-sky-500 to-blue-600',
    activeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    subItems: [
      { id: 'ITEMS', label: 'Items Master', icon: Package },
      { id: 'STOCKS', label: 'Finished Stock', icon: Archive },
      // { id: 'SELL_STOCK', label: 'Sell Stock', icon: ShoppingCart },
    ]
  },
  {
    id: 'MANUFACTURING',
    label: 'Manufacturing',
    icon: '⬡',
    gradient: 'from-violet-500 to-purple-600',
    activeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    subItems: [
      { id: 'RAW_RECEIPT', label: 'Receive Raw Material', icon: Inbox },
      { id: 'ISSUE_MATERIAL', label: 'Issue Material', icon: Send },
      { id: 'FINISHED_RECEIPT', label: 'Receive Finished Goods', icon: Factory },
    ]
  },
  {
    id: 'ACCOUNTING',
    label: 'Accounting',
    icon: '⇌',
    gradient: 'from-emerald-500 to-teal-600',
    activeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    subItems: [
      { id: 'ACCOUNTS',      label: 'Accounts',       icon: Folder  },
      { id: 'JOURNAL',       label: 'Manage Journal',  icon: Repeat  },
      { id: 'SALE_VOUCHER',  label: 'Sale Vouchers',   icon: Receipt },
      { id: 'SALE_RETURN_VOUCHER', label: 'Sales Return Vouchers',  icon: Receipt },
      { id: 'CASH_VOUCHER',  label: 'Cash Vouchers',   icon: Wallet  },
      { id: 'GOLD_VOUCHER',  label: 'Gold Vouchers',   icon: Coins   },
      { id: 'CUSTOMER_ORDERS', label: 'Customer Orders', icon: Receipt },
      { id: 'SUPPLIER_ORDERS', label: 'Supplier Orders', icon: Receipt },
    ]
  },
  {
    id: 'PARTIES',
    label: 'Parties',
    icon: '👥',
    gradient: 'from-orange-500 to-amber-600',
    activeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    subItems: [
      { id: 'LIST', label: 'Party Directory', icon: Users },
      { id: 'REGISTER_PARTY', label: 'Register New Party', icon: UserPlus },
    ]
  },
  {
    id: 'REPORTS',
    label: 'Reports',
    icon: '📊',
    gradient: 'from-pink-500 to-rose-600',
    activeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    subItems: [
      // { id: 'PARTY_LEDGER', label: 'Party Ledger Report', icon: FileText },
      { id: 'ACCOUNT_LEDGER', label: 'Account Ledger Report', icon: FileText },
      { id: 'ACCOUNT_STATEMENT', label: 'Account Statement', icon: FileText },
      // { id: 'CUSTOMER_PURCHASE_LEDGER', label: 'Customer Purchase Ledger', icon: FileText },
      { id: 'BATCH_TRACKING', label: 'Batch Tracking Report', icon: BarChart3 },
      { id: 'KARIGAR_CONSUMABLES', label: 'Karigar Consumables', icon: BarChart3 },
      { id: 'LENA_DENA', label: 'Lena Dena Report', icon: FileText },
    ]
  },
];

export default function App() {
  const { activeModule, activeSubModules, setActiveModule, setActiveSubModule, navigateWithAction } = useNavigationStore();
  const { theme, toggleTheme } = useThemeStore();
  const { initialized, licenseValid, companyInfo, checkInitialization } = useSetupStore();
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<Module | null>(null);

  React.useEffect(() => {
    checkInitialization();
  }, [checkInitialization]);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Handle clicking outside of dropdown
  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  if (initialized === null) {
    return (
      <div className="fixed inset-0 bg-[#080e1a] flex flex-col items-center justify-center z-[9999] font-sans">
        <div className="mb-8 relative flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center font-black text-4xl text-[#080e1a] shadow-[0_0_40px_rgba(217,119,6,0.3)] animate-pulse">
            AL
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="text-[#f1f5f9] text-lg font-semibold tracking-tight">Aurum Bullion</div>
          <div className="w-6 h-6 border-2 border-sky-500/10 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="text-[#94a3b8] text-sm font-medium">Setting up things for you...</div>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return <SetupWizard onComplete={() => checkInitialization()} />;
  }

  if (licenseValid === false || (initialized && licenseValid === null)) {
    return <LicenseWizard />;
  }

  return (
    <div className={`w-full h-full bg-background text-text flex flex-col overflow-hidden transition-colors duration-300 ${theme}`}>
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 h-16 border-b border-border flex items-center px-6 gap-6 bg-surface/80 backdrop-blur-md transition-colors z-50 print:hidden">
        {/* Brand */}
        <div className="flex items-center gap-3 mr-4 bg-background/50 px-4 py-2 rounded-2xl border border-border shadow-sm">
          <img
            src={aurumLogo}
            alt="Aurum Bullion Logo"
            className="h-8 w-8 rounded-lg object-contain shrink-0"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent uppercase tracking-tight">
                Aurum Bullion
              </span>              
            </div>
            {companyInfo && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary mt-0.5 opacity-80 uppercase tracking-widest whitespace-nowrap">
                <Building2 size={10} className="shrink-0" /> {companyInfo.name}
              </div>
            )}
          </div>
        </div>

        {/* Module Nav */}
        <nav className="flex items-center gap-1 p-1 bg-background/30 rounded-xl border border-border/50">
          {NAV.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === item.id ? null : item.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  activeModule === item.id
                    ? item.activeColor + ' shadow-sm'
                    : 'text-text-muted/60 hover:text-text hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
                <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === item.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {openDropdown === item.id && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] py-3 z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >                  
                  <div className="px-3">
                    {item.subItems.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          if (item.id === 'PARTIES' && sub.id === 'REGISTER_PARTY') {
                            navigateWithAction('PARTIES', 'REGISTER_PARTY');
                          } else {
                            setActiveSubModule(item.id, sub.id);
                          }
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
                          activeModule === item.id && activeSubModules[item.id] === sub.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-text-muted hover:bg-primary/5 hover:text-primary'
                        }`}
                      >
                        <sub.icon size={18} className={activeModule === item.id && activeSubModules[item.id] === sub.id ? 'opacity-100' : 'opacity-50'} />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-surface transition-all shadow-sm"
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Module Content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.03),transparent)] pointer-events-none" />
        {activeModule === 'INVENTORY'     && <InventoryLayout />}
        {activeModule === 'MANUFACTURING' && <ManufacturingLayout />}
        {activeModule === 'ACCOUNTING'    && <AccountingLayout />}
        {activeModule === 'PARTIES'       && <PartyManager />}
        {activeModule === 'REPORTS'       && <ReportsLayout />}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="shrink-0 h-8 border-t border-border bg-surface flex items-center justify-between px-6 transition-colors font-mono relative z-10 print:hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-primary transition-colors cursor-default uppercase tracking-[0.2em]">
            <Building2 size={12} /> {companyInfo?.name}
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
            <Calendar size={12} /> FY {companyInfo?.financialYear}
          </div>
        </div>

        <button
          onClick={() => setShowDeveloperInfo(true)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted/60 hover:text-primary transition-all cursor-pointer uppercase tracking-[0.2em] px-3 py-1 rounded-full hover:bg-primary/10 hover:shadow-sm"
        >
          About the Developer
        </button>
        
        <div className="flex items-center gap-2">
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-40">System Active & Secure</span>
        </div>
      </footer>

      {showDeveloperInfo && <DeveloperInfo onClose={() => setShowDeveloperInfo(false)} />}
    </div>
  );
}
