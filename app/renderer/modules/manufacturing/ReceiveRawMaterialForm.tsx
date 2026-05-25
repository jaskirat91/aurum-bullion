import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { ItemSelect } from '@/components/ItemSelect';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { 
  Calendar, 
  Layers, 
  Scale,
  RotateCcw,
  CheckCircle2,
  GitBranch,
  ArrowRightCircle,
  Search,
  X
} from 'lucide-react';

interface ReceiveRawMaterialFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editBatchId?: string;
  initialData?: any;
}

export function ReceiveRawMaterialForm({ onCancel, onSuccess, editBatchId, initialData }: ReceiveRawMaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // Focus Refs
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const itemRef = useRef<any>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const lessRef = useRef<HTMLInputElement>(null);
  const tenchRef = useRef<HTMLInputElement>(null);
  const wasteRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  const initialFormState = {
    batchNo: '',
    entryDate: new Date().toISOString().split('T')[0],
    itemId: '',
    itemDisplay: '',
    partyId: '',
    partyCode: '',
    partyName: '',
    partyType: 'MANUFACTURER',
    debitAccountId: '',
    debitAccountDisplay: '',
    grossGoldWeight: '' as string | number,
    lessWeight: '0' as string | number,
    tenchPercentage: 96.00 as string | number,
    wastePercentage: 0 as string | number,
  };

  const [form, setForm] = useState(initialFormState);
  const [defaultGoldLedger, setDefaultGoldLedger] = useState<{ id: string; name: string } | null>(null);

  const formatBatchNo = (weight: string | number, dateStr: string) => {
    if (!weight || parseFloat(weight.toString()) === 0) return '';
    const [year, month, day] = dateStr.split('-');
    return `${Number(weight).toFixed(3)}-${day}${month}${year}`;
  };

  useEffect(() => {
    const fetchCompanySettings = async () => {
      const res = await window.electronAPI.getCompanyInfo();
      if (res.success && res.data && res.data.defaultGoldLedgerId) {
        const defaultLedger = {
          id: res.data.defaultGoldLedgerId,
          name: res.data.defaultGoldLedgerName,
        };
        setDefaultGoldLedger(defaultLedger);
        
        setForm(prev => ({
          ...prev,
          debitAccountId: prev.debitAccountId || defaultLedger.id,
          debitAccountDisplay: prev.debitAccountDisplay || defaultLedger.name,
        }));
      }
    };
    fetchCompanySettings();

    if (initialData) {
      setForm(initialData);
    } else {
      setTimeout(() => dateRef.current?.focus(), 100);
    }
  }, [editBatchId, initialData]);

  useEffect(() => {
    if (showOverwriteConfirm && noButtonRef.current) {
      setTimeout(() => noButtonRef.current?.focus(), 100);
    }
  }, [showOverwriteConfirm]);

  useEffect(() => {
    let mounted = true;
    if (form.partyId) {
      window.electronAPI.getPartyBalances(form.partyId).then(res => {
        if (mounted && res.success) {
          setBalances(res.data);
        }
      });
    } else {
      setBalances(null);
    }
    return () => { mounted = false; };
  }, [form.partyId]);

  // Auto-generate batch number when weight or date changes
  useEffect(() => {
    if (form.grossGoldWeight) {
      const generated = formatBatchNo(form.grossGoldWeight, form.entryDate);
      setForm(prev => ({ ...prev, batchNo: generated }));
    }
  }, [form.grossGoldWeight, form.entryDate]);

  const num = (v: string | number) => typeof v === 'string' ? parseFloat(v) || 0 : v;

  const netWeight = Math.max(0, num(form.grossGoldWeight) - num(form.lessWeight));
  const netPureGold = +(netWeight * (num(form.tenchPercentage) / 100) * (1 - num(form.wastePercentage) / 100)).toFixed(3);

  const handleSubmit = async (e?: React.FormEvent, overwrite: boolean = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!form.partyId) { setAlert({ type: 'error', msg: 'Party selection is mandatory.' }); return; }
    if (!form.itemId) { setAlert({ type: 'error', msg: 'Item selection is mandatory.' }); return; }
    if (!form.debitAccountId) { setAlert({ type: 'error', msg: 'Debit Account is mandatory.' }); return; }

    if (num(form.grossGoldWeight) === 0) {
      setAlert({ type: 'error', msg: 'Gross weight cannot be zero.' });
      return;
    }
    if (netWeight === 0) {
      setAlert({ type: 'error', msg: 'Net weight cannot be zero.' });
      return;
    }

    setLoading(true);
    setAlert(null);
    try {
      const result = await window.electronAPI.receiveRawMaterial({
        batchId: editBatchId,
        batchNo: form.batchNo,
        itemId: form.itemId,
        partyId: form.partyId,
        debitAccountId: form.debitAccountId,
        transactionDate: form.entryDate,
        overwrite,
        weights: {
          grossGoldWeight: num(form.grossGoldWeight),
          lessWeight: num(form.lessWeight),
          netWeight,
          tenchPercentage: num(form.tenchPercentage),
          wastePercentage: num(form.wastePercentage),
          netPureGoldWeight: netPureGold,
        },
      });

      if (result.success) {
        setAlert({ type: 'success', msg: editBatchId || overwrite ? `Record saved successfully.` : `Batch ${form.batchNo} saved.` });
        setShowOverwriteConfirm(false);
        setTimeout(() => onSuccess(), 800); 
      } else {
        if (result.error && result.error.includes('already exists') && !overwrite) {
          setShowOverwriteConfirm(true);
        } else {
          setShowOverwriteConfirm(false);
          setAlert({ type: 'error', msg: result.error });
        }
      }
    } catch (err) {
      setShowOverwriteConfirm(false);
      setAlert({ type: 'error', msg: 'System error.' });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter">{editBatchId ? 'Edit Raw Material' : 'Receive Raw Material'}</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Manufacturing Receipt</p>
          </div>
        </div>
        <button onClick={onCancel} className="h-10 w-10 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface transition-all border border-transparent hover:border-border/40">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden p-8 pt-4">
        <div className="flex-1 space-y-4 overflow-hidden flex flex-col pt-2">
          {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex-1 space-y-4 overflow-y-auto px-1 custom-scrollbar pr-2">
                <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm">
                  <div className="grid grid-cols-3 gap-4">
                     <div className="flex flex-col items-start shrink-0">
                       <span className="text-[9px] font-black uppercase text-text-muted opacity-60 mb-1">Entry Date</span>
                       <div className="relative w-full group">
                         <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary opacity-60" size={14} />
                         <input 
                            ref={dateRef}
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={form.entryDate}                    
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                partyRef.current?.focus();
                              }
                            }}
                            onChange={e => setForm({...form, entryDate: e.target.value})}
                            className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-2 w-full font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm outline-none"
                         />
                       </div>
                     </div>

                     <PartySelect 
                       inputRef={partyRef}
                       label="Manufacturer"
                       value={form.partyId}
                       displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                       partyTypes={['MANUFACTURER']}
                       onChange={(id, code, name, type) => {
                         setForm(prev => ({
                           ...prev, 
                           partyId: id, 
                           partyCode: code, 
                           partyName: name, 
                           partyType: type,
                         }));
                       }}
                       onNext={() => itemRef.current?.focus()}
                       required
                     />
                     <ItemSelect 
                       inputRef={itemRef}
                       label="Item"
                       value={form.itemId}
                       displayValue={form.itemDisplay}
                       categoryFilter={['RAW_MATERIAL']}
                       onChange={(id, display) => {
                         setForm(prev => ({...prev, itemId: id, itemDisplay: display}));
                       }}
                       onNext={() => weightRef.current?.focus()}
                       required
                     />
                  </div>
               </div>

                <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm relative overflow-visible">
                  <div className="grid grid-cols-5 gap-4">
                     <FormField label="Gross WT (g)" required>
                       <div className="relative">
                         <Input 
                           ref={weightRef}
                           type="number" step="0.001" placeholder="0.000"
                           value={form.grossGoldWeight}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') {
                               e.preventDefault();
                               batchRef.current?.focus();
                             }
                           }}
                           onChange={e => setForm({...form, grossGoldWeight: e.target.value})}
                           className="text-lg h-12 font-black border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                         />
                         <Scale className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/10" size={18} />
                       </div>
                     </FormField>

                     <FormField label="Batch No" required>
                         <div className="relative">
                           <Input 
                             ref={batchRef}
                             value={form.batchNo} 
                             onChange={(e) => setForm({...form, batchNo: e.target.value})} 
                             onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), lessRef.current?.focus())}
                             className="font-mono font-black text-primary bg-primary/5 border-primary/20 pr-10 h-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                           />
                         </div>
                     </FormField>

                     <FormField label="Less WT (g)">
                       <Input 
                         ref={lessRef}
                         type="number" step="0.001" placeholder="0.000"
                         value={form.lessWeight}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             tenchRef.current?.focus();
                           }
                         }}
                         onChange={e => setForm({...form, lessWeight: e.target.value})}
                         className="text-lg h-12 font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 bg-danger/[0.01] outline-none"
                       />
                     </FormField>

                     <FormField label="Tench %" required>
                       <Input 
                         ref={tenchRef}
                         type="number" step="0.01" value={form.tenchPercentage}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             wasteRef.current?.focus();
                           }
                         }}
                         onChange={e => setForm({...form, tenchPercentage: parseFloat(e.target.value) || 0})}
                         className="font-black h-12 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </FormField>

                     <FormField label="Waste %">
                       <Input 
                         ref={wasteRef}
                         type="number" step="0.01" value={form.wastePercentage}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                             e.preventDefault();
                             saveRef.current?.focus();
                           }
                         }}
                         onChange={e => setForm({...form, wastePercentage: parseFloat(e.target.value) || 0})}
                         className="font-black h-12 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </FormField>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/40 p-4 rounded-3xl border border-border flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-text-muted/10 rounded-xl flex items-center justify-center text-text-muted">
                           <ArrowRightCircle size={20} />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-text-muted/50 uppercase tracking-widest block">
                             NET WT
                           </span>
                           <span className="text-xl font-black tracking-tight">{netWeight.toFixed(3)}g</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-3xl border-2 border-primary/20 flex items-center justify-between shadow-lg shadow-primary/5">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-md shadow-primary/20">
                           <Scale size={20} />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-primary uppercase tracking-widest block">
                             PURE GOLD WT
                           </span>
                           <span className="text-2xl font-black tracking-tight text-primary">
                              {netPureGold.toFixed(3)}
                           </span>
                           <span className="ml-1 text-[10px] font-black text-text-muted/40 uppercase">grams</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                 <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1">Stock Account (Dr)</span>
                 <div className="text-sm font-black text-text italic truncate">
                   {form.debitAccountDisplay || 'Loading...'}
                 </div>
               </div>
            </div>

            <div className="flex gap-4 px-1 shrink-0">
                <Button 
                  ref={saveRef}
                  type="submit"
                  disabled={loading}
                  className="flex-[3] h-14 text-lg font-black rounded-3xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-primary/40 outline-none"
                >
                  {loading ? (
                    <RotateCcw className="animate-spin mr-3" size={24} />
                  ) : (
                    <CheckCircle2 size={24} className="mr-3" />
                  )}
                  {loading ? 'Processing...' : editBatchId ? 'Update Record (Enter)' : 'Save Form (Enter)'}
                </Button>
               <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase">
                  Cancel
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
      </div>

      {/* Overwrite Confirmation Modal */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowOverwriteConfirm(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-warning">
                  <GitBranch size={24} />
                  <h3 className="text-lg font-black">Batch Already Exists</h3>
                </div>
                <p className="text-sm font-medium text-text-muted">
                  The batch number <span className="font-bold text-primary">{form.batchNo}</span> already exists. Do you want to update the details of the existing batch?
                </p>
                <div 
                  className="flex gap-3 mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      yesButtonRef.current?.focus();
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      noButtonRef.current?.focus();
                    } else if (e.key === 'Escape') {
                      setShowOverwriteConfirm(false);
                      setTimeout(() => saveRef.current?.focus(), 100);
                    }
                  }}
                >
                   <Button 
                      ref={noButtonRef}
                      onClick={() => {
                        setShowOverwriteConfirm(false);
                        setTimeout(() => saveRef.current?.focus(), 100);
                      }} 
                      variant="ghost" 
                      className="flex-1 bg-surface border border-border hover:bg-danger/5 hover:text-danger focus:ring-4 focus:ring-danger/20 focus:border-danger"
                   >
                      No, Discard
                   </Button>
                   <Button 
                      ref={yesButtonRef}
                      onClick={() => handleSubmit(undefined, true)} 
                      className="flex-1 focus:ring-4 focus:ring-primary/40 focus:border-white"
                   >
                      Yes, Update
                   </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
