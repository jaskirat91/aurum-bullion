import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { BatchSearchModal } from '@/components/BatchSearchModal';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { 
  History, 
  Send, 
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Package,
  ArrowLeft,
  X,
  Save
} from 'lucide-react';

interface IssueMaterialFormProps {
  initialData?: any;
  editTransactionId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  active?: boolean;
}

export function IssueMaterialForm({ initialData, editTransactionId, onSuccess, onCancel, active }: IssueMaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showBatchSearch, setShowBatchSearch] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(initialData?.batch || null);

  // Refs for focus navigation
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const issueButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const [form, setForm] = useState({
    partyId: initialData?.partyId || '',
    partyName: initialData?.partyName || '',
    partyCode: initialData?.partyCode || '',
    batchId: initialData?.batchId || '',
    batchNo: initialData?.batchNo || '',
    batchDisplay: initialData?.batchDisplay || '',
    entryDate: initialData?.entryDate || new Date().toISOString().split('T')[0],
    // Weight fields (optional for issue, taken from receipt by default but can be overridden if editing)
    grossGoldWeight: initialData?.grossGoldWeight || '',
    lessWeight: initialData?.lessWeight || '',
  });

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => dateRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [active]);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  const handleReset = () => {
    setForm({
      partyId: '',
      partyName: '',
      partyCode: '',
      batchId: '',
      batchNo: '',
      batchDisplay: '',
      entryDate: new Date().toISOString().split('T')[0],
      grossGoldWeight: '',
      lessWeight: '',
    });
    setSelectedBatch(null);
    setAlert(null);
    setShowConfirm(false);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

  const handleBatchSelect = (batch: any) => {
    setSelectedBatch(batch);
    setForm(prev => ({
      ...prev,
      batchId: batch.id,
      batchNo: batch.batchNo,
      batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Unknown Item'}`
    }));
    setShowBatchSearch(false);
    setTimeout(() => issueButtonRef.current?.focus(), 100);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!form.partyId) {
      setAlert({ type: 'error', msg: 'Please select a Karigar.' });
      return;
    }
    if (!form.batchId) {
      setAlert({ type: 'error', msg: 'Please select a Batch to issue.' });
      return;
    }

    setShowConfirm(true);
  };

  const confirmIssue = async () => {
    setLoading(true);
    setAlert(null);
    try {
      // Get the primary transaction of the batch for weight details
      const primaryTrx = selectedBatch?.transactions?.find((t: any) => t.type === 'RECEIPT') || selectedBatch?.transactions?.[0] || {};
      
      const payload = {
        batchId: form.batchId,
        manufacturerPartyId: form.partyId,
        transactionDate: form.entryDate,
        grossGoldWeight: parseFloat(form.grossGoldWeight.toString()) || primaryTrx.grossGoldWeight || 0,
        lessWeight: parseFloat(form.lessWeight.toString()) || primaryTrx.lessWeight || 0,
        netWeight: primaryTrx.netWeight || 0,
        tenchPercentage: primaryTrx.tenchPercentage || 0,
        wastePercentage: primaryTrx.wastePercentage || 0,
        netPureGoldWeight: primaryTrx.netPureGoldWeight || 0
      };

      let res;
      if (editTransactionId) {
        res = await window.electronAPI.updateIssueRawMaterial(editTransactionId, payload);
      } else {
        res = await window.electronAPI.issueRawMaterial(payload);
      }

      if (res.success) {
        setAlert({ type: 'success', msg: `Batch ${form.batchNo} successfully ${editTransactionId ? 'updated' : 'issued to ' + form.partyName}.` });
        setShowConfirm(false);
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000);
        } else {
          setTimeout(() => handleReset(), 1500);
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

  return (
    <div 
      className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500 pt-4 px-8"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-border/40 shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Send size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter">{editTransactionId ? 'Edit Issue' : 'Issue Material'}</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Move goods to production (WIP)</p>
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
           <button onClick={onCancel} className="h-10 w-10 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface transition-all border border-transparent hover:border-border/40">
             <X size={20} />
           </button>
        </div>
      </div>

      {alert && <div className="mb-4 shrink-0"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Form */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-surface p-8 rounded-[2.5rem] border border-border/50 shadow-sm space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <PartySelect 
                inputRef={partyRef}
                className="h-14 bg-primary/5 border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold text-sm"
                label="Select Karigar"
                partyTypes={['KARIGAR']}
                value={form.partyId}
                displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                onChange={(id, code, name, type) => {
                  setForm(prev => ({ ...prev, partyId: id, partyCode: code, partyName: name }));
                }}
                onNext={() => batchRef.current?.focus()}
                required
              />

              <FormField label="Select Batch" required>
                <div className="relative">
                  <Input 
                    ref={batchRef}
                    value={form.batchDisplay}
                    readOnly
                    disabled={!!editTransactionId}
                    placeholder={editTransactionId ? "" : "Press Enter or F4 to search RECEIVED batches"}
                    onKeyDown={(e) => {
                      if (!editTransactionId && (e.key === 'Enter' || e.key === 'F4')) {
                        e.preventDefault();
                        setShowBatchSearch(true);
                      }
                    }}
                    onClick={() => !editTransactionId && setShowBatchSearch(true)}
                    className={`h-14 bg-primary/5 border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold text-sm pr-12 ${editTransactionId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  />
                  {!editTransactionId && <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={20} />}
                </div>
              </FormField>
            </div>

            <div className="flex gap-4 px-1 shrink-0">
              <Button 
                ref={issueButtonRef}
                onClick={handleSubmit}
                disabled={loading || !form.batchId || !form.partyId}
                className="flex-[3] h-14 text-lg font-black rounded-3xl shadow-lg shadow-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 focus:ring-primary/40 outline-none"
              >
                {loading ? <RotateCcw className="animate-spin mr-3" /> : (editTransactionId ? <Save className="mr-3" /> : <CheckCircle2 className="mr-3" />)}
                {loading ? 'Processing...' : editTransactionId ? 'Update Record (Enter)' : 'Save Issue (Enter)'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onCancel || handleReset}
                className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase"
              >
                {onCancel ? 'Cancel' : 'Reset'}
              </Button>
            </div>
          </div>

          {/* Batch Details View Only */}
          {selectedBatch ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
               <div className="bg-surface rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                  <div className="bg-primary/5 px-8 py-4 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="text-primary" size={20} />
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Original Batch Details</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase">Status: RECEIVED</span>
                  </div>
                  
                  <div className="p-8 grid grid-cols-4 gap-8">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Item Name</span>
                      <p className="text-lg font-black">{selectedBatch.item?.name || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Source Party</span>
                      <p className="text-lg font-black text-primary">{selectedBatch.party?.name || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Receipt Date</span>
                      <p className="text-lg font-black">{new Date(selectedBatch.transactions?.filter((trx: any) => trx.type === 'RECEIPT')?.[0]?.transactionDate || selectedBatch.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">Batch #</span>
                      <p className="text-lg font-mono font-black">{selectedBatch.batchNo}</p>
                    </div>
                  </div>

                  <div className="mx-8 mb-8 grid grid-cols-3 gap-4">
                     <div className="bg-background/50 p-6 rounded-3xl border border-border/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-text-muted uppercase mb-1">Gross Weight</span>
                        <span className="text-2xl font-black">{(selectedBatch.transactions?.[0]?.grossGoldWeight || 0).toFixed(3)}g</span>
                     </div>
                     <div className="bg-background/50 p-6 rounded-3xl border border-border/50 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-text-muted uppercase mb-1">Net Weight</span>
                        <span className="text-2xl font-black">{(selectedBatch.transactions?.[0]?.netWeight || 0).toFixed(3)}g</span>
                     </div>
                     <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[10px] font-black text-primary uppercase mb-1">Pure Weight</span>
                        <span className="text-2xl font-black text-primary">{(selectedBatch.transactions?.[0]?.netPureGoldWeight || 0).toFixed(3)}g</span>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20 border-2 border-dashed border-border rounded-[3rem]">
              <History size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.3em]">Select a batch to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Batch Search Modal */}
      {showBatchSearch && (
        <BatchSearchModal 
          status="RECEIVED"
          onSelect={handleBatchSelect}
          onClose={() => setShowBatchSearch(false)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">Confirm Material Issue</h3>
            <p className="text-text-muted font-bold mb-8">
              Are you sure you want to issue Batch <span className="text-primary font-black">#{form.batchNo}</span> to <span className="text-primary font-black">{form.partyName}</span>? 
              This will update the status to WIP.
            </p>
            <div 
              className="flex gap-4"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  cancelButtonRef.current?.focus();
                } else if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  confirmButtonRef.current?.focus();
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  if (document.activeElement === confirmButtonRef.current) {
                    cancelButtonRef.current?.focus();
                  } else {
                    confirmButtonRef.current?.focus();
                  }
                } else if (e.key === 'Escape') {
                  setShowConfirm(false);
                  setTimeout(() => issueButtonRef.current?.focus(), 100);
                }
              }}
            >
              <Button 
                ref={confirmButtonRef}
                className="flex-1 h-14 rounded-2xl font-black text-lg" 
                onClick={confirmIssue}
              >
                Confirm
              </Button>
              <Button 
                ref={cancelButtonRef}
                variant="ghost" 
                className="flex-1 h-14 bg-background border border-border rounded-2xl font-black text-lg text-text-muted"
                onClick={() => {
                  setShowConfirm(false);
                  setTimeout(() => issueButtonRef.current?.focus(), 100);
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
