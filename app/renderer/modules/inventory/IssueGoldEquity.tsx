import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { SegmentedControl } from '@/components/SegmentedControl';
import { 
  History, 
  Send, 
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Wallet,
  TrendingUp
} from 'lucide-react';

export function IssueGoldEquity({ active }: { active?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Refs for focus navigation
  const typeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const goldRef = useRef<HTMLInputElement>(null);
  const cashRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const initialForm = {
    entryDate: new Date().toISOString().split('T')[0],
    partyId: '',
    partyName: '',
    partyCode: '',
    pureGoldWeight: '' as string | number,
    equityAmount: '' as string | number,
    type: 'ISSUE' as 'ISSUE' | 'RECEIPT',
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => typeRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => cancelButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  useEffect(() => {
    let active = true;
    if (form.partyId) {
      window.electronAPI.getPartyBalances(form.partyId).then(res => {
        if (active && res.success) {
          setBalances(res.data);
        }
      });
    } else {
      setBalances(null);
    }
    return () => { active = false; };
  }, [form.partyId]);

  const handleReset = () => {
    setForm(initialForm);
    setBalances(null);
    setAlert(null);
    setShowConfirm(false);
    setTimeout(() => typeRef.current?.focus(), 50);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!form.partyId) {
      setAlert({ type: 'error', msg: 'Please select a Party.' });
      return;
    }
    const gold = parseFloat(form.pureGoldWeight.toString()) || 0;
    const cash = parseFloat(form.equityAmount.toString()) || 0;

    if (gold <= 0 && cash <= 0) {
      setAlert({ type: 'error', msg: `Either Gold weight or INR amount must be greater than zero to ${form.type.toLowerCase()}.` });
      return;
    }

    setShowConfirm(true);
  };

  const confirmAction = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const gold = parseFloat(form.pureGoldWeight.toString()) || 0;
      const cash = parseFloat(form.equityAmount.toString()) || 0;

      const res = await window.electronAPI.issueGoldEquity({
        partyId: form.partyId,
        pureGoldWeight: gold,
        equityAmount: cash,
        entryDate: form.entryDate,
        type: form.type,
      });

      if (res.success) {
        const actionText = form.type === 'ISSUE' ? 'issued to' : 'received from';
        setAlert({ type: 'success', msg: `Successfully ${actionText} ${form.partyName}.` });
        setShowConfirm(false);
        setTimeout(() => handleReset(), 1500);
      } else {
        setAlert({ type: 'error', msg: res.error || 'Failed to process.' });
        setShowConfirm(false);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'System error occurred.' });
      setShowConfirm(false);
    }
    setLoading(false);
  };

  const isIssue = form.type === 'ISSUE';

  return (
    <div 
      className="flex gap-4 h-full overflow-hidden animate-in fade-in duration-500 pt-2 p-8"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">Issue/Receipt Form</h2>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Issue or Receive Gold/Cash to Karigar/Party</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             {/* Type Toggle */}
             <div className="flex flex-col items-start shrink-0">
               <span className="text-[9px] font-black uppercase text-text-muted opacity-60">Type</span>
               <SegmentedControl 
                 inputRef={typeRef}
                 value={form.type}
                 onChange={(type) => setForm(f => ({ ...f, type }))}
                 onEnter={() => dateRef.current?.focus()}
                 options={[
                   { label: 'Issue', value: 'ISSUE', color: 'bg-primary' },
                   { label: 'Receipt', value: 'RECEIPT', color: 'bg-emerald-600' }
                 ]}
               />
             </div>

             <div className="flex flex-col items-end shrink-0">
               <span className="text-[9px] font-black uppercase text-text-muted opacity-60">Entry Date</span>
               <div className="relative group">
                 <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary opacity-60" size={14} />
                 <input 
                    ref={dateRef}
                    type="date"
                    value={form.entryDate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        partyRef.current?.focus();
                      }
                    }}
                    onChange={e => setForm({...form, entryDate: e.target.value})}
                    className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm outline-none"
                 />
               </div>
             </div>
          </div>
        </div>

        {alert && <div className="px-2 shrink-0"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex-1 space-y-4 overflow-y-auto px-1 custom-scrollbar pr-2">
            
            {/* Row 1: Party Selection */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm">
              <PartySelect 
                inputRef={partyRef}
                label="Select Party / Karigar"
                value={form.partyId}
                displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                onChange={(id, code, name) => {
                  setForm(prev => ({ ...prev, partyId: id, partyCode: code, partyName: name }));
                }}
                partyTypes={['MANUFACTURER', 'KARIGAR', 'CUSTOMER']}
                onNext={() => goldRef.current?.focus()}
                required
              />
            </div>

            {/* Row 2: Inputs */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm relative overflow-visible">
              <div className="grid grid-cols-2 gap-6">
                <FormField label={`Pure Gold (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input 
                      ref={goldRef}
                      type="number" step="0.001" placeholder="0.000"
                      value={form.pureGoldWeight}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          cashRef.current?.focus();
                        }
                      }}
                      onChange={e => setForm({...form, pureGoldWeight: e.target.value})}
                      className={`text-lg h-14 font-black border-2 focus:ring-2 outline-none ${
                        isIssue 
                        ? 'focus:border-primary focus:ring-primary/20' 
                        : 'focus:border-emerald-600 focus:ring-emerald-600/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 font-black italic">grams</div>
                  </div>
                </FormField>

                <FormField label={`INR Amount (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input 
                      ref={cashRef}
                      type="number" step="1" placeholder="0"
                      value={form.equityAmount}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitButtonRef.current?.focus();
                        }
                      }}
                      onChange={e => setForm({...form, equityAmount: e.target.value})}
                      className={`text-lg h-14 font-black border-2 focus:ring-2 outline-none ${
                        isIssue 
                        ? 'focus:border-primary focus:ring-primary/20' 
                        : 'focus:border-emerald-600 focus:ring-emerald-600/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/20 font-black italic">INR</div>
                  </div>
                </FormField>
              </div>
            </div>

            {/* Visual Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${isIssue ? 'bg-primary/5 border-primary/20' : 'bg-emerald-500/5 border-emerald-500/20'} p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-colors`}>
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isIssue ? 'text-primary' : 'text-emerald-600'}`}>Gold to {isIssue ? 'Issue' : 'Receive'}</span>
                <span className={`text-3xl font-black ${isIssue ? 'text-primary' : 'text-emerald-600'}`}>{(parseFloat(form.pureGoldWeight.toString()) || 0).toFixed(3)}g</span>
              </div>
              <div className="bg-emerald-500/5 p-6 rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Equity to {isIssue ? 'Issue' : 'Receive'}</span>
                <span className="text-3xl font-black text-emerald-600">₹ {(parseFloat(form.equityAmount.toString()) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 px-1 shrink-0">
            <Button 
              ref={submitButtonRef}
              type="submit"
              disabled={loading}
              className={`flex-[3] h-14 text-lg font-black rounded-3xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 outline-none ${
                isIssue 
                ? 'bg-primary hover:bg-primary-hover shadow-primary/10 focus:ring-primary/40' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 focus:ring-emerald-600/40'
              }`}
            >
              {loading ? (
                <RotateCcw className="animate-spin mr-3" size={24} />
              ) : (
                <CheckCircle2 size={24} className="mr-3" />
              )}
              {loading ? 'Processing...' : `${isIssue ? 'Issue' : 'Receive'} Gold & Equity (Enter)`}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset} className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase">
              <RotateCcw size={18} className="mr-2" /> Reset
            </Button>
          </div>
        </form>
      </div>

      <aside className="w-72 shrink-0 flex flex-col h-full overflow-hidden pt-2">
        <PureMonitor 
          partyId={form.partyId}
          partyName={form.partyName}
          balances={balances}
        />
      </aside>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isIssue ? 'bg-primary/10 text-primary' : 'bg-emerald-600/10 text-emerald-600'}`}>
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Confirm {isIssue ? 'Issuance' : 'Receipt'}</h3>
            <p className="text-text-muted font-bold mb-8 leading-relaxed">
              Are you sure you want to {isIssue ? 'issue' : 'receive'} <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>{(parseFloat(form.pureGoldWeight.toString()) || 0).toFixed(3)}g Gold</span> and <span className="text-emerald-600 font-black">₹ {(parseFloat(form.equityAmount.toString()) || 0).toLocaleString()} Cash</span> {isIssue ? 'to' : 'from'} <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>{form.partyName}</span>?
            </p>
            <div 
              className="flex gap-4"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (document.activeElement === confirmButtonRef.current) {
                    cancelButtonRef.current?.focus();
                  } else {
                    confirmButtonRef.current?.focus();
                  }
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (document.activeElement === cancelButtonRef.current) {
                    confirmButtonRef.current?.focus();
                  } else {
                    cancelButtonRef.current?.focus();
                  }
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  if (document.activeElement === confirmButtonRef.current) {
                    cancelButtonRef.current?.focus();
                  } else {
                    confirmButtonRef.current?.focus();
                  }
                } else if (e.key === 'Escape') {
                  setShowConfirm(false);
                  setTimeout(() => submitButtonRef.current?.focus(), 100);
                }
              }}
            >
              <Button 
                ref={confirmButtonRef}
                className={`flex-1 h-14 rounded-2xl font-black text-lg ${isIssue ? 'bg-primary' : 'bg-emerald-600 hover:bg-emerald-700'}`} 
                onClick={confirmAction}
              >
                Confirm
              </Button>
              <Button 
                ref={cancelButtonRef}
                variant="ghost" 
                className="flex-1 h-14 bg-background border border-border rounded-2xl font-black text-lg text-text-muted"
                onClick={() => {
                  setShowConfirm(false);
                  setTimeout(() => submitButtonRef.current?.focus(), 100);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

