import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input, Select } from '@/components/FormField';
import { AccountSelect } from '@/components/AccountSelect';
import { Button } from '@/components/Button';
import { Alert, StatusChip } from '@/components/StatusChip';
import { Search, Building2, UserPlus, X, Edit2, WalletCards, MapPin, Phone, Mail, CheckCircle, AlertCircle, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useNavigationStore } from '@/store/navigationStore';

interface Party {
  id: string;
  name: string;
  code: string;
  type: 'MANUFACTURER' | 'KARIGAR' | 'CUSTOMER' | 'SUPPLIER';
  phone?: string;
  email?: string;
  address_line1?: string;
  city?: string;
  gst_number?: string;
  is_active: boolean;
  opening_gold_balance: number;
  opening_gold_balance_type: 'DR' | 'CR';
  opening_amount_balance: number;
  opening_amount_balance_type: 'DR' | 'CR';
  ledgerAccount?: {
    id: string;
    name: string;
    parent_id?: string;
    parent?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => !phone || /^(\+?\d{1,4}[- ]?)?\d{7,12}$/.test(phone.replace(/[\s-]/g, ''));

export function PartyManager() {
  const { pendingAction, clearPendingAction } = useNavigationStore();
  const [parties, setParties] = useState<Party[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    type: 'CUSTOMER' as 'MANUFACTURER' | 'KARIGAR' | 'CUSTOMER' | 'SUPPLIER',
    phone: '',
    email: '',
    address: '',
    city: '',
    gstNumber: '',
    openingGoldBalance: '0' as string | number,
    openingGoldBalanceType: 'DR' as 'DR' | 'CR',
    openingAmountBalance: '0' as string | number,
    openingAmountBalanceType: 'DR' as 'DR' | 'CR',
    groupId: '',
    groupCodeName: '',
  });

  // Refs for keyboard navigation
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const groupRef = useRef<{ focus: () => void } | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const ogbRef = useRef<HTMLInputElement>(null);
  const ogbtRef = useRef<HTMLSelectElement>(null);
  const oabRef = useRef<HTMLInputElement>(null);
  const oabtRef = useRef<HTMLSelectElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const focusNext = (e: React.KeyboardEvent, nextRef: React.RefObject<{ focus: () => void } | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent, isCancel: boolean) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (isCancel) {
        deleteBtnRef.current?.focus();
      } else {
        cancelBtnRef.current?.focus();
      }
    }
  };

  const fetchData = async () => {
    const result = await window.electronAPI.listParties({ types: ['MANUFACTURER', 'KARIGAR', 'CUSTOMER', 'SUPPLIER'] });
    if (result.success) setParties(result.data as Party[]);
  };

  const handleOpenCreate = async () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setLoading(true);
    const codeResult = await window.electronAPI.getNextPartyCode();
    setForm({
      name: '',
      code: codeResult.success ? (codeResult.data as string) : 'P-ERR',
      type: 'CUSTOMER',
      phone: '',
      email: '',
      address: '',
      city: '',
      gstNumber: '',
      openingGoldBalance: '0',
      openingGoldBalanceType: 'DR',
      openingAmountBalance: '0',
      openingAmountBalanceType: 'DR',
      groupId: '',
      groupCodeName: '',
    });
    setEditingParty(null);
    setShowForm(true);
    setLoading(false);
    // Focus first field after animation
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const handleEdit = (party: Party) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setEditingParty(party);
    setForm({
      name: party.name,
      code: party.code,
      type: party.type,
      phone: party.phone || '',
      email: party.email || '',
      address: party.address_line1 || '',
      city: party.city || '',
      gstNumber: party.gst_number || '',
      openingGoldBalance: party.opening_gold_balance,
      openingGoldBalanceType: party.opening_gold_balance_type,
      openingAmountBalance: party.opening_amount_balance,
      openingAmountBalanceType: party.opening_amount_balance_type,
      groupId: party.ledgerAccount?.parent_id || '',
      groupCodeName: party.ledgerAccount?.parent?.name || '',
    });
    setShowForm(true);
    // Focus first field after animation
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  useEffect(() => {
    fetchData();
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (pendingAction === 'REGISTER_PARTY') {
      handleOpenCreate();
      clearPendingAction();
    }
  }, [pendingAction, handleOpenCreate, clearPendingAction]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
          handleCloseForm();
        } else if (deleteId) {
          handleCloseDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm, deleteId]);

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await window.electronAPI.deleteParty(id);
      if (result.success) {
        fetchData();
        setSuccess('Party deleted successfully');
        handleCloseDelete();
      } else {
        setError(result.error);
        handleCloseDelete();
      }
    } catch (err) {
      setError('Failed to delete party');
      handleCloseDelete();
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingParty(null);
    if (previousFocusRef.current) {
      setTimeout(() => previousFocusRef.current?.focus(), 10);
    }
  };

  const handleCloseDelete = () => {
    setDeleteId(null);
    if (previousFocusRef.current) {
      setTimeout(() => previousFocusRef.current?.focus(), 10);
    }
  };

  const handleOpenDelete = (id: string) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setDeleteId(id);
    setMenuOpenId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {return};
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        openingGoldBalance: parseFloat(form.openingGoldBalance.toString()) || 0,
        openingAmountBalance: parseFloat(form.openingAmountBalance.toString()) || 0,
      };

      const result = editingParty 
        ? await window.electronAPI.updateParty({ ...payload, id: editingParty.id })
        : await window.electronAPI.createParty(payload);

      if (result.success) {
        setShowForm(false);
        fetchData();
        setSuccess('Party ' + (editingParty ? 'updated' : 'created') + ' successfully');
      } else {
        setError(result.error);
        setShowForm(false);
      }
    } catch (err) {
      setError('Communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const hasName = form.name.trim().length >= 3;
    const hasValidEmail = isValidEmail(form.email);
    const hasValidPhone = isValidPhone(form.phone);
    const hasCode = form.code.length > 0;
    const hasType = !!form.type;

    return hasName && hasCode && hasValidEmail && hasValidPhone && hasType;
  };

  const filtered = parties.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background p-8 overflow-hidden">
      {error && (
        <div className="mb-6 animate-in slide-in-from-top duration-300">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="mb-6 animate-in slide-in-from-top duration-300">
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        </div>
      )}
      {/* Search & Actions */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Building2 className="text-primary" size={32} />
            Party Directory
          </h1>
          <p className="text-text-muted font-bold text-xs uppercase tracking-[0.2em] px-1">Manage Karigars, Dealers & Clients</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="pl-12 pr-6 py-3 bg-surface border border-border rounded-2xl w-80 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <UserPlus size={20} className="mr-2" /> Register Party
          </Button>
        </div>
      </div>

      {/* Tabular View */}
      <div className="flex-1 overflow-hidden flex flex-col bg-surface border border-border rounded-[2rem] shadow-sm">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-border">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Code</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Party Name</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Type</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Contact Details</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">City</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Op. Gold Bal.</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Op. Amount Bal.</th>
                {/* <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th> */}
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(party => (
                <tr key={party.id} className="group hover:bg-primary/[0.02] transition-colors cursor-default">
                  <td className="p-5 py-6">
                    <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {party.code}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center text-primary font-black text-sm">
                        {party.name.substring(0, 1)}
                      </div>
                      <span className="font-bold text-base">{party.name}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md tracking-wider ${
                      party.type === 'KARIGAR' ? 'bg-amber-500/10 text-amber-500' :
                      party.type === 'MANUFACTURER' ? 'bg-blue-500/10 text-blue-500' :
                      party.type === 'SUPPLIER' ? 'bg-orange-500/10 text-orange-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {party.type}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
                        <Phone size={12} className="opacity-50" /> {party.phone || '--'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted/60 lowercase">
                        <Mail size={12} className="opacity-50" /> {party.email || '--'}
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-sm font-bold text-text-muted capitalize">
                    {party.city || 'Not set'}
                  </td>
                  <td className="p-5 text-right font-black">
                     <span className={`${party.opening_gold_balance > 0 ? party.opening_gold_balance_type === 'CR' ? 'text-red-500' : 'text-emerald-500' : 'text-text-muted'}`}>
                      {party.opening_gold_balance.toFixed(3)}g
                      <span className="text-[10px] ml-1 opacity-50 uppercase">{party.opening_gold_balance_type}</span>
                    </span>
                  </td>
                  <td className="p-5 text-right font-black">
                     <span className={`${party.opening_amount_balance > 0 ? party.opening_amount_balance_type === 'CR' ? 'text-red-500' : 'text-emerald-500' : 'text-text-muted'}`}>
                      ₹{party.opening_amount_balance.toLocaleString()}
                      <span className="text-[10px] ml-1 opacity-50 uppercase">{party.opening_amount_balance_type}</span>
                    </span>
                  </td>
                  {/* <td className="p-5">
                    <StatusChip status={party.is_active ? 'COMPLETED' : 'VOID'} />
                  </td> */}
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => { handleEdit(party); setMenuOpenId(null); }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                        title="Edit Party"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(party.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        title="Delete Party"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>                      
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <Building2 size={48} className="text-border mb-4 opacity-20" />
              <p className="font-bold text-text-muted">No parties match your current search.</p>
            </div>
          )}
        </div>
        
        {/* Table Footer / Summary */}
        <div className="shrink-0 p-4 px-6 bg-background/20 border-t border-border flex items-center justify-between">
           <span className="text-xs font-bold text-text-muted">Showing {filtered.length} of {parties.length} parties</span>
           <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 text-xs">Previous</Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs">Next</Button>
           </div>
        </div>
      </div>

      {/* Slide-over Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={handleCloseForm} />
          
          <div className="relative w-full max-w-xl bg-surface border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-8 border-b border-border flex items-center justify-between bg-background/20 sticky top-0 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  {editingParty ? <Edit2 size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{editingParty ? 'Update Details' : 'Register New Party'}</h2>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{form.code}</p>
                </div>
              </div>
              <button onClick={handleCloseForm} className="p-3 hover:bg-white/[0.05] rounded-2xl transition-colors">
                <X size={24} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1">
              {/* Error is now handled globally at the top level */}

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <WalletCards size={16} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted">Contact Identity</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Party Code" required>
                    <Input value={form.code} readOnly className="bg-background/40 font-mono opacity-80 cursor-not-allowed" />
                  </FormField>
                  <FormField label="Full Name" required>
                    <Input 
                      ref={nameRef}
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      onKeyDown={e => focusNext(e, typeRef)}
                      placeholder="e.g. Royal Gems House" 
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <FormField label="Party Type" required>
                    <Select 
                      ref={typeRef}
                      value={form.type} 
                      onChange={e => setForm({...form, type: e.target.value as 'MANUFACTURER' | 'KARIGAR' | 'CUSTOMER' | 'SUPPLIER'})}
                      onKeyDown={e => focusNext(e, groupRef)}
                      options={[
                        { value: 'CUSTOMER', label: 'CUSTOMER' },
                        // { value: 'KARIGAR', label: 'KARIGAR' },
                        // { value: 'MANUFACTURER', label: 'MANUFACTURER' },
                        { value: 'SUPPLIER', label: 'SUPPLIER' },
                      ]}
                      className="font-bold"
                    />
                  </FormField>
                  <AccountSelect
                    label="Account Group (Optional)"
                    value={form.groupId}
                    displayValue={form.groupCodeName}
                    inputRef={groupRef}
                    onChange={(id, name) => setForm({ ...form, groupId: id, groupCodeName: name })}
                    onNext={() => phoneRef.current?.focus()}
                    groupsOnly={true}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Mobile Phone">
                    <div className="relative">
                      <Input 
                        ref={phoneRef}
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})} 
                        onKeyDown={e => focusNext(e, emailRef)}
                        placeholder="+91 987..." 
                      />
                      {form.phone && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidPhone(form.phone) ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-danger" />}
                        </div>
                      )}
                    </div>
                  </FormField>
                  <FormField label="Email Address">
                    <div className="relative">
                      <Input 
                        ref={emailRef}
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})} 
                        onKeyDown={e => focusNext(e, addressRef)}
                        placeholder="contact@example.com" 
                      />
                      {form.email && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isValidEmail(form.email) ? <CheckCircle size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-danger" />}
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-violet-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted">Location & Tax</span>
                </div>
                <FormField label="Registered Address">
                  <Input 
                    ref={addressRef}
                    value={form.address} 
                    onChange={e => setForm({...form, address: e.target.value})} 
                    onKeyDown={e => focusNext(e, cityRef)}
                    placeholder="Full address..." 
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Base City">
                    <Input 
                      ref={cityRef}
                      value={form.city} 
                      onChange={e => setForm({...form, city: e.target.value})} 
                      onKeyDown={e => focusNext(e, gstRef)}
                      placeholder="e.g. Surat" 
                    />
                  </FormField>
                  <FormField label="GST #">
                    <Input 
                      ref={gstRef}
                      value={form.gstNumber} 
                      onChange={e => setForm({...form, gstNumber: e.target.value})} 
                      onKeyDown={e => {
                        if (editingParty) {
                          focusNext(e, submitRef);
                        } else {
                          focusNext(e, ogbRef);
                        }
                      }}
                      placeholder="GSTIN..." 
                    />
                  </FormField>
                </div>
              </section>

              {/* Financial Section (Locked on Edit) */}
              <section className={`space-y-6 p-6 rounded-3xl border transition-all bg-primary/5 border-primary/10`}>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-text-muted">Opening Legacy Balance</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <FormField label="1. Gold (in Grams)">
                      <Input 
                        ref={ogbRef}
                        type="number" 
                        value={form.openingGoldBalance} 
                        onChange={e => setForm({...form, openingGoldBalance: e.target.value})} 
                        onKeyDown={e => focusNext(e, ogbtRef)}
                        placeholder="0.000"
                      />
                    </FormField>
                  </div>
                  <FormField label="Type (Cr/Dr)">
                    <Select 
                      ref={ogbtRef}
                      value={form.openingGoldBalanceType} 
                      onChange={e => setForm({...form, openingGoldBalanceType: e.target.value as 'DR' | 'CR'})}
                      onKeyDown={e => focusNext(e, oabRef)}
                      options={[
                        { value: 'DR', label: 'Debit (Dr)' },
                        { value: 'CR', label: 'Credit (Cr)' }
                      ]}
                      className="h-12 font-bold"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <FormField label="2. Amount (in INR)">
                      <Input 
                        ref={oabRef}
                        type="number" 
                        value={form.openingAmountBalance} 
                        onChange={e => setForm({...form, openingAmountBalance: e.target.value})} 
                        onKeyDown={e => focusNext(e, oabtRef)}
                        placeholder="0.00"
                      />
                    </FormField>
                  </div>
                  <FormField label="Type (Cr/Dr)">
                    <Select 
                      ref={oabtRef}
                      value={form.openingAmountBalanceType} 
                      onChange={e => setForm({...form, openingAmountBalanceType: e.target.value as 'DR' | 'CR'})}
                      onKeyDown={e => focusNext(e, submitRef)}
                      options={[
                        { value: 'DR', label: 'Debit (Dr)' },
                        { value: 'CR', label: 'Credit (Cr)' }
                      ]}
                      className="h-12 font-bold"
                    />
                  </FormField>
                </div>

              </section>
            </form>

            <div className="p-8 border-t border-border bg-background/20 sticky bottom-0 backdrop-blur-md">
              <Button 
                ref={submitRef}
                onClick={handleSubmit} 
                className="w-full h-14 text-lg font-black shadow-primary/20" 
                loading={loading}
                disabled={!isFormValid()}
              >
                {editingParty ? 'Save Changes' : 'Register Party'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleCloseDelete} />
          <div className="relative bg-surface border border-border w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-danger/10 text-danger rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Trash2 size={36} />
              </div>
              <h3 className="text-2xl font-black mb-2">Confirm Delete</h3>
              <p className="text-text-muted font-bold text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="text-foreground">"{parties.find(p => p.id === deleteId)?.name}"</span>? 
                This action will also remove their associated account. This cannot be undone.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  ref={cancelBtnRef}
                  variant="ghost" 
                  onClick={handleCloseDelete}
                  onKeyDown={(e) => handleDeleteKeyDown(e, true)}
                  className="h-14 rounded-2xl font-black"
                >
                  Cancel
                </Button>
                <Button 
                  ref={deleteBtnRef}
                  onClick={() => handleDelete(deleteId)}
                  onKeyDown={(e) => handleDeleteKeyDown(e, false)}
                  className="h-14 bg-danger hover:bg-danger/90 text-white rounded-2xl font-black shadow-lg shadow-danger/20"
                  loading={loading}
                  autoFocus
                >
                  Delete Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
