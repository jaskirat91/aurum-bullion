import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { AccountSearchModal } from '@/components/AccountSearchModal';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Scale, 
  Banknote,
  AlertTriangle,
  ChevronLeft,
  Search,
  Hash,
  FileText
} from 'lucide-react';

interface LedgerLine {
  accountId: string;
  accountName: string;
  accountCode: string;
  debitINR: string | number;
  creditINR: string | number;
  debitGold: string | number;
  creditGold: string | number;
  narration: string;
}

const createEmptyLine = (): LedgerLine => ({
  accountId: '',
  accountName: '',
  accountCode: '',
  debitINR: '',
  creditINR: '',
  debitGold: '',
  creditGold: '',
  narration: ''
});

interface JournalEntryFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  editJournalId?: string;
  initialData?: {
    voucherNo: string;
    entryDate: string;
    narration: string;
    lines: LedgerLine[];
  };
}

export function JournalEntryForm({ onCancel, onSuccess, editJournalId, initialData }: JournalEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState<{ activeLine: number } | null>(null);
  
  // Header Information
  const [voucherNo, setVoucherNo] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  
  // Grid Information
  const [lines, setLines] = useState<LedgerLine[]>([createEmptyLine(), createEmptyLine()]);

  // Focus Refs
  const dateRef = useRef<HTMLInputElement>(null);
  const voucherRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const lineRefs = useRef<Array<Record<string, any>>>([]);

  useEffect(() => {
    if (editJournalId && initialData) {
      setVoucherNo(initialData.voucherNo);
      setEntryDate(initialData.entryDate);
      setNarration(initialData.narration);
      setLines(initialData.lines);
    } else {
      // Pre-generate Voucher No
      window.electronAPI.getNextVoucherNo().then(res => {
        if (res.success && res.data) setVoucherNo(res.data);
      });
    }

    // Default Focus
    setTimeout(() => dateRef.current?.focus(), 300);
  }, [editJournalId, initialData]);

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => noRef.current?.focus(), 100);
    }
  }, [showConfirm]);

  const num = (v: string | number) => parseFloat(v?.toString() || '0') || 0;

  const totals = lines.reduce((acc, l) => ({
    debitINR: acc.debitINR + num(l.debitINR),
    creditINR: acc.creditINR + num(l.creditINR),
    debitGold: acc.debitGold + num(l.debitGold),
    creditGold: acc.creditGold + num(l.creditGold),
  }), { debitINR: 0, creditINR: 0, debitGold: 0, creditGold: 0 });

  const isBalancedINR = Math.abs(totals.debitINR - totals.creditINR) < 0.01;
  const isBalancedGold = Math.abs(totals.debitGold - totals.creditGold) < 0.001;
  const isBalanced = isBalancedINR && isBalancedGold;

  const handleReset = () => {
    window.electronAPI.getNextVoucherNo().then(res => {
      if (res.success && res.data) setVoucherNo(res.data);
    });
    setEntryDate(new Date().toISOString().split('T')[0]);
    setNarration('');
    setLines([createEmptyLine(), createEmptyLine()]);
    setAlert(null);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

  const updateLine = (idx: number, updates: Partial<LedgerLine>) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...updates } : l));
  };

  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);
  const removeLine = (idx: number) => {
    if (lines.length > 2) {
      setLines(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (overwrite: boolean = false) => {
    if (!isBalanced) {
      setAlert({ type: 'error', msg: 'Journal is not balanced.' });
      return;
    }
    
    setLoading(true);
    setAlert(null);
    setShowConfirm(false);

    try {
      const payload = {
        voucherNo,
        entryDate,
        narration,
        lines: lines.map(l => ({
          accountId: l.accountId,
          debitAmount: num(l.debitINR),
          creditAmount: num(l.creditINR),
          debitGold: num(l.debitGold),
          creditGold: num(l.creditGold),
          narration: l.narration || undefined
        }))
      };

      const result = editJournalId 
        ? await window.electronAPI.updateJournalEntry(editJournalId, payload)
        : await window.electronAPI.createJournalEntry(payload);

      if (result.success) {
        setAlert({ type: 'success', msg: `Journal ${voucherNo} ${editJournalId ? 'updated' : 'posted'} successfully.` });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          handleReset();
        }, 1500);
      } else {
        setAlert({ type: 'error', msg: result.error || 'Failed to post.' });
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'System error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLineKeyDown = (idx: number, field: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Handle navigation
      if (field === 'account') {
        if (!lines[idx].accountId) {
          setShowAccountModal({ activeLine: idx });
        } else {
          lineRefs.current[idx]?.debitINR?.focus();
        }
      } else if (field === 'debitINR') {
        lineRefs.current[idx]?.creditINR?.focus();
      } else if (field === 'creditINR') {
        lineRefs.current[idx]?.debitGold?.focus();
      } else if (field === 'debitGold') {
        lineRefs.current[idx]?.creditGold?.focus();
      } else if (field === 'creditGold') {
        lineRefs.current[idx]?.narration?.focus();
      } else if (field === 'narration') {
        if (idx === lines.length - 1) {
          addLine();
          setTimeout(() => lineRefs.current[idx+1]?.account?.focus(), 100);
        } else {
          lineRefs.current[idx+1]?.account?.focus();
        }
      }
    } else if (e.key === 'F4' && field === 'account') {
      e.preventDefault();
      setShowAccountModal({ activeLine: idx });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex gap-6 h-full p-8 pt-2 overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-4 overflow-hidden pt-2">
        {/* Header Header */}
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
                <FileText size={22} />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tighter">{editJournalId ? 'Edit' : 'Create'} Journal Entry</h2>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Double-entry accounting</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end shrink-0">
               <span className="text-[9px] font-black uppercase text-text-muted opacity-60">Voucher No</span>
               <div className="relative group">
                 <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-success opacity-60" size={14} />
                 <input 
                    ref={voucherRef}
                    value={voucherNo}
                    onChange={e => setVoucherNo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && dateRef.current?.focus()}
                    className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-2 font-mono text-xs font-black text-success focus:outline-none focus:ring-2 focus:ring-success/50 transition-all outline-none uppercase"
                 />
               </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
               <span className="text-[9px] font-black uppercase text-text-muted opacity-60">Entry Date</span>
               <div className="relative group">
                 <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary opacity-60" size={14} />
                 <input 
                    ref={dateRef}
                    type="date"
                    value={entryDate}
                    onKeyDown={e => e.key === 'Enter' && narrationRef.current?.focus()}
                    onChange={e => setEntryDate(e.target.value)}
                    className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all outline-none"
                 />
               </div>
            </div>
          </div>
        </div>

        {alert && <div className="px-2 shrink-0"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

        <div className="flex-1 flex flex-col gap-4 overflow-hidden px-1">
           {/* General Narration */}
           <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm shrink-0">
              <FormField label="Entry Narration (Generic)">
                <div className="relative">
                   <Input 
                      ref={narrationRef}
                      value={narration}
                      onChange={e => setNarration(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          lineRefs.current[0]?.account?.focus();
                        }
                      }}
                      placeholder="Narrate the purpose of this entry..."
                      className="h-10 text-sm font-medium"
                   />
                   <FileText className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10" size={18} />
                </div>
              </FormField>
           </div>

           {/* Ledger Lines Grid */}
           <div className="flex-1 bg-surface rounded-3xl border border-border/50 shadow-sm flex flex-col overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-background/20 text-[9px] font-black uppercase tracking-widest text-text-muted">
                 <div className="col-span-3">Account Details</div>
                 <div className="col-span-2 text-right">Debit (INR)</div>
                 <div className="col-span-2 text-right">Credit (INR)</div>
                 <div className="col-span-2 text-right">Debit (Gold)</div>
                 <div className="col-span-2 text-right">Credit (Gold)</div>
                 <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                 {lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start animate-in slide-in-from-left duration-300">
                       <div className="col-span-3 space-y-1">
                          <div className="relative group">
                             <Input 
                                ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].account = el; }}
                                value={line.accountName ? `${line.accountCode} - ${line.accountName}` : ''}
                                onClick={() => setShowAccountModal({ activeLine: idx })}
                                onKeyDown={e => handleLineKeyDown(idx, 'account', e)}
                                placeholder="Choose Account..."
                                readOnly
                                className="cursor-pointer font-bold border-transparent bg-background/50 hover:border-emerald-500/50 transition-all h-9 text-xs"
                             />
                             <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity text-emerald-500" />
                          </div>
                          <Input 
                             ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].narration = el; }}
                             value={line.narration}
                             onChange={e => updateLine(idx, { narration: e.target.value })}
                             onKeyDown={e => handleLineKeyDown(idx, 'narration', e)}
                             placeholder="Line narration (optional)"
                             className="h-7 text-[10px] bg-transparent border-dashed border-border/50 focus:border-primary"
                          />
                       </div>

                       <div className="col-span-2">
                          <Input 
                             ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].debitINR = el; }}
                             type="number" step="0.01"
                             value={line.debitINR}
                             onChange={e => updateLine(idx, { debitINR: e.target.value, creditINR: '' })}
                             onKeyDown={e => handleLineKeyDown(idx, 'debitINR', e)}
                             placeholder="0.00"
                             className="text-right h-9 font-black text-primary border-primary/20 bg-primary/[0.02]"
                          />
                       </div>

                       <div className="col-span-2">
                          <Input 
                             ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].creditINR = el; }}
                             type="number" step="0.01"
                             value={line.creditINR}
                             onChange={e => updateLine(idx, { creditINR: e.target.value, debitINR: '' })}
                             onKeyDown={e => handleLineKeyDown(idx, 'creditINR', e)}
                             placeholder="0.00"
                             className="text-right h-9 font-black text-danger border-danger/20 bg-danger/[0.02]"
                          />
                       </div>

                       <div className="col-span-2">
                          <Input 
                             ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].debitGold = el; }}
                             type="number" step="0.001"
                             value={line.debitGold}
                             onChange={e => updateLine(idx, { debitGold: e.target.value, creditGold: '' })}
                             onKeyDown={e => handleLineKeyDown(idx, 'debitGold', e)}
                             placeholder="0.000"
                             className="text-right h-9 font-black text-yellow-600 border-yellow-500/20 bg-yellow-500/5 shadow-inner"
                          />
                       </div>

                       <div className="col-span-2">
                          <Input 
                             ref={el => { if (!lineRefs.current[idx]) lineRefs.current[idx] = {}; lineRefs.current[idx].creditGold = el; }}
                             type="number" step="0.001"
                             value={line.creditGold}
                             onChange={e => updateLine(idx, { creditGold: e.target.value, debitGold: '' })}
                             onKeyDown={e => handleLineKeyDown(idx, 'creditGold', e)}
                             placeholder="0.000"
                             className="text-right h-9 font-black text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-inner"
                          />
                       </div>

                       <div className="col-span-1 flex justify-center py-1">
                          <button 
                             type="button"
                             onClick={() => removeLine(idx)}
                             disabled={lines.length <= 2}
                             className="p-2 text-text-muted/30 hover:text-danger hover:bg-danger/10 rounded-xl transition-all disabled:opacity-0"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}

                 <button 
                    type="button" 
                    onClick={addLine}
                    className="w-full py-4 border-2 border-dashed border-border/30 rounded-2xl flex items-center justify-center gap-2 text-text-muted/40 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all font-black text-xs uppercase tracking-widest"
                 >
                    <Plus size={16} /> Add Distribution Line
                 </button>
              </div>

              {/* Bottom Footer Action */}
              <div className="p-4 bg-background/50 border-t border-border flex items-center justify-between shrink-0">
                 <div className="flex gap-4">
                    <Button 
                       ref={saveRef}
                       onClick={() => setShowConfirm(true)}
                       disabled={!isBalanced || loading}
                       className="h-12 px-8 rounded-2xl font-black text-sm uppercase tracking-wide shadow-lg shadow-primary/20"
                    >
                       <CheckCircle2 size={18} className="mr-2" />
                       {editJournalId ? 'Update' : 'Post'} Journal Entry
                    </Button>
                    <Button 
                       variant="ghost"
                       onClick={handleReset}
                       className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-text-muted hover:text-danger"
                    >
                       <RotateCcw size={16} className="mr-2" /> Reset
                    </Button>
                    {onCancel && (
                       <Button 
                          variant="ghost" 
                          onClick={onCancel}
                          className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-text-muted"
                       >
                          Cancel
                       </Button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Sidebar - Balanced Monitor */}
      <aside className="w-80 shrink-0 flex flex-col pt-2 transition-all">
         <div className="bg-surface rounded-3xl border border-border/50 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-border bg-background/50">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Balance Monitor</h3>
                  <div className={`h-2 w-2 rounded-full animate-pulse ${isBalanced ? 'bg-success' : 'bg-danger'}`} />
               </div>
               
               <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border transition-all ${isBalancedINR ? 'bg-primary/5 border-primary/20' : 'bg-danger/5 border-danger/20'}`}>
                     <div className="flex items-center gap-2 text-primary mb-2">
                        <Banknote size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest">INR Balance (₹)</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-[8px] text-text-muted font-bold block">TOTAL DR</label>
                           <span className="text-sm font-black text-primary">{totals.debitINR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-right">
                           <label className="text-[8px] text-text-muted font-bold block">TOTAL CR</label>
                           <span className="text-sm font-black text-danger">{totals.creditINR.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                     {!isBalancedINR && (
                        <div className="mt-2 pt-2 border-t border-danger/10 text-[9px] font-bold text-danger text-center">
                           DIFF: ₹{Math.abs(totals.debitINR - totals.creditINR).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                     )}
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${isBalancedGold ? 'bg-amber-500/5 border-amber-500/20' : 'bg-danger/5 border-danger/20'}`}>
                     <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Scale size={14} />
                        <span className="text-[8px] font-black uppercase tracking-widest">GOLD Balance (g)</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <label className="text-[8px] text-text-muted font-bold block">TOTAL DR</label>
                           <span className="text-sm font-black text-amber-600">{totals.debitGold.toFixed(3)}g</span>
                        </div>
                        <div className="text-right">
                           <label className="text-[8px] text-text-muted font-bold block">TOTAL CR</label>
                           <span className="text-sm font-black text-rose-500">{totals.creditGold.toFixed(3)}g</span>
                        </div>
                     </div>
                     {!isBalancedGold && (
                        <div className="mt-2 pt-2 border-t border-danger/10 text-[9px] font-bold text-danger text-center">
                           DIFF: {Math.abs(totals.debitGold - totals.creditGold).toFixed(3)}g
                        </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
               <div className="space-y-3">
                  <div className="bg-background/40 p-4 rounded-2xl border border-border/50 text-center">
                     <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Journal Status</p>
                     <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isBalanced ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {isBalanced ? (
                           <>
                              <CheckCircle2 size={12} />
                              Ready to Post
                           </>
                        ) : (
                           <>
                              <AlertTriangle size={12} />
                              Not Balanced
                           </>
                        )}
                     </div>
                  </div>
                  
                  <div className="text-[9px] text-text-muted text-center leading-relaxed">
                     A journal entry must be balanced in both currency and precious assets before it can be committed to the permanent ledger.
                  </div>
               </div>
            </div>
         </div>
      </aside>

      {/* Account Search Modal */}
      <AccountSearchModal 
        isOpen={!!showAccountModal}
        onClose={() => setShowAccountModal(null)}
        onSelect={(acc) => {
          if (showAccountModal) {
            updateLine(showAccountModal.activeLine, {
              accountId: acc.id,
              accountName: acc.name,
              accountCode: acc.code
            });
            setShowAccountModal(null);
            setTimeout(() => lineRefs.current[showAccountModal.activeLine]?.debitINR?.focus(), 100);
          }
        }}
        leafOnly={true}
      />

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => {
              setShowConfirm(false);
              setTimeout(() => saveRef.current?.focus(), 50);
           }} />
           <div 
             className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 outline-none"
             onKeyDown={(e) => {
               if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                 e.preventDefault();
                 if (document.activeElement === noRef.current) yesRef.current?.focus();
                 else noRef.current?.focus();
               } else if (e.key === 'Escape') {
                 setShowConfirm(false);
                 setTimeout(() => saveRef.current?.focus(), 50);
               }
             }}
           >
              <div className="flex flex-col items-center text-center gap-4">
                 <div className="h-16 w-16 bg-success/10 rounded-3xl flex items-center justify-center text-success mb-2">
                    <CheckCircle2 size={32} />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">{editJournalId ? 'Update' : 'Post'} Journal?</h3>
                 <p className="text-sm font-medium text-text-muted px-4">
                    You are about to commit <span className="font-bold text-text">{voucherNo}</span> to the ledger. This action will update all associated account balances.
                 </p>
                 <div className="flex gap-4 w-full mt-4">
                    <Button 
                      ref={noRef}
                      variant="ghost" 
                      onClick={() => {
                        setShowConfirm(false);
                        setTimeout(() => saveRef.current?.focus(), 50);
                      }}
                      className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest border border-border focus:ring-4 focus:ring-primary/20"
                    >
                      No, Review
                    </Button>
                    <Button 
                      ref={yesRef}
                      onClick={() => handleSubmit()}
                      className="flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-success/20 focus:ring-4 focus:ring-success/40"
                    >
                      Yes, {editJournalId ? 'Update' : 'Post'} Entry
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
