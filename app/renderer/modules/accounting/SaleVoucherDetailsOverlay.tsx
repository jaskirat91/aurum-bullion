import React, { useState, useEffect } from 'react';
import {
  X, Receipt, Calendar, UserCheck, Tag, Weight, IndianRupee,
  Percent, AlertTriangle, CheckCircle2, RotateCcw, Pencil,
  Ban, FileText,
} from 'lucide-react';
import { StatusChip, StatusType } from '@/components/StatusChip';

interface DetailsProps {
  voucherId: string;
  onClose: () => void;
  onEdit: (data: any) => void;
}

export function SaleVoucherDetailsOverlay({ voucherId, onClose, onEdit }: DetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await window.electronAPI.getSaleVoucherDetails(voucherId);
        if (res.success) setDetails(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [voucherId]);

  const status: string = details?.voucher?.status ?? '';
  const totalGold = (details?.items ?? []).reduce((s: number, i: any) => s + i.goldWeight, 0);
  const totalAmount = (details?.items ?? []).reduce((s: number, i: any) => s + i.labourAmount, 0);

  return (
    <div className="absolute inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border shadow-[0_0_60px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-text">
                  {details?.voucher?.voucherNo ?? '...'}
                </h3>
                {details && <StatusChip status={status as StatusType} />}
              </div>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">Sale Voucher Details</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div className={`shrink-0 mx-6 mt-3 px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-danger/10 border-danger/20 text-danger'
          }`}>
            {alert.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {alert.msg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 animate-pulse">
              <Receipt size={32} className="text-primary/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Loading...</span>
            </div>
          ) : !details ? (
            <div className="text-center py-16 text-text-muted text-sm">Details not found.</div>
          ) : (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                    <Calendar size={10} /> Entry Date
                  </div>
                  <div className="text-sm font-black text-text">
                    {details.voucher?.entryDate
                      ? new Date(details.voucher.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </div>
                </div>

                <div className="bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                    <UserCheck size={10} /> Customer
                  </div>
                  <div className="text-sm font-black text-text">{details.customer?.name ?? '—'}</div>
                  <div className="text-[9px] font-bold text-text-muted uppercase">{details.customer?.code}</div>
                </div>

                {details.voucher?.narration && (
                  <div className="col-span-2 bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                      <FileText size={10} /> Narration
                    </div>
                    <div className="text-xs font-medium text-text">{details.voucher.narration}</div>
                  </div>
                )}
              </div>

              {/* Totals */}
              {details.items?.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
                    <div className="text-[9px] font-black uppercase text-primary/70 tracking-widest">Total Gold Weight</div>
                    <div className="text-xl font-black text-primary mt-0.5">{totalGold.toFixed(3)} g</div>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-4">
                    <div className="text-[9px] font-black uppercase text-emerald-600/70 tracking-widest">Total Amount</div>
                    <div className="text-xl font-black text-emerald-500 mt-0.5">₹ {totalAmount.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={13} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text">
                    Line Items ({details.items?.length ?? 0})
                  </span>
                </div>
                <div className="bg-background/30 border border-border/40 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="bg-background/60 border-b border-border/40">
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted w-5">#</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted w-40">Tag</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted">Item</th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted text-right">
                          <span className="flex items-center justify-end gap-0.5"><Percent size={8} /> Purity</span>
                        </th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted text-right">
                          <span className="flex items-center justify-end gap-0.5"><Weight size={8} /> Gold (g)</span>
                        </th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted text-right">
                          <span className="flex items-center justify-end gap-0.5"><Percent size={8} /> Labour</span>
                        </th>
                        <th className="px-3 py-2 font-black uppercase tracking-widest text-text-muted text-right">
                          <span className="flex items-center justify-end gap-0.5"><IndianRupee size={8} /> Amt</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {(details.items ?? []).map((item: any, idx: number) => (
                        <tr key={item.id ?? idx} className="hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 text-[10px] font-black text-text-muted">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-black">{item.tag}</span>
                          </td>
                          <td className="px-4 py-3 font-bold">{item.itemName}</td>
                          <td className="px-4 py-3 font-bold text-right">{item.purityPercentage.toFixed(3)}%</td>
                          <td className="px-4 py-3 font-black text-primary text-right">{item.goldWeight.toFixed(3)}</td>
                          <td className="px-4 py-3 font-bold text-right">{item.labourPercentage.toFixed(2)}%</td>
                          <td className="px-4 py-3 font-black text-emerald-500 text-right">₹ {item.labourAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    {details.items?.length > 0 && (
                      <tfoot>
                        <tr className="bg-background/40 border-t border-border/60">
                          <td colSpan={4} className="px-4 py-2.5 text-[12px] font-black uppercase text-text-muted tracking-widest text-left">Totals</td>
                          <td className="px-4 py-2.5 text-[12px] font-black text-primary text-right">{totalGold.toFixed(3)}</td>
                          <td />
                          <td className="px-4 py-2.5 text-[12px] font-black text-emerald-500 text-right">₹ {totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && details && (
          <div className="shrink-0 px-6 py-4 border-t border-border bg-background/20 flex items-center gap-3">
            <button
              onClick={() => onEdit(details)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              <Pencil size={13} /> Edit Voucher
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-text-muted hover:text-text text-xs font-black uppercase transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
