import React, { useState, useEffect, useRef } from 'react';
import { ItemSelect } from '@/components/ItemSelect';
import {
  Package, X, CheckCircle2, XCircle, Tag,
  Weight, Percent, IndianRupee, History,
} from 'lucide-react';
import type { LineItem } from './LineItemDialog';

interface OldItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: LineItem) => void;
  initialData?: LineItem | null;
}

export function OldItemDialog({ isOpen, onClose, onSave, initialData }: OldItemDialogProps) {
  const [finishedItemId, setFinishedItemId] = useState('');
  const [itemDisplay, setItemDisplay] = useState('');

  // Tag specs
  const [tagGrossWeight, setTagGrossWeight] = useState(0);
  const [tagKundanWeight, setTagKundanWeight] = useState(0);
  const [tagStoneWeight, setTagStoneWeight] = useState(0);
  const [tagMottiWeight, setTagMottiWeight] = useState(0);
  const [tagNetWeight, setTagNetWeight] = useState(0);
  const [tagAmount, setTagAmount] = useState(0);

  // Billing
  const [purity, setPurity] = useState(100);
  const [labourPct, setLabourPct] = useState(100);

  const itemRef = useRef<any>(null);
  const grossRef = useRef<HTMLInputElement>(null);
  const kundanRef = useRef<HTMLInputElement>(null);
  const stoneRef = useRef<HTMLInputElement>(null);
  const mottiRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const purityRef = useRef<HTMLInputElement>(null);
  const labourRef = useRef<HTMLInputElement>(null);

  // Auto-calc tag net weight
  useEffect(() => {
    const net = Math.max(0, tagGrossWeight - tagKundanWeight - tagStoneWeight - tagMottiWeight);
    setTagNetWeight(+net.toFixed(3));
  }, [tagGrossWeight, tagKundanWeight, tagStoneWeight, tagMottiWeight]);

  // Populate when editing
  useEffect(() => {
    if (isOpen) {
      if (initialData?.isOldItem) {
        setFinishedItemId(''); // ItemSelect controlled by display only
        setItemDisplay(initialData.oldItemName ?? initialData.itemName);
        setTagGrossWeight(initialData.tagGrossWeight ?? 0);
        setTagKundanWeight(initialData.tagKundanWeight ?? 0);
        setTagStoneWeight(initialData.tagStoneWeight ?? 0);
        setTagMottiWeight(initialData.tagMottiWeight ?? 0);
        setTagNetWeight(initialData.tagNetWeight ?? 0);
        setTagAmount(initialData.tagAmount ?? 0);
        setPurity(initialData.purityPercentage ?? 100);
        setLabourPct(initialData.labourPercentage ?? 100);
      } else {
        // Reset for new entry
        setFinishedItemId('');
        setItemDisplay('');
        setTagGrossWeight(0);
        setTagKundanWeight(0);
        setTagStoneWeight(0);
        setTagMottiWeight(0);
        setTagNetWeight(0);
        setTagAmount(0);
        setPurity(100);
        setLabourPct(100);
        setTimeout(() => itemRef.current?.focus(), 150);
      }
    }
  }, [isOpen, initialData]);

  const goldWeight = +((purity / 100) * tagNetWeight).toFixed(3);
  const labourAmount = +((labourPct / 100) * tagAmount).toFixed(2);

  // generated tag string (same format as FinishedStock)
  const generatedTag = finishedItemId || itemDisplay
    ? `${tagGrossWeight.toFixed(3)} | ${tagKundanWeight.toFixed(3)} | ${tagMottiWeight.toFixed(3)} | ${tagStoneWeight.toFixed(3)} | ${tagNetWeight.toFixed(3)} | ${tagAmount.toFixed(2)}`
    : '';

  const handleSave = () => {
    if (!finishedItemId && !itemDisplay) return;

    const itemName = itemDisplay || 'Unknown Item';
    const tag = generatedTag || `OLD-${itemName}`;

    onSave({
      productId: '',             // no system product
      tag,
      itemName,
      purityPercentage: purity,
      goldWeight,
      labourPercentage: labourPct,
      labourAmount,
      tagNetWeight,
      tagAmount,
      isOldItem: true,
      oldItemName: itemName,
      oldItemTag: tag,
      tagGrossWeight,
      tagKundanWeight,
      tagStoneWeight,
      tagMottiWeight,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') { e.preventDefault(); nextRef.current?.focus(); }
  };

  if (!isOpen) return null;

  const canSave = (finishedItemId || itemDisplay) && tagNetWeight > 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <History size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-text">
                {initialData ? 'Edit Old Item' : 'Add Old Item'}
              </h3>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                Item not previously sold through this system
              </p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Finished Item Select */}
          <div>
            <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
              <Package size={10} /> Finished Item <span className="text-danger">*</span>
            </label>
            <ItemSelect
              label=""
              value={finishedItemId}
              displayValue={itemDisplay}
              categoryFilter={['FINISHED_GOOD']}
              inputRef={itemRef}
              onChange={(id, display) => {
                setFinishedItemId(id);
                setItemDisplay(display);
                setTimeout(() => grossRef.current?.focus(), 100);
              }}
              onNext={() => grossRef.current?.focus()}
              required
            />
          </div>

          {/* Tag Specifications */}
          <div className="p-4 bg-surface-muted/30 rounded-2xl border border-border/50 space-y-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
              <Tag size={10} /> Tag Specifications
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Gross */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Gross Wt.</label>
                <input
                  ref={grossRef}
                  type="number" step="0.001"
                  value={tagGrossWeight}
                  onChange={e => setTagGrossWeight(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => handleKeyDown(e, kundanRef)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {/* Kundan */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Kundan Wt.</label>
                <input
                  ref={kundanRef}
                  type="number" step="0.001"
                  value={tagKundanWeight}
                  onChange={e => setTagKundanWeight(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => handleKeyDown(e, stoneRef)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {/* Stone */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Stone Wt.</label>
                <input
                  ref={stoneRef}
                  type="number" step="0.001"
                  value={tagStoneWeight}
                  onChange={e => setTagStoneWeight(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => handleKeyDown(e, mottiRef)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {/* Motti */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Motti Wt.</label>
                <input
                  ref={mottiRef}
                  type="number" step="0.001"
                  value={tagMottiWeight}
                  onChange={e => setTagMottiWeight(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => handleKeyDown(e, amountRef)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              {/* Net (read-only) */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Net Wt. (auto)</label>
                <div className="px-3 py-2 bg-background/50 border border-border/50 rounded-xl">
                  <span className="text-sm font-black text-primary">{tagNetWeight.toFixed(3)} g</span>
                </div>
              </div>
              {/* Amount */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Tag Amount (₹)</label>
                <input
                  ref={amountRef}
                  type="number" step="0.01"
                  value={tagAmount}
                  onChange={e => setTagAmount(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => handleKeyDown(e, purityRef)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>

          {/* Purity & Labour */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <Percent size={10} /> Purity %
                </label>
                <input
                  ref={purityRef}
                  type="number" step="0.001" min="0" max="100"
                  value={purity}
                  onChange={e => setPurity(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), labourRef.current?.focus())}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <Weight size={10} /> Gold Weight (g)
                </label>
                <div className="px-3 py-2 bg-background/50 border border-border/50 rounded-xl">
                  <span className="text-sm font-black text-primary">{goldWeight.toFixed(3)} g</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <Percent size={10} /> Labour %
                </label>
                <input
                  ref={labourRef}
                  type="number" step="0.01" min="0"
                  value={labourPct}
                  onChange={e => setLabourPct(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => e.key === 'Enter' && canSave && (e.preventDefault(), handleSave())}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <IndianRupee size={10} /> Labour Amount
                </label>
                <div className="px-3 py-2 bg-background/50 border border-border/50 rounded-xl">
                  <span className="text-sm font-black text-emerald-500">₹{labourAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-background/20 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-muted hover:text-danger hover:border-danger/30 transition-all text-xs font-black uppercase"
          >
            <XCircle size={14} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white text-xs font-black uppercase shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-amber-500/30 transition-all"
          >
            <CheckCircle2 size={14} /> {initialData ? 'Update Item' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
