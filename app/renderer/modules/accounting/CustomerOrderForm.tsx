import React, { useState, useRef, useEffect } from 'react';
import { AccountSelect } from '@/components/AccountSelect';
import { Alert } from '@/components/StatusChip';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  Calendar, FileText, UserCheck, 
  RotateCcw, Save, SendHorizonal, ArrowLeft, AlertCircle,
  IndianRupee, Weight, TrendingUp, HelpCircle, CheckCircle2, CheckSquare, Package,
  Calculator
} from 'lucide-react';
import { ItemSearchModal } from '@/components/ItemSearchModal';
import { PureMonitor } from '@/components/PureMonitor';

interface CustomerOrderFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editVoucherId?: string;
  initialData?: {
    voucherId: string;
    orderType: 'BUY' | 'SELL';
    orderStatus?: 'OPEN' | 'COMPLETED';
    accountId: string;
    accountName: string;
    itemId?: string;
    itemName?: string;
    entryDate: string;
    narration: string;
    amount?: number;
    goldRate?: number;
    goldWeight?: number;
  };
}

export function CustomerOrderForm({ onCancel, onSuccess, editVoucherId, initialData }: CustomerOrderFormProps) {
  const isEdit = !!editVoucherId;
  const today = new Date().toISOString().split('T')[0];

  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>(initialData?.orderType ?? 'BUY');
  const [orderStatus, setOrderStatus] = useState<'OPEN' | 'COMPLETED'>(initialData?.orderStatus ?? 'OPEN');
  const [entryDate, setEntryDate] = useState(initialData?.entryDate ?? today);
  const [narration, setNarration] = useState(initialData?.narration ?? '');
  const [accountId, setAccountId] = useState(initialData?.accountId ?? '');
  const [accountName, setAccountName] = useState(initialData?.accountName ?? '');
  const [itemId, setItemId] = useState(initialData?.itemId ?? '');
  const [itemName, setItemName] = useState(initialData?.itemName ?? '');
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() ?? '');
  const [goldRate, setGoldRate] = useState<string>(initialData?.goldRate?.toString() ?? '');
  const [goldWeight, setGoldWeight] = useState<string>(initialData?.goldWeight?.toString() ?? '');
  
  const [loading, setLoading] = useState<'POST' | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState<'POST' | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [balances, setBalances] = useState<any>(null);

  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLTextAreaElement>(null);
  const postBtnRef = useRef<HTMLButtonElement>(null);
  const confirmYesRef = useRef<HTMLButtonElement>(null);
  const confirmNoRef = useRef<HTMLButtonElement>(null);
  const calculateRef = useRef<HTMLButtonElement>(null);
  const resetCalcRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      dateRef.current?.focus();
    }, 200);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (accountId) {
      window.electronAPI.getAccountBalances(accountId).then(res => {
        if (mounted && res.success) setBalances(res.data);
      });
    } else {
      setBalances(null);
    }
    return () => { mounted = false; };
  }, [accountId]);

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => confirmYesRef.current?.focus(), 100);
    }
  }, [showConfirm]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    if (!isItemModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsItemModalOpen(false);
        setTimeout(() => itemRef.current?.focus(), 50);
      }
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isItemModalOpen]);

  // Automatic Amount Calculation: goldWeight x goldRate
  // useEffect(() => {
  //   const weight = parseFloat(goldWeight) || 0;
  //   const rate = parseFloat(goldRate) || 0;
  //   if (weight > 0 && rate > 0) {
  //     setAmount((weight * rate).toFixed(2));
  //   }
  // }, [goldWeight, goldRate]);

  const calculateAmountOrGoldWeight = (goldWt: string, goldRate: string, amt: string) => {
    const rate = parseFloat(goldRate) || 0;
    const goldWeight = parseFloat(goldWt) || 0;
    const amount = parseFloat(amt) || 0;
    
    if (amount === 0 && goldWeight > 0) {
      setAmount((goldWeight * rate).toFixed(2));
    }
    else if (goldWeight === 0 && amount > 0) {
      setGoldWeight((amount / rate).toFixed(3));
    }
  }


  const handleReset = (preserveContext = false) => {
    if (!preserveContext) {
      setOrderType('BUY');
      setEntryDate(today);
      setAccountId('');
      setAccountName('');
    }
    setNarration('');
    setItemId('');
    setItemName('');
    setAmount('');
    setGoldRate('');
    setGoldWeight('');
    // setAlert(null); // Allow auto-dismiss
    setBalances(null);
    setTimeout(() => {
      if (preserveContext) {
        itemRef.current?.focus();
      } else {
        dateRef.current?.focus();
      }
    }, 50);
  };

  const handleSubmit = async (action: 'POST') => {
    setShowConfirm(null);
    setAlert(null);
    if (!entryDate) { setAlert({ type: 'error', msg: 'Entry date is required.' }); return; }
    if (!accountId) { setAlert({ type: 'error', msg: 'Please select a customer account.' }); return; }
    
    const amountNum = parseFloat(amount) || 0;
    const goldWeightNum = parseFloat(goldWeight) || 0;
    const goldRateNum = parseFloat(goldRate) || 0;

    if (amountNum <= 0 && goldWeightNum <= 0) {
      setAlert({ type: 'error', msg: 'Please enter either Amount or Gold Weight.' });
      return;
    }

    setLoading(action);
    try {
      const dto = {
        orderType,
        orderStatus,
        accountId,
        itemId: itemId || undefined,
        entryDate,
        narration: narration.trim() || undefined,
        amount: amountNum,
        goldRate: goldRateNum,
        goldWeight: goldWeightNum,
        action,
      };

      const res = isEdit
        ? await window.electronAPI.updateCustomerOrder(editVoucherId!, dto)
        : await window.electronAPI.createCustomerOrder(dto);
      
      if (res.success) {
        const voucherNo = (res.data as any)?.voucherNo ?? '';
        const msg = action === 'POST'
          ? `Customer Order posted successfully! Order No: ${voucherNo}`
          : `Draft saved successfully! Order No: ${voucherNo}`;
        setAlert({ type: 'success', msg });
        if (isEdit) {
          setTimeout(() => onSuccess(), 1500);
        } else {
          handleReset(true); // Preserve context for rapid entry
        }
      } else {
        setAlert({ type: 'error', msg: (res as any).error ?? 'Operation failed.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'A system error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-background justify-center">
      {/* Main Form */}
      <div className="w-full max-w-4xl flex flex-col overflow-hidden border-r border-border/50">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckSquare size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-text leading-none">
                {isEdit ? 'Edit Customer Order (Draft)' : 'Create Customer Order'}
              </h2>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                {isEdit ? 'Update draft and optionally post' : 'Record a new customer order'}
              </p>
            </div>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="shrink-0 px-6 pt-3 animate-in slide-in-from-top-2 duration-200">
            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
          
          {/* Row 1: Type Selection */}
          <div className="flex gap-8">
            <div className="flex-1 max-w-xs">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2 flex items-center gap-1">
                Order Type
              </label>
              <SegmentedControl
                options={[
                  { label: 'Buy', value: 'BUY' },
                  { label: 'Sell', value: 'SELL' },
                ]}
                value={orderType}
                onChange={(val: any) => setOrderType(val)}
                onEnter={() => dateRef.current?.focus()}
              />
            </div>

            { isEdit && (
              <div className="flex-1 max-w-xs">
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2 flex items-center gap-1">
                  Order Status
                </label>
                <SegmentedControl
                  options={[
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Completed', value: 'COMPLETED' },
                  ]}
                  value={orderStatus}
                  onChange={(val: any) => setOrderStatus(val)}
                />
              </div>
            )}
            
          </div>

          <div className="h-px bg-border/40 my-2" />

          <div className="grid grid-cols-2 gap-6">
            {/* Date + Party + Item */}
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                  <Calendar size={10} /> Entry Date <span className="text-danger">*</span>
                </label>
                <input
                  ref={dateRef}
                  type="date"
                  value={entryDate}
                  max={today}
                  onChange={e => setEntryDate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), partyRef.current?.focus())}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                  <UserCheck size={10} /> Customer Account <span className="text-danger">*</span>
                </label>
                <AccountSelect
                  inputRef={partyRef}
                  label=""
                  value={accountId}
                  displayValue={accountName}
                  onChange={(id, name) => {
                    setAccountId(id);
                    setAccountName(name);
                  }}
                  onNext={() => setTimeout(() => itemRef.current?.focus(), 50)}
                  allowedTypes={['ASSET']}
                  allowedSubtypes={['RECEIVABLE']}
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                  <Package size={10} /> Select Item
                </label>
                <div className="relative">
                  <button
                    ref={itemRef}
                    type="button"
                    onClick={() => setIsItemModalOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!itemId) {
                          setIsItemModalOpen(true);
                        } else {
                          narrationRef.current?.focus();
                        }
                      }
                    }}
                    className={`w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                      itemName ? 'text-text' : 'text-text-muted/50'
                    }`}
                  >
                    {itemName || 'Search and select an item...'}
                  </button>
                  {itemId && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemId('');
                        setItemName('');
                        itemRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Narration */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <FileText size={10} /> Narration
              </label>
              <textarea
                ref={narrationRef}
                value={narration}
                onChange={e => setNarration(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), rateRef.current?.focus())}
                placeholder="Optional note for this order..."
                className="w-full h-[200px] bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/40 resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-border/40 my-2" />

          {/* Amounts Section */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 bg-surface/30 p-6 rounded-2xl border border-border/40 items-end">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> Gold Rate per gram
              </label>
              <div className="relative">
                <input
                  ref={rateRef}
                  type="number"
                  step="0.01"
                  value={goldRate}
                  onChange={e => setGoldRate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), weightRef.current?.focus())}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-text/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40">₹</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <Weight size={10} /> Gold Weight
              </label>
              <div className="relative">
                <input
                  ref={weightRef}
                  type="number"
                  step="0.001"
                  value={goldWeight}
                  onChange={e => setGoldWeight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), amountRef.current?.focus())}
                  placeholder="0.000"
                  className="w-full bg-background border border-border rounded-xl pl-3 pr-8 py-3 text-base font-black text-amber-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 font-bold text-[10px] uppercase">g</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <IndianRupee size={10} /> Amount
              </label>
              <div className="relative">
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), calculateRef.current?.focus())}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-emerald-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40">₹</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
              </label>
              <div className="flex items-center gap-2">
                <button
                  ref={calculateRef}
                  type="button"
                  onClick={() => calculateAmountOrGoldWeight(goldWeight,goldRate,amount)}
                  // onKeyDown={e => e.key === 'Enter' && (resetCalcRef.current?.focus())}
                  className='flex items-center gap-2 px-3 py-3 rounded-xl bg-primary text-white font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50'
                ><Calculator size={26} /></button>
                <button
                  ref={resetCalcRef}
                  type="button"
                  onClick={() => {setGoldRate(''),setGoldWeight(''),setAmount('')}}
                  // onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), narrationRef.current?.focus())}
                  className='flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-500 text-white font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50'
                ><RotateCcw size={26} /></button>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-surface/50 flex items-center gap-3">
          <button
            ref={postBtnRef}
            onClick={() => setShowConfirm('POST')}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {loading === 'POST'
              ? <RotateCcw size={14} className="animate-spin" />
              : <SendHorizonal size={14} />}
            Confirm Order
          </button>

          <div className="flex-1" />

          <button
            onClick={() => handleReset()}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 text-xs font-black uppercase transition-all"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={onCancel}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-text text-xs font-black uppercase transition-all"
          >
            <AlertCircle size={14} /> Cancel
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => { setShowConfirm(null); setTimeout(() => postBtnRef.current?.focus(), 50); }} />
           <div className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-3xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <HelpCircle size={32} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-text uppercase tracking-tight">Confirm Submission</h3>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed font-medium">
                       Are you sure you want to post this order to the ledger?
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <button
                      ref={confirmYesRef}
                      onClick={() => handleSubmit(showConfirm)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          confirmNoRef.current?.focus();
                        }
                        if (e.key === 'Tab' && e.shiftKey) {
                          e.preventDefault();
                          confirmNoRef.current?.focus();
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <CheckCircle2 size={16} /> Yes, Proceed
                    </button>
                    <button
                      ref={confirmNoRef}
                      onClick={() => {
                        setShowConfirm(null);
                        setTimeout(() => postBtnRef.current?.focus(), 50);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          confirmYesRef.current?.focus();
                        }
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault();
                          confirmYesRef.current?.focus();
                        }
                      }}
                      className="px-4 py-3 rounded-2xl border border-border text-text-muted font-black uppercase text-xs hover:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Right Side: Real-time Pure Gold Monitor */}
      <aside className="w-80 shrink-0 h-full p-4 flex flex-col bg-surface/20">
        <PureMonitor
          partyId={accountId}
          partyName={accountName}
          balances={balances}
        />
      </aside>

      {isItemModalOpen && (
        <ItemSearchModal
          onClose={() => {
            setIsItemModalOpen(false);
            itemRef.current?.focus();
          }}
          onSelect={(item) => {
            setItemId(item.id);
            setItemName(item.name);
            setIsItemModalOpen(false);
            setTimeout(() => narrationRef.current?.focus(), 100);
          }}
        />
      )}
    </div>
  );
}
