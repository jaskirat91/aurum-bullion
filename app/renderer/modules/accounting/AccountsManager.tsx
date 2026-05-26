import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Search, Edit2, ChevronLeft, ChevronRight, 
  Folder, FileText, CheckCircle2, XCircle, MoreVertical,
  Filter, Download, ArrowUpDown
} from 'lucide-react';
import { Button } from '../../components/Button';
import { FormField, Input, Select } from '../../components/FormField';
import { StatusChip } from '../../components/StatusChip';
import { AccountSearchModal } from '../../components/AccountSearchModal';
import { useConfirm } from '../../context/ConfirmationContext';

interface Account {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  parent?: Account;
  account_type: string;
  account_subtype?: string;
  is_group: boolean;
  normal_balance: 'DR' | 'CR';
  unit: 'INR' | 'GRAM';
  allow_direct_posting: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AccountsManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [isGroupFilter, setIsGroupFilter] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { alert } = useConfirm();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedAccounts(page, limit, {
        search,
        is_group: isGroupFilter,
      });
      if (res.success && res.data) {
        setAccounts(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, isGroupFilter]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalPages = Math.ceil(total / limit);

  const openCreateModal = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 animate-in zoom-in slide-in-from-top-4 fade-in duration-300 font-bold">
          <CheckCircle2 size={20} className="shrink-0" />
          {toastMessage}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text flex items-center gap-3">
            <Folder className="text-primary" size={32} />
            Accounts Manager
          </h1>
          <p className="text-text-muted font-medium mt-1">
            Manage your Chart of Accounts, Groups, and Ledgers
          </p>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          icon={<Plus size={20} />}
          onClick={openCreateModal}
          className="rounded-2xl shadow-xl shadow-primary/20"
        >
          Create New Account
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col xl:flex-row gap-4 bg-surface/40 p-4 rounded-3xl border border-border/50 backdrop-blur-sm w-full">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: '', label: 'All types' },
                { value: '1', label: 'Groups Only' },
                { value: '0', label: 'Ledgers Only' },
              ]}
              value={isGroupFilter === undefined ? '' : isGroupFilter ? '1' : '0'}
              onChange={(e) => {
                 const val = e.target.value;
                 setIsGroupFilter(val === '' ? undefined : val === '1');
                 setPage(1);
              }}
              className="rounded-2xl py-3 w-full"
            />
          </div>
          {/* <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="ghost" icon={<Filter size={18} />} className="rounded-2xl flex-1 px-4">Filters</Button>
             <Button variant="ghost" icon={<Download size={18} />} className="rounded-2xl flex-1 px-4">Export</Button>
          </div> */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface/30 rounded-3xl border border-border/50 overflow-hidden shadow-sm backdrop-blur-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/40 border-b border-border/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Code</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Account Name</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Type</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Parent</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Balance</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-text-muted animate-pulse">
                    <Folder size={48} className="text-primary/20" />
                    <span className="font-bold tracking-tight">Fetching accounts...</span>
                  </div>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-text-muted italic">
                  No accounts found matching your criteria.
                </td>
              </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id} className="group hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                      {account.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${account.is_group ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {account.is_group ? <Folder size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm">{account.name}</div>
                        <div className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">
                          {account.is_group ? 'Group Account' : account.account_subtype || account.account_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md border border-border group-hover:border-primary/20 transition-colors">
                        {account.account_type}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-text/80">
                    {account.parent?.name || <span className="text-text-muted/40">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${account.normal_balance === 'DR' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {account.normal_balance}
                       </span>
                       <span className="text-xs font-mono font-bold text-text-muted">{account.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip 
                      status={account.is_active ? 'COMPLETED' : 'VOID'} 
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openEditModal(account)}
                      className="p-2 hover:bg-primary/10 text-text-muted hover:text-primary rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
         <p className="text-xs text-text-muted font-bold">
            Showing <span className="text-text">{(page - 1) * limit + 1}</span> to <span className="text-text">{Math.min(page * limit, total)}</span> of <span className="text-text">{total}</span> accounts
         </p>
         <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<ChevronLeft size={16} />} 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            />
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                if (p === 3 || p === totalPages - 2) return <span key={p} className="px-1">...</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                    page === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-primary/10 text-text-muted'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<ChevronRight size={16} />} 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            />
         </div>
      </div>

      {isModalOpen && (
        <AccountFormModal 
          isOpen={isModalOpen} 
          account={editingAccount} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={(msg: string) => {
            setIsModalOpen(false);
            fetchAccounts();
            showToast(msg);
          }}
        />
      )}
    </div>
  );
}

interface AccountFormModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

interface AccountFormData {
  name: string;
  code: string;
  parent_id: string;
  is_group: boolean;
  account_type: string;
  account_subtype: string;
  normal_balance: 'DR' | 'CR';
  unit: 'INR' | 'GRAM';
  allow_direct_posting: boolean;
  is_active: boolean;
  openingGoldBalance?: number;
  openingGoldBalanceType?: 'DR' | 'CR';
  openingAmountBalance?: number;
  openingAmountBalanceType?: 'DR' | 'CR';
  offsetAccountId?: string;
}

function AccountFormModal({ isOpen, account, onClose, onSaved }: AccountFormModalProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    code: '',
    parent_id: '',
    is_group: false,
    account_type: 'ASSET',
    account_subtype: '',
    normal_balance: 'DR',
    unit: 'INR',
    allow_direct_posting: true,
    is_active: true,
    openingGoldBalance: 0,
    openingGoldBalanceType: 'DR',
    openingAmountBalance: 0,
    openingAmountBalanceType: 'DR',
    offsetAccountId: '',
  });

  const [types, setTypes] = useState<string[]>([]);
  const [subtypes, setSubtypes] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [parentName, setParentName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.electronAPI.getAccountTypes().then(res => res.success && setTypes(res.data || []));
    window.electronAPI.getAccountSubtypes().then(res => res.success && setSubtypes(res.data || []));
  }, []);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        code: account.code,
        parent_id: account.parent_id || '',
        is_group: account.is_group,
        account_type: account.account_type,
        account_subtype: account.account_subtype || '',
        normal_balance: account.normal_balance,
        unit: account.unit,
        allow_direct_posting: account.allow_direct_posting,
        is_active: account.is_active,
      });
      setParentName(account.parent?.name || '');
    } else {
        setFormData({
            name: '',
            code: '',
            parent_id: '',
            is_group: false,
            account_type: 'ASSET',
            account_subtype: '',
            normal_balance: 'DR',
            unit: 'INR',
            allow_direct_posting: true,
            is_active: true,
            openingGoldBalance: 0,
            openingGoldBalanceType: 'DR',
            openingAmountBalance: 0,
            openingAmountBalanceType: 'DR',
            offsetAccountId: '',
        });
        setParentName('');
        setOffsetAccountName('');
    }
  }, [account, isOpen]);

  const [offsetAccountName, setOffsetAccountName] = useState('');
  const [isOffsetSearchOpen, setIsOffsetSearchOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (account) {
        res = await window.electronAPI.updateAccount(account.id, formData);
      } else {
        res = await window.electronAPI.createAccount(formData);
      }
      
      if (res.success) {
        onSaved(`Account successfully ${account ? 'updated' : 'created'}`);
      } else {
        await alert({
          title: 'Error',
          message: res.error || 'Failed to save account',
          type: 'error'
        });
      }
    } catch (err) {
      await alert({
        title: 'System Error',
        message: 'An error occurred while saving the account.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Auto-set normal balance based on type
  useEffect(() => {
    if (!formData.is_group) {
        if (['ASSET', 'EXPENSE'].includes(formData.account_type)) {
            setFormData(prev => ({ ...prev, normal_balance: 'DR' }));
        } else {
            setFormData(prev => ({ ...prev, normal_balance: 'CR' }));
        }
    }
  }, [formData.account_type, formData.is_group]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-border bg-background/20 flex items-center justify-between">
            <div>
               <h2 className="text-2xl font-black tracking-tight text-text">
                {account ? 'Edit' : 'Create'} {formData.is_group ? 'Group' : 'Ledger'} Account
                </h2>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest mt-1">
                    {formData.is_group ? 'Grouping purposes only' : 'Transactional ledger account'}
                </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-3 hover:bg-danger/10 text-text-muted hover:text-danger rounded-2xl transition-all"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* Account Type Toggle */}
            <div className="flex bg-background/50 p-1.5 rounded-[1.25rem] border border-border gap-1">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_group: false }))}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${!formData.is_group ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:bg-accent'}`}
                >
                    Ledger Account
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_group: true }))}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${formData.is_group ? 'bg-amber-500 text-white shadow-lg' : 'text-text-muted hover:bg-accent'}`}
                >
                    Group Account
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <FormField label="Account Name" required>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sales Account, HDFC Bank..."
                  required
                />
              </FormField>
              <FormField label="Account Code" required>
                <Input 
                  value={formData.code}
                  onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. SAL001, ACC001..."
                  required
                  mono
                />
              </FormField>
            </div>

            <FormField label="Parent Group (Optional)">
               <div className="relative">
                    <Input 
                        value={parentName}
                        readOnly
                        onClick={() => setIsSearchOpen(true)}
                        placeholder="Search for a group..."
                        className="cursor-pointer pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
               </div>
            </FormField>

            {!formData.is_group && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Account Type" required>
                    <Select 
                      options={types.map(t => ({ value: t, label: t }))}
                      value={formData.account_type}
                      onChange={e => setFormData(prev => ({ ...prev, account_type: e.target.value }))}
                    />
                  </FormField>
                  <FormField label="Sub Account Type">
                    <Select 
                      options={subtypes.map(t => ({ value: t, label: t }))}
                      placeholder="Select subtype"
                      value={formData.account_subtype}
                      onChange={e => setFormData(prev => ({ ...prev, account_subtype: e.target.value }))}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <FormField label="Normal Balance">
                    <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, normal_balance: 'DR' }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.normal_balance === 'DR' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            DR
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, normal_balance: 'CR' }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.normal_balance === 'CR' ? 'bg-rose-500 text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            CR
                        </button>
                    </div>
                  </FormField>
                  <FormField label="Unit">
                     <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, unit: 'INR' }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.unit === 'INR' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            INR
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, unit: 'GRAM' }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.unit === 'GRAM' ? 'bg-amber-500 text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            GRAM
                        </button>
                    </div>
                  </FormField>
                  <FormField label="Status">
                     <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, is_active: true }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${formData.is_active ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, is_active: false }))}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${!formData.is_active ? 'bg-rose-500 text-white shadow-md' : 'text-text-muted hover:bg-surface'}`}
                        >
                            Inactive
                        </button>
                    </div>
                  </FormField>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <CheckCircle2 size={20} />
                         </div>
                         <div>
                            <div className="text-sm font-extrabold">Allow Direct Posting</div>
                            <div className="text-[10px] text-text-muted font-bold uppercase">Can be used directly in journal entries</div>
                         </div>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={formData.allow_direct_posting}
                        onChange={e => setFormData(prev => ({ ...prev, allow_direct_posting: e.target.checked }))}
                        className="w-5 h-5 accent-primary cursor-pointer"
                    />
                </div>
              </div>
            )}

            {formData.is_group && (
                <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 space-y-4">
                     <div className="flex items-center gap-3">
                         <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                            <Folder size={20} />
                         </div>
                         <div className="text-sm font-extrabold text-amber-600 uppercase tracking-tight">Group Mode Enabled</div>
                     </div>
                     <p className="text-xs text-text/70 leading-relaxed font-medium">
                        This account will only be used for grouping purposes in reports like Balance Sheet and Profit & Loss. 
                        It cannot be used for direct ledger postings.
                     </p>
                </div>
            )}

            {/* Opening Balance Section (Creation Only) */}
            {!account && !formData.is_group && (
              <div className="space-y-6 p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <ArrowUpDown size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-emerald-600 uppercase tracking-tight">Opening Balance (Legacy)</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField label="1. Gold weight (g)">
                      <Input 
                        type="number"
                        value={formData.openingGoldBalance}
                        onChange={e => setFormData(prev => ({ ...prev, openingGoldBalance: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.000"
                      />
                    </FormField>
                  </div>
                  <FormField label="Type">
                    <Select 
                      options={[{value: 'DR', label: 'DR'}, {value: 'CR', label: 'CR'}]}
                      value={formData.openingGoldBalanceType}
                      onChange={e => setFormData(prev => ({ ...prev, openingGoldBalanceType: e.target.value as any }))}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField label="2. Amount (INR)">
                      <Input 
                        type="number"
                        value={formData.openingAmountBalance}
                        onChange={e => setFormData(prev => ({ ...prev, openingAmountBalance: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </FormField>
                  </div>
                  <FormField label="Type">
                    <Select 
                      options={[{value: 'DR', label: 'DR'}, {value: 'CR', label: 'CR'}]}
                      value={formData.openingAmountBalanceType}
                      onChange={e => setFormData(prev => ({ ...prev, openingAmountBalanceType: e.target.value as any }))}
                    />
                  </FormField>
                </div>

                {(formData.openingGoldBalance && formData.openingGoldBalance > 0 || formData.openingAmountBalance && formData.openingAmountBalance > 0) && (
                  <FormField label="Contra Offset Account (Required)" required>
                    <div className="relative">
                        <Input 
                            value={offsetAccountName}
                            readOnly
                            onClick={() => setIsOffsetSearchOpen(true)}
                            placeholder="Select offset account..."
                            className="cursor-pointer pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                    </div>
                  </FormField>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-border bg-background/20 flex items-center justify-end gap-4">
             <Button variant="ghost" size="lg" onClick={onClose} disabled={saving} className="rounded-2xl">Cancel</Button>
             <Button 
                variant="primary" 
                size="lg" 
                type="submit" 
                loading={saving}
                className="rounded-2xl px-12 shadow-xl shadow-primary/20"
             >
                {account ? 'Update' : 'Create'} Account
             </Button>
          </div>
        </form>
      </div>

      <AccountSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        groupsOnly={true}
        excludeId={account?.id}
        allowUnselect={true}
        onSelect={(acc: any) => {
            if (acc.id === '') {
                setFormData(prev => ({ ...prev, parent_id: '' }));
                setParentName('');
            } else {
                setFormData(prev => ({ ...prev, parent_id: acc.id }));
                setParentName(acc.name);
            }
            setIsSearchOpen(false);
        }}
      />
      <AccountSearchModal 
        isOpen={isOffsetSearchOpen} 
        onClose={() => setIsOffsetSearchOpen(false)}
        onSelect={(acc: any) => {
            setFormData(prev => ({ ...prev, offsetAccountId: acc.id }));
            setOffsetAccountName(acc.name);
            setIsOffsetSearchOpen(false);
        }}
      />
    </div>
  );
}
