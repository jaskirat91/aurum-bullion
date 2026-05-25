import React, { useState, useEffect } from 'react';
import {
  X, Wallet, Calendar, UserCheck, Weight, IndianRupee,
  AlertTriangle, CheckCircle2, RotateCcw, Pencil,
  Ban, FileText, ArrowDownRight, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { StatusChip, StatusType } from '@/components/StatusChip';

interface DetailsProps {
  voucherId: string;
  onClose: () => void;
  onEdit: (data: any) => void;
  onCancelled: () => void;
}

export function CashVoucherDetailsOverlay({ voucherId, onClose, onEdit, onCancelled }: DetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await window.electronAPI.getCashVoucherDetails(voucherId);
        if (res.success) setDetails(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [voucherId]);

  const handleCancel = async () => {
    setCancelling(true);
    setAlert(null);
    try {
      const res = await window.electronAPI.cancelCashVoucher(voucherId);
      if (res.success) {
        setAlert({ type: 'success', msg: 'Voucher cancelled successfully. Reversal entries have been posted.' });
        setCancelConfirm(false);
        setTimeout(() => { onCancelled(); onClose(); }, 1800);
      } else {
        setAlert({ type: 'error', msg: (res as any).error ?? 'Cancellation failed.' });
        setCancelConfirm(false);
      }
    } catch {
      setAlert({ type: 'error', msg: 'A system error occurred.' });
    } finally {
      setCancelling(false);
    }
  };

  const status: string = details?.voucher?.status ?? '';
  const type: string = details?.voucher?.type ?? '';
  const cashAmount = type === 'RECEIPT' ? details?.receiptAmount : details?.paymentAmount;

  return (
    <div className="absolute inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl h-full bg-surface border-l border-border shadow-[0_0_60px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-text">
                  {details?.voucher?.voucherNo ?? '...'}
                </h3>
                {details && <StatusChip status={status as StatusType} />}
              </div>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">Cash Voucher Details</p>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 animate-pulse">
              <Wallet size={32} className="text-primary/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Loading...</span>
            </div>
          ) : !details ? (
            <div className="text-center py-16 text-text-muted text-sm">Details not found.</div>
          ) : (
            <>
              {/* Type Chip Large */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-xs ${
                type === 'RECEIPT' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {type === 'RECEIPT' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                {type} VOUCHER
              </div>

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
                    <UserCheck size={10} /> Account
                  </div>
                  <div className="text-sm font-black text-text">{details.partyAccount?.name ?? '—'}</div>
                  <div className="text-[9px] font-bold text-text-muted uppercase">{details.partyAccount?.code}</div>
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

              {/* Values */}
              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600/70 tracking-widest">
                      <IndianRupee size={10} /> Cash Amount
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-1">
                      ₹ {Number(cashAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <IndianRupee size={32} className="text-emerald-500/10" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-600/70 tracking-widest">
                        <Weight size={10} /> Gold Weight
                      </div>
                      <div className="text-xl font-black text-amber-500 mt-1">
                        {Number(details.goldWeight || 0).toFixed(3)} g
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                        <TrendingUp size={10} /> Gold Rate
                      </div>
                      <div className="text-xl font-black text-text/70 mt-1">
                        {details.goldRate ? `₹ ${Number(details.goldRate).toLocaleString()}` : '—'}
                      </div>
                    </div>
                  </div>
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
