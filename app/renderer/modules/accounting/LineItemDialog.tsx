import React, { useState, useEffect, useRef } from 'react';
import { TagSearchModal } from '@/components/TagSearchModal';
import {
  Tag, X, CheckCircle2, XCircle, Package, Weight,
  Percent, IndianRupee, ChevronRight,
} from 'lucide-react';

interface ProductDetails {
  id: string;
  tag: string;
  tagNetWeight: number;
  tagAmount: number;
  purityPercentage: number;
  soldGoldPercentage?: number;
  soldAmountPercentage?: number;
  finishedItem?: { name: string; code: string };
}

export interface LineItem {
  productId: string;           // empty string for old items
  tag: string;
  itemName: string;
  purityPercentage: number;
  goldWeight: number;
  labourPercentage: number;
  labourAmount: number;
  tagNetWeight: number;
  tagAmount: number;
  isOldItem?: boolean;         // true = item was not sold through this system
  oldItemName?: string;        // finished item name for old items
  oldItemTag?: string;         // manual tag for old items
  tagGrossWeight?: number;
  tagKundanWeight?: number;
  tagStoneWeight?: number;
  tagMottiWeight?: number;
}

interface LineItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: LineItem) => void;
  initialData?: LineItem | null;
  status?: 'IN_STOCK' | 'SOLD';
  customerId?: string;
}

export function LineItemDialog({ isOpen, onClose, onSave, initialData, status, customerId }: LineItemDialogProps) {
  const [showTagModal, setShowTagModal] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [purity, setPurity] = useState(100);
  const [labourPct, setLabourPct] = useState(100);
  const purityRef = useRef<HTMLInputElement>(null);
  const labourRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setProduct({
          id: initialData.productId,
          tag: initialData.tag,
          tagNetWeight: initialData.tagNetWeight,
          tagAmount: initialData.tagAmount,
          purityPercentage: initialData.purityPercentage,
          finishedItem: { name: initialData.itemName, code: '' } // code not strictly needed for display here
        });
        setPurity(initialData.purityPercentage);
        setLabourPct(initialData.labourPercentage);
        setShowTagModal(false);
        setTimeout(() => purityRef.current?.focus(), 150);
      } else {
        setProduct(null);
        setPurity(100);
        setLabourPct(100);
        setTimeout(() => setShowTagModal(true), 100);
      }
    }
  }, [isOpen, initialData]);

  const goldWeight = product ? +((purity / 100) * Number(product.tagNetWeight)).toFixed(3) : 0;
  const labourAmount = product ? +((labourPct / 100) * Number(product.tagAmount)).toFixed(2) : 0;

  const handleProductSelect = (tag: any) => {
    const p: ProductDetails = {
      id: tag.id,
      tag: tag.tag,
      tagNetWeight: Number(tag.tagNetWeight) || 0,
      tagAmount: Number(tag.tagAmount) || 0,
      purityPercentage: Number(tag.purityPercentage) || 100,
      soldGoldPercentage: tag.soldGoldPercentage,
      soldAmountPercentage: tag.soldAmountPercentage,
      finishedItem: tag.finishedItem,
    };
    setProduct(p);
    
    // For Sale Return (status === 'SOLD'), use the percentages from when it was sold.
    // For regular Sale, use the default purity and default labour (100%).
    if (status === 'SOLD') {
      setPurity(p.soldGoldPercentage ?? p.purityPercentage);
      setLabourPct(p.soldAmountPercentage ?? 100);
    } else {
      setPurity(p.purityPercentage);
      setLabourPct(100);
    }

    setShowTagModal(false);
    setTimeout(() => purityRef.current?.focus(), 150);
  };

  const handleSave = () => {
    if (!product) return;
    onSave({
      productId: product.id,
      tag: product.tag,
      itemName: product.finishedItem?.name ?? 'Unknown',
      purityPercentage: purity,
      goldWeight,
      labourPercentage: labourPct,
      labourAmount,
      tagNetWeight: product.tagNetWeight,
      tagAmount: product.tagAmount,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {showTagModal && (
        <TagSearchModal
          isOpen={showTagModal}
          onClose={() => { 
            setShowTagModal(false); 
            if (!product) onClose(); 
          }}
          onSelect={handleProductSelect}
          status={status}
          customerId={customerId}
        />
      )}

      {!showTagModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={onClose} />

          <div className="relative w-full max-w-lg bg-surface border border-border rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-background/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-text">
                    {initialData ? 'Edit Line Item' : 'Add Line Item'}
                  </h3>
                  <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                    {initialData ? 'Modify existing item details' : 'Select product & configure billing'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Product Selection */}
              <div>
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2">
                  Selected Product
                </label>
                {product ? (
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-2xl">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Tag size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-text truncate">{product.tag} — {product.finishedItem?.name}</div>
                      <div className="text-[9px] font-bold text-text-muted mt-0.5">
                        Net Wt: {Number(product.tagNetWeight).toFixed(3)}g &nbsp;|&nbsp; Tag Amt: ₹{Number(product.tagAmount).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTagModal(true)}
                      className="text-[9px] font-black text-primary uppercase hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="w-full h-11 flex items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/40 rounded-2xl text-[10px] font-black text-text-muted hover:text-primary transition-all group"
                  >
                    <Tag size={14} className="group-hover:scale-110 transition-transform" />
                    {status === 'SOLD' ? 'Click to select a sold tag from this customer' : 'Click to select a finished stock tag'}
                  </button>
                )}
              </div>

              {product && (
                <>
                  {/* Purity */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                        <Percent size={10} /> Purity %
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          ref={purityRef}
                          type="number"
                          step="0.001"
                          min="0"
                          max="100"
                          value={purity}
                          onChange={e => setPurity(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), labourRef.current?.focus())}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-black text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
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

                  {/* Labour */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2 flex items-center gap-1">
                        <Percent size={10} /> Labour %
                      </label>
                      <input
                        ref={labourRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={labourPct}
                        onChange={e => setLabourPct(parseFloat(e.target.value) || 0)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSave())}
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
                </>
              )}
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
                disabled={!product}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-primary/30 transition-all"
              >
                <CheckCircle2 size={14} /> {initialData ? 'Update Item' : 'Save Item'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
