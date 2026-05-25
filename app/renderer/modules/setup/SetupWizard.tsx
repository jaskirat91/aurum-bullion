import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { FormField, Input } from '@/components/FormField';
import { Alert } from '@/components/StatusChip';
import { useSetupStore } from '@/store/setupStore';
import { CheckCircle2, Building2, LayoutPanelLeft, Plus, Trash2, Settings2, Calendar, Coins } from 'lucide-react';

interface SetupAccount {
  name: string;
  code: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  subType: 'INVENTORY'|'PAYABLE'|'RECEIVABLE'|'CASH'|'BANK'|'GOLD'|'LABOUR';
  normalBalance: 'DR' | 'CR';
  unit: 'INR' | 'GRAM';
}

const DEFAULT_ACCOUNTS: SetupAccount[] = [
  { name: 'Cash in Hand', code: '1001', type: 'ASSET', subType: 'CASH', normalBalance: 'DR', unit: 'INR' },
  { name: 'Main Bank Account', code: '1002', type: 'ASSET', subType: 'BANK', normalBalance: 'DR', unit: 'INR' },
  { name: 'Raw Gold Stock (24K)', code: '2001', type: 'ASSET', subType: 'GOLD', normalBalance: 'DR', unit: 'GRAM' }
];

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const getAutoFY = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [financialYear] = useState(getAutoFY());
  const [accounts, setAccounts] = useState<SetupAccount[]>(DEFAULT_ACCOUNTS);
  const [defaultGoldLedgerCode, setDefaultGoldLedgerCode] = useState('2001');
  const [defaultCashLedgerCode, setDefaultCashLedgerCode] = useState('1001');

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.initializeCompany({ 
        companyName, 
        financialYear,
        accounts,
        defaultGoldLedgerCode,
        defaultCashLedgerCode
      });
      if (result.success) {
        useSetupStore.getState().setCompanyInfo({ name: companyName, financialYear });
        setStep(5);
      } else {
        setError(result.error || 'Setup failed.');
      }
    } catch (err) {
      setError('Communication failed. Check if server is running.');
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = (idx: number, field: keyof SetupAccount, val: string) => {
    setAccounts(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a));
  };

  const addAccount = () => {
    setAccounts([...accounts, { name: '', code: '', type: 'ASSET', subType:'CASH', normalBalance: 'DR', unit: 'INR' }]);
  };

  const removeAccount = (idx: number) => {
    setAccounts(accounts.filter((_, i) => i !== idx));
  };

  const isStep1Valid = companyName.trim().length >= 3;

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-6">
      <div className={`w-full animate-fade-in ${step === 3 ? 'max-w-4xl' : 'max-w-xl'}`}>
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-primary shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'bg-surface border border-border'
              }`}
            />
          ))}
        </div>

        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          {step === 1 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Building2 size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Organization Profile</h1>
                <p className="text-text-muted leading-relaxed">
                  Start your accounting journey with Aurum. What is the name of your jewellery house?
                </p>
              </div>

              <div className="space-y-6">
                <FormField label="Company Name" required>
                  <Input 
                    value={companyName} 
                    onChange={e => setCompanyName(e.target.value)} 
                    placeholder="e.g. Royal Gems House"
                    autoFocus 
                  />
                </FormField>
                
                <div className="flex items-center gap-2 p-4 bg-background/50 border border-border rounded-2xl">
                  <Calendar size={18} className="text-primary opacity-50" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Auto-Detected FY</span>
                    <span className="text-sm font-bold text-text">{financialYear}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={() => setStep(2)} 
                    disabled={!isStep1Valid}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="h-14 w-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-6">
                  <LayoutPanelLeft size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Standard Structure</h1>
                <p className="text-text-muted leading-relaxed">
                  We've suggested a standard Chart of Accounts for <strong>{companyName}</strong>. You can customize every detail in the next step.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {accounts.slice(0, 6).map((acc, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-tighter opacity-50">{acc.code}</span>
                    <span className="text-sm font-semibold">{acc.name}</span>
                  </div>
                ))}
                <div className="col-span-2 text-center text-xs text-text-muted pt-2">+ {accounts.length - 6} more accounts</div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button size="lg" className="w-full" onClick={() => setStep(3)}>Customize Accounts</Button>
                <button onClick={() => setStep(1)} className="text-sm font-bold text-text-muted">Back to Profile</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Settings2 size={24} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">Edit Chart of Accounts</h1>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{financialYear} Seeding</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={addAccount}>
                  <Plus size={16} className="mr-2" /> Add Ledger
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                <div className="grid grid-cols-12 gap-3 px-2 text-[10px] font-black uppercase text-text-muted tracking-widest">
                  <div className="col-span-2">Code</div>
                  <div className="col-span-3">Account Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">SubType</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-1" />
                </div>

                {accounts.map((acc, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 bg-background/30 p-2 rounded-xl border border-border items-center">
                    <div className="col-span-2 font-mono text-sm">
                      <input 
                        value={acc.code} 
                        onChange={e => updateAccount(idx, 'code', e.target.value)} 
                        className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-primary rounded"
                      />
                    </div>
                    <div className="col-span-3">
                      <input 
                        value={acc.name} 
                        onChange={e => updateAccount(idx, 'name', e.target.value)} 
                        className="w-full bg-transparent p-1 focus:outline-none focus:ring-1 focus:ring-primary rounded text-sm font-bold"
                      />
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={acc.type} 
                        onChange={e => updateAccount(idx, 'type', e.target.value)}
                        className="w-full bg-transparent text-xs p-1"
                      >
                        <option value="ASSET">ASSET</option>
                        <option value="LIABILITY">LIABILITY</option>
                        <option value="EQUITY">EQUITY</option>
                        <option value="INCOME">INCOME</option>
                        <option value="EXPENSE">EXPENSE</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <select 
                        value={acc.subType} 
                        onChange={e => updateAccount(idx, 'subType', e.target.value)}
                        className="w-full bg-transparent text-xs p-1"
                      >                        
                        <option value="INVENTORY">Inventory</option>
                        <option value="PAYABLE">Payable</option>
                        <option value="RECEIVABLE">Receivable</option>
                        <option value="CASH">Cash</option>
                        <option value="BANK">Bank</option>
                        <option value="GOLD">Gold</option>
                        <option value="LABOUR">Labour</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-xs">
                      <select 
                        value={acc.unit} 
                        onChange={e => updateAccount(idx, 'unit', e.target.value)}
                        className="w-full bg-transparent p-1"
                      >
                        <option value="INR">INR</option>
                        <option value="GRAM">GRAM</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button onClick={() => removeAccount(idx)} className="text-text-muted hover:text-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
              
              <div className="pt-4 flex gap-4">
                <Button size="lg" className="flex-1 shadow-primary/20" onClick={() => setStep(4)}>
                  Select Default Ledgers
                </Button>
                <Button variant="ghost" className="px-8" onClick={() => setStep(2)}>Back</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6">
                  <Coins size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">System Defaults</h1>
                <p className="text-text-muted leading-relaxed">
                  Select default ledger accounts for automated processes and rapid data entry.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gold Ledger */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary">Default Gold Ledger</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {accounts.filter(a => a.unit === 'GRAM').map((acc) => (
                      <div 
                        key={acc.code} 
                        onClick={() => setDefaultGoldLedgerCode(acc.code)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          defaultGoldLedgerCode === acc.code 
                            ? 'bg-primary/10 border-primary ring-1 ring-primary' 
                            : 'bg-background/50 border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-50">{acc.code}</span>
                          <span className="text-sm font-bold">{acc.name}</span>
                        </div>
                        {defaultGoldLedgerCode === acc.code && (
                          <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center text-background">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cash Ledger */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-secondary">Default Cash Ledger</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {accounts.filter(a => a.unit === 'INR' && a.type === 'ASSET').map((acc) => (
                      <div 
                        key={acc.code} 
                        onClick={() => setDefaultCashLedgerCode(acc.code)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          defaultCashLedgerCode === acc.code 
                            ? 'bg-secondary/10 border-secondary ring-1 ring-secondary' 
                            : 'bg-background/50 border-border hover:border-secondary/50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter opacity-50">{acc.code}</span>
                          <span className="text-sm font-bold">{acc.name}</span>
                        </div>
                        {defaultCashLedgerCode === acc.code && (
                          <div className="h-5 w-5 bg-secondary rounded-full flex items-center justify-center text-background">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
                
                <div className="pt-4 flex gap-4">
                  <Button 
                    size="lg" 
                    className="flex-1" 
                    onClick={handleInitialize} 
                    loading={loading}
                    disabled={
                      accounts.filter(a => a.unit === 'GRAM').length === 0 || 
                      !defaultGoldLedgerCode || 
                      !defaultCashLedgerCode
                    }
                  >
                    Finish & Initialize
                  </Button>
                  <Button variant="ghost" className="px-8" onClick={() => setStep(3)}>Back</Button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 text-center py-6">
              <div className="flex justify-center">
                <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center text-success animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight">{companyName} is Active</h1>
              <p className="text-text-muted max-w-sm mx-auto">Your customized Chart of Accounts has been created for FY {financialYear}. Aurum Bullion is ready for use.</p>
              <Button size="lg" className="w-full" variant="success" onClick={onComplete}>Launch Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
