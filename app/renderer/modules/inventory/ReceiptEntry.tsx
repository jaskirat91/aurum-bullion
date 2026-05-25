import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { ItemSelect } from '@/components/ItemSelect';
import { AccountSelect } from '@/components/AccountSelect';
import { BatchSearchModal } from '@/components/BatchSearchModal';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { 
  History, 
  Wallet, 
  ArrowRightCircle, 
  Calendar, 
  Layers, 
  Calculator,
  Search,
  Scale,
  RotateCcw,
  CheckCircle2,
  GitBranch,
  TrendingUp,
  TrendingDown,
  Tag
} from 'lucide-react';

export function ReceiptEntry({ active }: { active?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  // Focus Refs
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const itemRef = useRef<any>(null);
  const accountRef = useRef<any>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const lessRef = useRef<HTMLInputElement>(null);
  const tenchRef = useRef<HTMLInputElement>(null);
  const wasteRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);

  // Karigar Persistence Refs
  const kundanRef = useRef<HTMLInputElement>(null);
  const totalStonesRef = useRef<HTMLInputElement>(null);
  const piroiRef = useRef<HTMLInputElement>(null);
  const taarPattiRef = useRef<HTMLInputElement>(null);
  const bStoneRef = useRef<HTMLInputElement>(null);
  const colorStoneRef = useRef<HTMLInputElement>(null);
  const laborRateRef = useRef<HTMLInputElement>(null);

  // Tag Refs
  const tagGrossRef = useRef<HTMLInputElement>(null);
  const tagKundanRef = useRef<HTMLInputElement>(null);
  const tagMottiRef = useRef<HTMLInputElement>(null);
  const tagStoneRef = useRef<HTMLInputElement>(null);
  const tagNetRef = useRef<HTMLInputElement>(null);
  const tagAmountRef = useRef<HTMLInputElement>(null);

  const initialForm = {
    batchNo: '',
    entryDate: new Date().toISOString().split('T')[0],
    itemId: '',
    itemDisplay: '',
    partyId: '',
    partyCode: '',
    partyName: '',
    partyType: '' as string,
    batchDisplay: '', // New field for user-friendly batch info
    debitAccountId: '',
    debitAccountDisplay: '',
    grossGoldWeight: '' as string | number,
    lessWeight: '0' as string | number,
    tenchPercentage: 96.00,
    wastePercentage: 0,

    // Karigar specific
    kundanWeight: '0' as string | number,
    totalStones: '0' as string | number,
    piroiWeight: '0' as string | number,
    taarPattiWeight: '0' as string | number,
    bStoneWeight: '0' as string | number,
    colorStoneWeight: '0' as string | number,
    labourRate: '18' as string | number,

    // Tag specific
    tagGrossWeight: '0' as string | number,
    tagKundanWeight: '0' as string | number,
    tagMottiWeight: '0' as string | number,
    tagStoneWeight: '0' as string | number,
    tagNetWeight: '0' as string | number,
    tagAmount: '0' as string | number,
  };

  const [form, setForm] = useState(initialForm);
  const [defaultGoldLedger, setDefaultGoldLedger] = useState<{ id: string; name: string } | null>(null);

  const formatBatchNo = (weight: string | number, dateStr: string) => {
    if (!weight || parseFloat(weight.toString()) === 0) return '';
    const [year, month, day] = dateStr.split('-');
    return `${weight}-${day}${month}${year}`;
  };

  const handleReset = () => {
    setForm({
      ...initialForm,
      debitAccountId: defaultGoldLedger?.id || '',
      debitAccountDisplay: defaultGoldLedger?.name || '',
    });
    setBalances(null);
    setAlert(null);
    setTimeout(() => dateRef.current?.focus(), 50);
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
          debitAccountId: defaultLedger.id,
          debitAccountDisplay: defaultLedger.name,
        }));
      }
    };
    fetchCompanySettings();

    if (active) {
      const focusTimer = setTimeout(() => {
        if (dateRef.current) {
          dateRef.current.focus();
        }
      }, 350);
      return () => clearTimeout(focusTimer);
    }
  }, [active]);

  useEffect(() => {
    if (showOverwriteConfirm && noButtonRef.current) {
      setTimeout(() => noButtonRef.current?.focus(), 100);
    }
  }, [showOverwriteConfirm]);

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

  useEffect(() => {
    if (form.grossGoldWeight && form.partyType !== 'KARIGAR') {
      const generated = formatBatchNo(form.grossGoldWeight, form.entryDate);
      setForm(prev => ({ ...prev, batchNo: generated }));
    }
  }, [form.grossGoldWeight, form.entryDate, form.partyType]);

  const num = (v: string | number) => typeof v === 'string' ? parseFloat(v) || 0 : v;

  const netWeight = Math.max(0, num(form.grossGoldWeight) - num(form.lessWeight));
  const netPureGold = +(netWeight * (num(form.tenchPercentage) / 100) * (1 - num(form.wastePercentage) / 100)).toFixed(3);
  const totalLabourCharges = num(form.labourRate) * num(form.totalStones);
  const tagNetWeight = num(form.tagGrossWeight) - num(form.tagKundanWeight) - num(form.tagStoneWeight) - num(form.tagMottiWeight);
  const tagValue = `${num(form.tagGrossWeight).toFixed(3)} | ${num(form.tagKundanWeight).toFixed(3)} | ${num(form.tagMottiWeight).toFixed(3)} | ${num(form.tagStoneWeight).toFixed(3)} | ${tagNetWeight.toFixed(3)} | ${num(form.tagAmount).toFixed(2)}`;


  const populateFromBatch = (batch: any) => {
    const trx = batch.transactions?.[0];
    if (form.partyType === 'KARIGAR') {
      // For Karigar, we just need the batch reference
      setForm({
        ...form,
        batchNo: batch.id, // Using ID as reference for Karigar receipt
        batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Item'} (${trx?.grossGoldWeight.toFixed(3)}g)`,
        tenchPercentage: 100.00,
      });
      setTimeout(() => totalStonesRef.current?.focus(), 100);
    } else {
      if (!trx) return;
      setForm({
        ...form,
        batchNo: batch.batchNo,
        entryDate: trx.transactionDate || new Date(batch.createdAt).toISOString().split('T')[0],
        itemId: batch.itemId,
        itemDisplay: batch.item ? `${batch.item.code} - ${batch.item.name}` : '',
        partyId: batch.sourcePartyId,
        partyCode: batch.party?.code || '',
        partyName: batch.party?.name || '',
        grossGoldWeight: trx.grossGoldWeight,
        lessWeight: trx.lessWeight,
        tenchPercentage: trx.tenchPercentage,
        wastePercentage: trx.wastePercentage,
      });
    }
  };

  const handleBatchShortcut = async (e: React.KeyboardEvent) => {
    if (e.key === 'F4') {
      e.preventDefault();
      setShowSearchModal(true);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!form.batchNo || form.partyType === 'KARIGAR') {
        setShowSearchModal(true);
      } else {
        const res = await window.electronAPI.getBatchDetails(form.batchNo);        
        if (res.success && res.data) {
           populateFromBatch(res.data);
        }
        lessRef.current?.focus();
      }
    }
  };

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
      let result;
      if (form.partyType === 'KARIGAR') {
        result = await window.electronAPI.receiveFinishedProduct({
          batchId: form.batchNo, // Note: For Karigar, batchNo field in UI holds the batchId
          partyId: form.partyId,
          finishedItemId: form.itemId,
          transactionDate: form.entryDate,
          grossWeight: num(form.grossGoldWeight),
          netWeight,
          purityPercentage: num(form.tenchPercentage),
          labourCost: totalLabourCharges,
          grossWeightOfItems: num(form.grossGoldWeight), // Assuming grossWeightOfItems is same as grossGoldWeight for this form
          totalStones: num(form.totalStones),
          piroiWeight: num(form.piroiWeight),
          taarPattiWeight: num(form.taarPattiWeight),
          bStoneWeight: num(form.bStoneWeight),
          colorStoneWeight: num(form.colorStoneWeight),
          kundanWeight: num(form.kundanWeight),
          labourRatePerStone: num(form.labourRate),
          tagGrossWeight: num(form.tagGrossWeight),
          tagKundanWeight: num(form.tagKundanWeight),
          tagStoneWeight: num(form.tagStoneWeight),
          tagMottiWeight: num(form.tagMottiWeight),
          tagNetWeight,
          tagAmount: num(form.tagAmount),
          tagValue,
        });
      } else {
        result = await window.electronAPI.receiveRawMaterial({
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
      }

      if (result.success) {
        setAlert({ type: 'success', msg: (overwrite || form.partyType === 'KARIGAR') ? `Record saved successfully.` : `Batch ${form.batchNo} saved.` });
        setShowOverwriteConfirm(false);
        setTimeout(() => handleReset(), 500); 
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
    <div className="max-w-7xl mx-auto flex gap-4 h-full overflow-hidden animate-in fade-in duration-500 p-8 pt-2">
      <div className="flex-1 space-y-4 overflow-hidden flex flex-col pt-2">
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">Receipt Entry</h2>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Receive Raw/Finished Goods</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
             
             {/* Row 1: Accounts and Items */}
              <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                   <PartySelect 
                     inputRef={partyRef}
                     label="Party"
                     value={form.partyId}
                     displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                     onChange={(id, code, name, type) => {
                       setForm({
                         ...initialForm, 
                         entryDate: form.entryDate, // Keep current date
                         partyId: id, 
                         partyCode: code, 
                         partyName: name, 
                         partyType: type,
                         debitAccountId: defaultGoldLedger?.id || '',
                         debitAccountDisplay: defaultGoldLedger?.name || '',
                       });
                     }}
                     onNext={() => itemRef.current?.focus()}
                     partyTypes={['MANUFACTURER', 'KARIGAR']}
                     required
                   />
                   <ItemSelect 
                     inputRef={itemRef}
                     label="Item"
                     value={form.itemId}
                     displayValue={form.itemDisplay}
                     categoryFilter={form.partyType === 'KARIGAR' ? ['FINISHED_GOOD'] : (form.partyType === 'MANUFACTURER' ? ['RAW_MATERIAL'] : [])}
                     onChange={(id, display) => {
                       setForm({...form, itemId: id, itemDisplay: display});
                     }}
                     onNext={() => weightRef.current?.focus()}
                     required
                   />
                   <div className="flex flex-col justify-center px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                     <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1">Stock Account (Dr)</span>
                     <div className="text-sm font-black text-text italic truncate">
                       {form.debitAccountDisplay || 'Loading...'}
                     </div>
                   </div>
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
                          value={form.partyType === 'KARIGAR' ? (form.batchNo ? 'SELECTED' : '') : form.batchNo} 
                          readOnly={form.partyType === 'KARIGAR'}
                          onChange={(e) => setForm({...form, batchNo: e.target.value})} 
                          onKeyDown={handleBatchShortcut}
                          placeholder={form.partyType === 'KARIGAR' ? 'Press Enter to select' : ''}
                          className="font-mono font-black text-primary bg-primary/5 border-primary/20 pr-10 h-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 grayscale opacity-30 text-primary">
                           <Search size={14} />
                        </div>
                      </div>
                   </FormField>

                   {form.partyType !== 'KARIGAR' && (
                     <>
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
                     </>
                   )}

                   {form.partyType === 'KARIGAR' && (
                     <div className="col-span-3 mt-4">
                        <div className="grid grid-cols-12 gap-3">
                           <div className={`col-span-6 h-14 px-4 flex items-center justify-between rounded-2xl border-2 transition-all ${
                             form.batchNo ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-primary/5 border-primary/20'
                           }`}>
                              <div className="flex flex-col min-w-0">
                                 <span className="text-[8px] font-black uppercase text-text-muted opacity-60">Working Batch</span>
                                 <span className="text-xs font-black truncate">
                                    {form.batchDisplay || 'NO BATCH SELECTED'}
                                 </span>
                              </div>
                              {form.batchNo ? (
                                 <></>
                              ) : (
                                 <span className="shrink-0 text-[8px] font-black text-primary animate-pulse">ENTER TO SELECT</span>
                              )}
                           </div>

                           <div className="col-span-3 h-14 px-4 flex flex-col justify-center rounded-2xl border border-border bg-background/40">
                              <span className="text-[8px] font-black uppercase text-text-muted/60 tracking-wider">NET KN WT</span>
                              <span className="text-sm font-black text-text-primary mt-0.5">{netWeight.toFixed(3)}g</span>
                           </div>

                           <div className="col-span-3 h-14 px-4 flex flex-col justify-center rounded-2xl border border-primary/20 bg-primary/5">
                              <span className="text-[8px] font-black uppercase text-primary tracking-wider">EQ. GOLD WT</span>
                              <span className="text-sm font-black text-primary mt-0.5">{netPureGold.toFixed(3)}g</span>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             {form.partyType === 'KARIGAR' && (
               <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="bg-surface p-3 rounded-2xl border border-border/50 shadow-sm">
                    <div className="grid grid-cols-3 gap-3">
                      <FormField label="No. of Stones">
                        <Input 
                          ref={totalStonesRef} type="number" value={form.totalStones}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              laborRateRef.current?.focus();
                            }
                          }}
                          onChange={e => setForm({...form, totalStones: e.target.value})}
                          className="font-black text-sm h-10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </FormField>
                      <FormField label="Labour Rate (per stone)">
                        <Input 
                          ref={laborRateRef} type="number" value={form.labourRate}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              kundanRef.current?.focus();
                            }
                          }}
                          onChange={e => setForm({...form, labourRate: e.target.value})}
                          className="font-black text-sm h-10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </FormField>
                      <div className="flex flex-col justify-center px-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Labour Charges</span>
                        <div className="text-sm font-black text-emerald-600">
                          ₹ {totalLabourCharges.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm">
                    <div className="grid grid-cols-5 gap-3">
                      <FormField label="Kundan WT">
                        <Input ref={kundanRef} type="number" value={form.kundanWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), piroiRef.current?.focus())}
                          onChange={e => setForm({...form, kundanWeight: e.target.value})}
                          className="font-black h-10 text-sm" />
                      </FormField>
                      <FormField label="Piroi WT">
                        <Input ref={piroiRef} type="number" value={form.piroiWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), taarPattiRef.current?.focus())}
                          onChange={e => setForm({...form, piroiWeight: e.target.value})}
                          className="font-black h-10 text-sm" />
                      </FormField>
                      <FormField label="Taar-Patti WT">
                        <Input ref={taarPattiRef} type="number" value={form.taarPattiWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), bStoneRef.current?.focus())}
                          onChange={e => setForm({...form, taarPattiWeight: e.target.value})}
                          className="font-black h-10 text-sm" />
                      </FormField>
                      <FormField label="Big Stone WT">
                        <Input ref={bStoneRef} type="number" value={form.bStoneWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), colorStoneRef.current?.focus())}
                          onChange={e => setForm({...form, bStoneWeight: e.target.value})}
                          className="font-black h-10 text-sm" />
                      </FormField>
                      <FormField label="Color Stone WT">
                        <Input ref={colorStoneRef} type="number" value={form.colorStoneWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagGrossRef.current?.focus())}
                          onChange={e => setForm({...form, colorStoneWeight: e.target.value})}
                          className="font-black h-10 text-sm" />
                      </FormField>
                    </div>
                  </div>
                  
                  <div className="relative bg-surface p-4 rounded-3xl border border-border/50 shadow-sm overflow-hidden group">
                    {/* Decorative accent */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Tag size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-primary uppercase tracking-wider">Tag Specification</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-background/50 border border-border px-3 py-1.5 rounded-xl shadow-inner">
                         <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-tighter mr-2">Preview:</span>
                         <span className="text-[10px] font-mono font-black text-primary">{tagValue}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-3">
                      <FormField label="Tag Gross WT">
                        <Input ref={tagGrossRef} type="number" value={form.tagGrossWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagKundanRef.current?.focus())}
                          onChange={e => setForm({...form, tagGrossWeight: e.target.value})}
                          className="font-black h-9 text-xs" />
                      </FormField>
                      <FormField label="Tag KN WT">
                        <Input ref={tagKundanRef} type="number" value={form.tagKundanWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagStoneRef.current?.focus())}
                          onChange={e => setForm({...form, tagKundanWeight: e.target.value})}
                          className="font-black h-9 text-xs" />
                      </FormField>
                      <FormField label="Tag Stone WT">
                        <Input ref={tagStoneRef} type="number" value={form.tagStoneWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagMottiRef.current?.focus())}
                          onChange={e => setForm({...form, tagStoneWeight: e.target.value})}
                          className="font-black h-9 text-xs" />
                      </FormField>
                      <FormField label="Tag Motti WT">
                        <Input ref={tagMottiRef} type="number" value={form.tagMottiWeight} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagNetRef.current?.focus())}
                          onChange={e => setForm({...form, tagMottiWeight: e.target.value})}
                          className="font-black h-9 text-xs" />
                      </FormField>
                      <FormField label="Tag Net WT">
                          <Input ref={tagNetRef} type="number" step="0.001" value={tagNetWeight.toFixed(3)} readOnly 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagAmountRef.current?.focus())}
                          className="font-black h-9 text-xs bg-muted/50 cursor-not-allowed" />
                      </FormField>
                      <FormField label="Tag Amount">
                        <Input ref={tagAmountRef} type="number" value={form.tagAmount} 
                           onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveRef.current?.focus())}
                          onChange={e => setForm({...form, tagAmount: e.target.value})}
                          className="font-black h-9 text-xs" />
                      </FormField>
                    </div>
                  </div>
               </div>
             )}

             {form.partyType !== 'KARIGAR' && (
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/40 p-4 rounded-3xl border border-border flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-text-muted/10 rounded-xl flex items-center justify-center text-text-muted">
                           <ArrowRightCircle size={20} />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-text-muted/50 uppercase tracking-widest block">
                             {form.partyType === 'KARIGAR' ? 'NET KN WT' : 'NET WT'}
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
                             {form.partyType === 'KARIGAR' ? 'EQ. GOLD WT' : 'PURE GOLD WT'}
                           </span>
                           <span className="text-2xl font-black tracking-tight text-primary">
                              {netPureGold.toFixed(3)}
                           </span>
                           <span className="ml-1 text-[10px] font-black text-text-muted/40 uppercase">grams</span>
                        </div>
                     </div>
                  </div>
               </div>
             )}
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
                {loading ? 'Processing...' : 'Save Form (Enter)'}
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

      {/* Search Modal */}
      {showSearchModal && (
        <BatchSearchModal 
          partyId={form.partyId}
          onSelect={(b) => {
            populateFromBatch(b);
            setShowSearchModal(false);
            setTimeout(() => batchRef.current?.focus(), 100);
          }}
          onClose={() => {
            setShowSearchModal(false);
            setTimeout(() => batchRef.current?.focus(), 100);
          }}
        />
      )}

      {/* Overwrite Confirmation Modal */}
      {showOverwriteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
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
                    } else if (e.key === 'Tab') {
                      e.preventDefault(); // Trap focus within these two
                      if (document.activeElement === noButtonRef.current) {
                        yesButtonRef.current?.focus();
                      } else {
                        noButtonRef.current?.focus();
                      }
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
