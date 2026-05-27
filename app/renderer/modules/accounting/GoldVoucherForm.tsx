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
  TrendingUp,
  Save,
  ArrowLeft
} from 'lucide-react';

interface GoldVoucherFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GoldVoucherForm({ initialData, onSuccess, onCancel }: GoldVoucherFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours < 10 ? '0' + hours : hours}:${strMinutes} ${ampm}`;
  };

  // Refs for focus navigation
  const typeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const goldRef = useRef<HTMLInputElement>(null);
  const cashRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const remarksRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    voucherNo: initialData?.voucher?.voucherNo || '',
    entryDate: initialData?.voucher?.entryDate || new Date().toISOString().split('T')[0],
    partyId: initialData?.partyAccount?.party?.id || '', // Track Karigar ID too
    partyAccountId: initialData?.partyAccountId || '',
    partyName: initialData?.partyAccount?.name || '',
    partyCode: initialData?.partyAccount?.code || '',
    receiptGold: initialData?.receiptGold || '' as string | number,
    issueGold: initialData?.issueGold || '' as string | number,
    receiptAmount: initialData?.receiptAmount || '' as string | number,
    issueAmount: initialData?.issueAmount || '' as string | number,
    type: (initialData?.issueGold || initialData?.issueAmount) ? 'ISSUE' : 'RECEIPT' as 'ISSUE' | 'RECEIPT',
    narration: initialData?.voucher?.narration || '',
    remarks: initialData?.remarks || '',
    remarksTime: initialData?.remarksTime || getCurrentTime(),
  });

  useEffect(() => {
    const timer = setTimeout(() => typeRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    let active = true;
    if (form.partyAccountId) {
      window.electronAPI.getAccountBalances(form.partyAccountId).then(res => {
        if (active && res.success) {
          setBalances(res.data);
        }
      });
    } else if (form.partyId) {
      // Fallback to party balances if accountId is not yet linked or for some reason not available
      window.electronAPI.getPartyBalances(form.partyId).then(res => {
        if (active && res.success) {
          setBalances(res.data);
        }
      });
    } else {
      setBalances(null);
    }
    return () => { active = false; };
  }, [form.partyAccountId]);

  const handleReset = (preserveContext = false) => {
    setForm(prev => ({
      voucherNo: '',
      entryDate: preserveContext ? prev.entryDate : new Date().toISOString().split('T')[0],
      partyId: '',
      partyAccountId: '',
      partyName: '',
      partyCode: '',
      receiptGold: '',
      issueGold: '',
      receiptAmount: '',
      issueAmount: '',
      type: preserveContext ? prev.type : 'RECEIPT',
      narration: '',
      remarks: '',
      remarksTime: getCurrentTime(),
    }));
    setBalances(null);
    // setAlert(null); // Allow auto-dismiss
    setShowConfirm(false);
    setTimeout(() => {
      if (preserveContext) {
        partyRef.current?.focus();
      } else {
        typeRef.current?.focus();
      }
    }, 50);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!form.partyAccountId) {
      setAlert({ type: 'error', msg: 'Please select a Party account.' });
      return;
    }

    if (!form.remarks.trim()) {
      setAlert({ type: 'error', msg: 'Remarks are mandatory.' });
      return;
    }

    if (!form.remarksTime.trim()) {
      setAlert({ type: 'error', msg: 'Time is mandatory.' });
      return;
    }

    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(form.remarksTime)) {
      setAlert({ type: 'error', msg: 'Please enter a valid time in HH:MM AM/PM format.' });
      return;
    }

    const gold = parseFloat((form.type === 'ISSUE' ? form.issueGold : form.receiptGold).toString()) || 0;
    const cash = parseFloat((form.type === 'ISSUE' ? form.issueAmount : form.receiptAmount).toString()) || 0;

    if (gold <= 0 && cash <= 0) {
      setAlert({ type: 'error', msg: `Either Gold weight or Amount must be greater than zero.` });
      return;
    }

    setShowConfirm(true);
  };

  const confirmAction = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const isIssue = form.type === 'ISSUE';
      const dto = {
        partyAccountId: form.partyAccountId,
        entryDate: form.entryDate,
        receiptGold: isIssue ? 0 : (parseFloat(form.receiptGold.toString()) || 0),
        issueGold: isIssue ? (parseFloat(form.issueGold.toString()) || 0) : 0,
        receiptAmount: isIssue ? 0 : (parseFloat(form.receiptAmount.toString()) || 0),
        issueAmount: isIssue ? (parseFloat(form.issueAmount.toString()) || 0) : 0,
        narration: form.narration,
        remarks: form.remarks.trim(),
        remarksTime: form.remarksTime.trim(),
        status: 'POSTED', // Default to posted for this form
      };

      const isEdit = !!initialData?.voucherId;
      const res = isEdit
        ? await window.electronAPI.updateGoldVoucher(initialData.voucherId, dto)
        : await window.electronAPI.createGoldVoucher(dto);

      if (res.success) {
        setAlert({ type: 'success', msg: `Voucher ${isEdit ? 'updated' : 'created'} successfully.` });
        setShowConfirm(false);
        if (isEdit) {
          if (onSuccess) setTimeout(() => onSuccess(), 1000);
        } else {
          handleReset(true); // Preserve context for multi-entry
        }
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
            {onCancel && (
              <button
                onClick={onCancel}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">
                {initialData ? 'Edit Gold Voucher' : 'New Gold Voucher'}
              </h2>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                {form.voucherNo || 'New Voucher Generation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
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
            
            {/* Party Selection */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm">
              <PartySelect 
                inputRef={partyRef}
                label="Select Account"
                value={form.partyAccountId}
                displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                onChange={(id, code, name, type, accountId) => {
                  setForm(prev => ({ 
                    ...prev, 
                    partyId: id,
                    partyAccountId: accountId || '', 
                    partyCode: code, 
                    partyName: name 
                  }));
                }}
                partyTypes={[]}
                onNext={() => goldRef.current?.focus()}
                required
              />
            </div>

            {/* Inputs */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm relative overflow-visible">
              <div className="grid grid-cols-2 gap-6">
                <FormField label={`Pure Gold (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input 
                      ref={goldRef}
                      type="number" step="0.001" placeholder="0.000"
                      value={isIssue ? form.issueGold : form.receiptGold}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          cashRef.current?.focus();
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => isIssue ? { ...f, issueGold: val } : { ...f, receiptGold: val });
                      }}
                      className={`text-lg h-14 font-black border-2 focus:ring-2 outline-none ${
                        isIssue 
                        ? 'focus:border-primary focus:ring-primary/20' 
                        : 'focus:border-emerald-600 focus:ring-emerald-600/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 font-black italic">grams</div>
                  </div>
                </FormField>

                <FormField label={`Amount (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input 
                      ref={cashRef}
                      type="number" step="1" placeholder="0"
                      value={isIssue ? form.issueAmount : form.receiptAmount}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          narrationRef.current?.focus();
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value;
                        setForm(f => isIssue ? { ...f, issueAmount: val } : { ...f, receiptAmount: val });
                      }}
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

            {/* Narration, Remarks & Time */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm space-y-4">
              <FormField label="Narration (Optional)">
                <Input 
                  ref={narrationRef}
                  placeholder="Enter narration..."
                  value={form.narration}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), remarksRef.current?.focus())}
                  onChange={e => setForm({...form, narration: e.target.value})}
                  className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-6">
                <FormField label="Remarks" required>
                  <Input 
                    ref={remarksRef}
                    placeholder="Enter remarks..."
                    value={form.remarks}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), timeRef.current?.focus())}
                    onChange={e => setForm({...form, remarks: e.target.value})}
                    className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                  />
                </FormField>

                <FormField label="Time (HH:MM AM/PM)" required>
                  <Input 
                    ref={timeRef}
                    placeholder="12:00 PM"
                    value={form.remarksTime}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), submitButtonRef.current?.focus())}
                    onChange={e => setForm({...form, remarksTime: e.target.value})}
                    className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                  />
                </FormField>
              </div>
            </div>

            {/* Visual Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${isIssue ? 'bg-primary/5 border-primary/20' : 'bg-emerald-500/5 border-emerald-500/20'} p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-colors`}>
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isIssue ? 'text-primary' : 'text-emerald-600'}`}>Gold to {isIssue ? 'Issue' : 'Receive'}</span>
                <span className={`text-3xl font-black ${isIssue ? 'text-primary' : 'text-emerald-600'}`}>
                  {(parseFloat((isIssue ? form.issueGold : form.receiptGold).toString()) || 0).toFixed(3)}g
                </span>
              </div>
              <div className="bg-emerald-500/5 p-6 rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Amount to {isIssue ? 'Issue' : 'Receive'}</span>
                <span className="text-3xl font-black text-emerald-600">
                  ₹ {(parseFloat((isIssue ? form.issueAmount : form.receiptAmount).toString()) || 0).toLocaleString('en-IN')}
                </span>
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
              ) : initialData ? (
                <Save size={24} className="mr-3" />
              ) : (
                <CheckCircle2 size={24} className="mr-3" />
              )}
              {loading ? 'Processing...' : initialData ? 'Update Voucher (Enter)' : `${isIssue ? 'Issue' : 'Receive'} Gold & Equity (Enter)`}
            </Button>
            {onCancel ? (
              <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase">
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => handleReset()} className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase">
                <RotateCcw size={18} className="mr-2" /> Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      <aside className="w-72 shrink-0 flex flex-col h-full overflow-hidden pt-2">
        <PureMonitor 
          partyId={form.partyId || form.partyAccountId}
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
            <h3 className="text-2xl font-black tracking-tight mb-2">Confirm {initialData ? 'Update' : (isIssue ? 'Issuance' : 'Receipt')}</h3>
            <p className="text-text-muted font-bold mb-8 leading-relaxed">
              Are you sure you want to {isIssue ? 'issue' : 'receive'} <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>{(parseFloat((isIssue ? form.issueGold : form.receiptGold).toString()) || 0).toFixed(3)}g Gold</span> and <span className="text-emerald-600 font-black">₹ {(parseFloat((isIssue ? form.issueAmount : form.receiptAmount).toString()) || 0).toLocaleString('en-IN')} Cash</span> {isIssue ? 'to' : 'from'} <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>{form.partyName}</span>?
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
