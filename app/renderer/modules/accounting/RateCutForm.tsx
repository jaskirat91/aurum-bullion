import React, { useState, useRef, useEffect } from 'react';
import { AccountSelect } from '@/components/AccountSelect';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import {
  Wallet, Calendar, FileText, UserCheck, 
  RotateCcw, Save, SendHorizonal, ArrowLeft, AlertCircle,
  IndianRupee, Weight, TrendingUp, HelpCircle, CheckCircle2, Scissors
} from 'lucide-react';

interface RateCutFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  partyAccountId: string;
  partyAccountName: string;
}

export function RateCutForm({ onCancel, onSuccess, partyAccountId, partyAccountName }: RateCutFormProps) {
  const today = new Date().toISOString().split('T')[0];

  // Persistence for Account
  const savedAccId = localStorage.getItem('lastCashAccountId') || '';
  const savedAccName = localStorage.getItem('lastCashAccountName') || '';

  const [accountId, setAccountId] = useState(savedAccId);
  const [accountName, setAccountName] = useState(savedAccName);
  const [goldAccountId, setGoldAccountId] = useState(localStorage.getItem('lastGoldAccountId') || '');
  const [goldAccountName, setGoldAccountName] = useState(localStorage.getItem('lastGoldAccountName') || '');
  const [entryDate, setEntryDate] = useState(today);
  const [narration, setNarration] = useState('');
  
  const [cashAmount, setCashAmount] = useState<string>('');
  const [goldRate, setGoldRate] = useState<string>('');
  const [goldWeight, setGoldWeight] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const accRef = useRef<any>(null);
  const goldAccRef = useRef<any>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLTextAreaElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const postBtnRef = useRef<HTMLButtonElement>(null);
  const confirmYesRef = useRef<HTMLButtonElement>(null);
  const confirmNoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTimeout(() => {
      dateRef.current?.focus();
    }, 200);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => confirmYesRef.current?.focus(), 100);
    }
  }, [showConfirm]);

  // Persistence Logic
  useEffect(() => {
    if (accountId) localStorage.setItem('lastCashAccountId', accountId);
    if (accountName) localStorage.setItem('lastCashAccountName', accountName);
    if (goldAccountId) localStorage.setItem('lastGoldAccountId', goldAccountId);
    if (goldAccountName) localStorage.setItem('lastGoldAccountName', goldAccountName);
  }, [accountId, accountName, goldAccountId, goldAccountName]);

  // Automatic Gold Weight Calculation
  useEffect(() => {
    const amt = parseFloat(cashAmount) || 0;
    const rate = parseFloat(goldRate) || 0;
    if (amt > 0 && rate > 0) {
      setGoldWeight((amt / rate).toFixed(3));
    } else {
      setGoldWeight('');
    }
  }, [cashAmount, goldRate]);

  // Fetch party balances whenever party changes
  useEffect(() => {
    let mounted = true;
    if (partyAccountId) {
      window.electronAPI.getAccountBalances(partyAccountId).then(res => {
        if (mounted && res.success) setBalances(res.data);
      });
    } else {
      setBalances(null);
    }
    return () => { mounted = false; };
  }, [partyAccountId]);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleReset = () => {
    // Accounts persist, everything else clears
    setEntryDate(today);
    setNarration('');
    setCashAmount('');
    setGoldRate('');
    setGoldWeight('');
    setAlert(null);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setAlert(null);
    if (!entryDate) { setAlert({ type: 'error', msg: 'Entry date is required.' }); return; }
    if (!accountId) { setAlert({ type: 'error', msg: 'Please select a Cash/Bank account.' }); return; }
    if (!goldAccountId) { setAlert({ type: 'error', msg: 'Please select a Gold account.' }); return; }
    
    const amountNum = parseFloat(cashAmount) || 0;
    const goldWeightNum = parseFloat(goldWeight) || 0;
    const goldRateNum = parseFloat(goldRate) || 0;

    if (amountNum <= 0 || goldWeightNum <= 0 || goldRateNum <= 0) {
      setAlert({ type: 'error', msg: 'Please enter valid Amount and Gold Rate.' });
      setTimeout(() => dateRef.current?.focus(), 50);
      return;
    }

    setLoading(true);
    try {
      const dto = {
        partyAccountId,
        accountId,
        goldAccountId,
        entryDate,
        narration: narration.trim() || undefined,
        amount: amountNum,
        goldRate: goldRateNum,
        goldWeight: goldWeightNum,
      };

      const res = await window.electronAPI.createRateCut(dto);
      
      if (res.success) {
        const voucherNo = (res.data as any)?.voucherNo ?? '';
        setAlert({ type: 'success', msg: `Rate Cut posted successfully! Voucher No: ${voucherNo}` });
        setTimeout(() => onSuccess(), 1500);
      } else {
        setAlert({ type: 'error', msg: (res as any).error ?? 'Operation failed.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'A system error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      {/* Left Side: Main Form */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Scissors size={18} className="text-violet-500" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-text leading-none">
                Post Rate Cut
              </h2>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                Fix gold rate against cash balance
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
          
          <div className="grid grid-cols-2 gap-6">
            {/* Entry Date */}
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
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), narrationRef.current?.focus())}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            
            {/* Selected Customer (Read-only) */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <UserCheck size={10} /> Selected Customer
              </label>
              <div className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text cursor-not-allowed">
                {partyAccountName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Cash/Bank Account Selection */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <IndianRupee size={10} /> Cash/Bank Account <span className="text-danger">*</span>
              </label>
              <AccountSelect
                inputRef={accRef}
                label=""
                value={accountId}
                displayValue={accountName}
                allowedTypes={['ASSET']}
                allowedSubtypes={['CASH', 'BANK']}
                onChange={(id, name) => {
                  setAccountId(id);
                  setAccountName(name);
                }}
                onNext={() => goldAccRef.current?.focus()}
              />
            </div>

            {/* Gold Account Selection */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> Gold Account Selection <span className="text-danger">*</span>
              </label>
              <AccountSelect
                inputRef={goldAccRef}
                label=""
                value={goldAccountId}
                displayValue={goldAccountName}
                allowedSubtypes={['GOLD']}
                onChange={(id, name) => {
                  setGoldAccountId(id);
                  setGoldAccountName(name);
                }}
                onNext={() => amountRef.current?.focus()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1">
            {/* Narration */}
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <FileText size={10} /> Narration
              </label>
              <textarea
                ref={narrationRef}
                value={narration}
                onChange={e => setNarration(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), amountRef.current?.focus())}
                placeholder="Optional note for this transaction..."
                className="w-full h-[60px] bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/40 resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-border/40 my-2" />

          {/* Amounts Section */}
          <div className="grid grid-cols-3 gap-6 bg-violet-500/5 p-6 rounded-2xl border border-violet-500/20">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-violet-600 block mb-1.5 flex items-center gap-1">
                <IndianRupee size={10} /> Rate Cut Amount
              </label>
              <div className="relative">
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={e => setCashAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), rateRef.current?.focus())}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500/40">₹</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> Gold Rate in grams
              </label>
              <div className="relative">
                <input
                  ref={rateRef}
                  type="number"
                  step="0.01"
                  value={goldRate}
                  onChange={e => setGoldRate(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), postBtnRef.current?.focus())}
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-text/70 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40">₹</span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <Weight size={10} /> Gold Weight (Auto)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={goldWeight}
                  readOnly
                  placeholder="0.000"
                  className="w-full bg-background/50 border border-border rounded-xl pl-3 pr-8 py-3 text-base font-black text-amber-500/50 cursor-not-allowed outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 font-bold text-[10px] uppercase">g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-surface/50 flex items-center gap-3 justify-between">
          <div className="flex gap-3">
             <button
               onClick={handleReset}
               disabled={loading}
               className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 text-xs font-black uppercase transition-all"
             >
               <RotateCcw size={14} /> Reset
             </button>

             <button
               onClick={onCancel}
               disabled={loading}
               className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-text text-xs font-black uppercase transition-all"
             >
               <AlertCircle size={14} /> Cancel
             </button>
          </div>
          
          <button
            ref={postBtnRef}
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black uppercase shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all disabled:opacity-50"
          >
            {loading
              ? <RotateCcw size={14} className="animate-spin" />
              : <SendHorizonal size={14} />}
            Post Rate Cut
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => { setShowConfirm(false); setTimeout(() => postBtnRef.current?.focus(), 50); }} />
           <div className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-3xl p-6 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="h-14 w-14 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-600">
                    <HelpCircle size={32} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-text uppercase tracking-tight">Confirm Rate Cut</h3>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed font-medium">
                       Are you sure you want to post this rate cut voucher to the ledger?
                    </p>
                 </div>
                 <div className="grid grid-cols-2 gap-3 w-full mt-2">
                    <button
                      ref={confirmYesRef}
                      onClick={() => handleSubmit()}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && e.shiftKey) {
                          e.preventDefault();
                          confirmNoRef.current?.focus();
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-violet-600 text-white font-black uppercase text-xs shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transition-all outline-none focus:ring-2 focus:ring-violet-600/20"
                    >
                      <CheckCircle2 size={16} /> Yes, Proceed
                    </button>
                    <button
                      ref={confirmNoRef}
                      onClick={() => {
                        setShowConfirm(false);
                        setTimeout(() => postBtnRef.current?.focus(), 50);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault();
                          confirmYesRef.current?.focus();
                        }
                      }}
                      className="px-4 py-3 rounded-2xl border border-border text-text-muted font-black uppercase text-xs hover:bg-background transition-all outline-none focus:ring-2 focus:ring-violet-600/20"
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
          partyId={partyAccountId}
          partyName={partyAccountName}
          balances={balances}
        />
      </aside>
    </div>
  );
}
