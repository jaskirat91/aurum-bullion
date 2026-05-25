import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { ItemSelect } from '@/components/ItemSelect';
import { BatchSearchModal } from '@/components/BatchSearchModal';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { 
  Calendar, 
  Layers, 
  Scale,
  RotateCcw,
  CheckCircle2,
  Search,
  Tag,
  X
} from 'lucide-react';

interface ReceiveFinishedGoodsFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editBatchId?: string; // This is the Batch ID
  initialData?: any;
}

export function ReceiveFinishedGoodsForm({ onCancel, onSuccess, editBatchId, initialData }: ReceiveFinishedGoodsFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);
  const confirmOkRef = useRef<HTMLButtonElement>(null);

  // Focus Refs
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const itemRef = useRef<any>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

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

  const initialFormState = {
    batchNo: '', // This will hold the batch ID
    batchDisplay: '',
    batchStatus: '' as 'WIP' | 'COMPLETED' | '',
    entryDate: new Date().toISOString().split('T')[0],
    itemId: '',
    itemDisplay: '',
    partyId: '',
    partyCode: '',
    partyName: '',
    partyType: 'KARIGAR',
    grossGoldWeight: '' as string | number,
    lessWeight: '0' as string | number,
    tenchPercentage: 100.00,
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

  const [form, setForm] = useState(initialFormState);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setTimeout(() => dateRef.current?.focus(), 100);
    }
  }, [initialData]);

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

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => confirmCancelRef.current?.focus(), 100);
    }
  }, [showConfirm]);

  const num = (v: string | number) => typeof v === 'string' ? parseFloat(v) || 0 : v;

  const netWeight = Math.max(0, num(form.grossGoldWeight) - num(form.lessWeight));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const netPureGold = +(netWeight * (num(form.tenchPercentage) / 100) * (1 - num(form.wastePercentage) / 100)).toFixed(3);
  const totalLabourCharges = num(form.labourRate) * num(form.totalStones);
  const tagNetWeightVal = num(form.tagGrossWeight) - num(form.tagKundanWeight) - num(form.tagStoneWeight) - num(form.tagMottiWeight);
  const tagValue = `${num(form.tagGrossWeight).toFixed(3)} | ${num(form.tagKundanWeight).toFixed(3)} | ${num(form.tagMottiWeight).toFixed(3)} | ${num(form.tagStoneWeight).toFixed(3)} | ${tagNetWeightVal.toFixed(3)} | ${num(form.tagAmount).toFixed(2)}`;

  const populateFromBatch = (batch: any) => {
    if (batch.status === 'COMPLETED') {
      const receiptTrx = batch.transactions?.find((t: any) => t.type === 'RECEIVE_FROM_KARIGAR');
      if (receiptTrx) {
        setForm({
          ...form,
          batchNo: batch.id,
          batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Item'}`,
          batchStatus: 'COMPLETED',
          entryDate: receiptTrx.transactionDate || new Date().toISOString().split('T')[0],
          itemId: receiptTrx.finishedItemId || batch.itemId,
          itemDisplay: receiptTrx.finishedItem ? `${receiptTrx.finishedItem.code} - ${receiptTrx.finishedItem.name}` : '',
          partyId: receiptTrx.party?.id || '',
          partyCode: receiptTrx.party?.code || '',
          partyName: receiptTrx.party?.name || '',
          grossGoldWeight: receiptTrx.grossGoldWeight,
          lessWeight: receiptTrx.lessWeight,
          tenchPercentage: receiptTrx.tenchPercentage,
          wastePercentage: receiptTrx.wastePercentage,
          kundanWeight: receiptTrx.kundanWeight || 0,
          totalStones: receiptTrx.totalStones || 0,
          piroiWeight: receiptTrx.piroiWeight || 0,
          taarPattiWeight: receiptTrx.taarPattiWeight || 0,
          bStoneWeight: receiptTrx.bStoneWeight || 0,
          colorStoneWeight: receiptTrx.colorStoneWeight || 0,
          labourRate: receiptTrx.labourPerStone || 18,
          tagGrossWeight: receiptTrx.tagGrossWeight || 0,
          tagKundanWeight: receiptTrx.tagKundanWeight || 0,
          tagStoneWeight: receiptTrx.tagStoneWeight || 0,
          tagMottiWeight: receiptTrx.tagMottiWeight || 0,
          tagNetWeight: receiptTrx.tagNetWeight || 0,
          tagAmount: receiptTrx.tagAmount || 0,
        });
      }
    } else {
      const trx = batch.transactions?.[0];
      setForm({
        ...form,
        batchNo: batch.id,
        batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Item'} (${trx?.grossGoldWeight.toFixed(3)}g)`,
        batchStatus: batch.status,
        tenchPercentage: 100.00,
      });
    }
    setTimeout(() => kundanRef.current?.focus(), 100);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!form.partyId) { setAlert({ type: 'error', msg: 'Party selection is mandatory.' }); return; }
    if (!form.itemId) { setAlert({ type: 'error', msg: 'Item selection is mandatory.' }); return; }
    if (!form.batchNo) { setAlert({ type: 'error', msg: 'Batch selection is mandatory.' }); return; }

    if (num(form.grossGoldWeight) === 0) {
      setAlert({ type: 'error', msg: 'Gross weight cannot be zero.' });
      return;
    }

    if (form.batchStatus === 'COMPLETED' && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    setAlert(null);
    try {
      const payload = {
        batchId: form.batchNo,
        partyId: form.partyId,
        finishedItemId: form.itemId,
        transactionDate: form.entryDate,
        grossWeight: num(form.grossGoldWeight),
        netWeight,
        purityPercentage: num(form.tenchPercentage),
        labourCost: totalLabourCharges,
        grossWeightOfItems: num(form.grossGoldWeight),
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
        tagNetWeight: tagNetWeightVal,
        tagAmount: num(form.tagAmount),
        tagValue,
      };

      const result = form.batchStatus === 'COMPLETED' 
        ? await window.electronAPI.updateReceivedFinishedProduct(payload)
        : await window.electronAPI.receiveFinishedProduct(payload);

      if (result.success) {
        setAlert({ type: 'success', msg: `Record ${form.batchStatus === 'COMPLETED' ? 'updated' : 'saved'} successfully.` });
        setTimeout(() => onSuccess(), 800); 
      } else {
        setAlert({ type: 'error', msg: result.error });
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'System error.' });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter">{form.batchStatus === 'COMPLETED' ? 'Edit Finished Goods' : 'Receive Finished Goods'}</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Karigar Receipt</p>
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
                            value={form.entryDate}
                            max={new Date().toISOString().split('T')[0]}
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
                       label="Karigar"
                       value={form.partyId}
                       displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                       partyTypes={['KARIGAR']}
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
                       label="Finished Item"
                       value={form.itemId}
                       displayValue={form.itemDisplay}
                       categoryFilter={['FINISHED_GOOD']}
                       onChange={(id, display) => {
                         setForm(prev => ({...prev, itemId: id, itemDisplay: display}));
                       }}
                       onNext={() => batchRef.current?.focus()}
                       required
                     />
                  </div>
               </div>

                <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm relative overflow-visible">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                      <FormField label="Working Batch" required>
                         <div className="relative">
                           <Input 
                             ref={batchRef}
                             value={form.batchNo ? 'SELECTED' : ''} 
                             readOnly
                             onClick={() => setShowSearchModal(true)}
                             onKeyDown={(e) => (e.key === 'F4' || e.key === 'Enter') && (e.preventDefault(), setShowSearchModal(true))}
                             placeholder="Press Enter to select"
                             className="font-mono font-black text-primary bg-primary/5 border-primary/20 pr-10 h-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                           />
                           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 grayscale opacity-30 text-primary">
                              <Search size={14} />
                           </div>
                         </div>
                      </FormField>
                    </div>

                    <div className={`col-span-8 h-[74px] px-4 flex items-center justify-between rounded-2xl border-2 transition-all ${
                      form.batchNo ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-primary/5 border-primary/20'
                    }`}>
                       <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-black uppercase text-text-muted opacity-60">Selected Batch</span>
                          <span className="text-xs font-black truncate">
                             {form.batchDisplay || 'NO BATCH SELECTED'}
                          </span>
                       </div>
                       {form.batchStatus && (
                          <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            form.batchStatus === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-primary text-white animate-pulse'
                          }`}>
                            {form.batchStatus}
                          </div>
                        )}
                       {!form.batchNo && (
                          <span className="shrink-0 text-[8px] font-black text-primary animate-pulse">ENTER TO SELECT</span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm">
                      <div className="grid grid-cols-5 gap-3">
                        <FormField label="Kundan WT">
                          <Input ref={kundanRef} type="number" value={form.kundanWeight} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), totalStonesRef.current?.focus())}
                            onChange={e => setForm({...form, kundanWeight: e.target.value})}
                            className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </FormField>
                        <FormField label="No. of Stones">
                          <Input 
                            ref={totalStonesRef} type="number" value={form.totalStones}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), laborRateRef.current?.focus())}
                            onChange={e => setForm({...form, totalStones: e.target.value})}
                            className="font-black text-sm h-10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </FormField>
                        <FormField label="Labour Rate">
                          <Input 
                            ref={laborRateRef} type="number" value={form.labourRate}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), weightRef.current?.focus())}
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
                        <div className="flex flex-col justify-center px-4 bg-primary/5 rounded-xl border border-primary/10">
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">Eq. Cr Gold WT</span>
                          <div className="text-sm font-black text-primary">
                            {num(form.kundanWeight).toFixed(3)}g
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface p-4 rounded-3xl border border-border/50 shadow-sm">
                      <div className="grid grid-cols-5 gap-3">
                        <FormField label="Gross WT (g)" required>
                          <div className="relative">
                            <Input 
                              ref={weightRef}
                              type="number" step="0.001" placeholder="0.000"
                              value={form.grossGoldWeight}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  piroiRef.current?.focus();
                                }
                              }}
                              onChange={e => setForm({...form, grossGoldWeight: e.target.value})}
                              className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                            <Scale className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/10" size={14} />
                          </div>
                        </FormField>
                        <FormField label="Piroi WT">
                          <Input ref={piroiRef} type="number" value={form.piroiWeight} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), taarPattiRef.current?.focus())}
                            onChange={e => setForm({...form, piroiWeight: e.target.value})}
                            className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </FormField>
                        <FormField label="Taar-Patti WT">
                          <Input ref={taarPattiRef} type="number" value={form.taarPattiWeight} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), bStoneRef.current?.focus())}
                            onChange={e => setForm({...form, taarPattiWeight: e.target.value})}
                            className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </FormField>
                        <FormField label="Big Stone WT">
                          <Input ref={bStoneRef} type="number" value={form.bStoneWeight} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), colorStoneRef.current?.focus())}
                            onChange={e => setForm({...form, bStoneWeight: e.target.value})}
                            className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </FormField>
                        <FormField label="Color Stone WT">
                          <Input ref={colorStoneRef} type="number" value={form.colorStoneWeight} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagGrossRef.current?.focus())}
                            onChange={e => setForm({...form, colorStoneWeight: e.target.value})}
                            className="font-black h-10 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                        </FormField>
                      </div>
                    </div>
                    
                    <div className="relative bg-surface p-4 rounded-3xl border border-border/50 shadow-sm overflow-hidden group">
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
                            <Input ref={tagNetRef} type="number" step="0.001" value={tagNetWeightVal.toFixed(3)} readOnly 
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
                  {loading ? 'Processing...' : form.batchStatus === 'COMPLETED' ? 'Update Receipt (Enter)' : 'Save Receipt (Enter)'}
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

      {/* Search Modal */}
      {showSearchModal && (
        <BatchSearchModal 
          partyId={form.partyId}
          status={!form.partyId ? "COMPLETED" : "WIP"}
          onSelect={(b) => {
            populateFromBatch(b);
            setShowSearchModal(false);
          }}
          onClose={() => {
            setShowSearchModal(false);
          }}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => {
            setShowConfirm(false);
            setTimeout(() => saveRef.current?.focus(), 100);
          }} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <RotateCcw size={40} className="animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">Update Receipt?</h3>
                <p className="text-text-muted text-sm font-medium px-4">
                  You are about to modify an existing finished good receipt. This will update the ledger balances and stock records.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <Button 
                  ref={confirmCancelRef}
                  variant="ghost" 
                  onClick={() => {
                    setShowConfirm(false);
                    setTimeout(() => saveRef.current?.focus(), 100);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-surface border border-border font-bold uppercase tracking-wider text-xs"
                >
                  Cancel
                </Button>
                <Button 
                  ref={confirmOkRef}
                  onClick={() => {
                    setShowConfirm(false);
                    handleSubmit();
                  }}
                  className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                >
                  Confirm Update
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
