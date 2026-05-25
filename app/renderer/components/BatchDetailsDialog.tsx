import React from 'react';
import { X, Package, Calendar, Scale, Info } from 'lucide-react';
import { Button } from './Button';

interface BatchDetailsDialogProps {
  batch: any;
  onClose: () => void;
}

export function BatchDetailsDialog({ batch, onClose }: BatchDetailsDialogProps) {
  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Package size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Batch Details</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{batch.batchNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={24} className="text-text-muted" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background/50 p-5 rounded-3xl border border-border/50">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Item Detail</span>
              <p className="font-bold text-lg">{batch.item?.name || 'N/A'}</p>
              <span className="text-[10px] font-bold text-text-muted/60 uppercase">{batch.item?.code}</span>
            </div>
            
            <div className="bg-background/50 p-5 rounded-3xl border border-border/50">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Entry Date</span>
              <div className="flex items-center gap-2 font-bold text-lg">
                <Calendar size={18} className="text-secondary opacity-50" />
                {new Date(batch.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
            <div className="flex items-center justify-between">
               <div>
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Net Pure Gold</span>
                  <div className="flex items-center gap-2">
                    <Scale size={20} className="text-emerald-500" />
                    <span className="text-3xl font-black text-emerald-500">{(batch.netWeight || 0).toFixed(3)}g</span>
                  </div>
               </div>
               <div className="text-right">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Purity</span>
                  <span className="text-lg font-black">{batch.purity || '--'}K</span>
               </div>
            </div>
          </div>

          <div className="bg-background/30 p-5 rounded-3xl border border-border/30">
             <div className="flex items-start gap-3">
               <Info size={18} className="text-primary mt-1 shrink-0" />
               <div>
                 <p className="text-xs font-bold text-text-muted leading-relaxed">
                   This batch represents an incoming stock entry. All transactions linked to this batch preserve the original purity and weight metrics to ensure a perfect trail.
                 </p>
               </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-background/20 border-t border-border">
          <Button onClick={onClose} className="w-full h-12 shadow-primary/10">Close Details</Button>
        </div>
      </div>
    </div>
  );
}
