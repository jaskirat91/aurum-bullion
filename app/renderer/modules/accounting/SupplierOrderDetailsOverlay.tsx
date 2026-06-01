import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  Calendar,
  UserCheck,
  Weight,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { StatusChip, StatusType } from '@/components/StatusChip';

interface DetailsProps {
  voucherId: string;
  onClose: () => void;
  onEdit: (data: any) => void;
  onCancelled: () => void;
}

export function SupplierOrderDetailsOverlay({
  voucherId,
  onClose,
  onEdit,
  onCancelled,
}: DetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [netGold, setNetGold] = useState(0);
  const [netAmount, setNetAmount] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await window.electronAPI.getSupplierOrderDetails(voucherId);
        if (res.success) {
          setDetails(res.data);
          // Fetch linked transactions (isCustomerOrder = false)
          const txRes = await window.electronAPI.getOrderTransactions(
            voucherId,
            res.data.accountId,
            false,
          );
          if (txRes.success) {
            setTransactions(txRes.data || []);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [voucherId]);

  useEffect(() => {
    if (transactions.length) {
      setNetGold(
        transactions
          .reduce((sum, tx) => sum + (Number(tx.creditGold) - Number(tx.debitGold)), 0)
          .toFixed(3),
      );
      setNetAmount(
        transactions.reduce(
          (sum, tx) => sum + (Number(tx.creditAmount) - Number(tx.debitAmount)),
          0,
        ),
      );
    } else {
      setNetGold(0);
      setNetAmount(0);
    }
  }, [transactions]);

  const status: string = details?.voucher?.status ?? '';
  const orderType: string = details?.orderType ?? '';

  return (
    <div className="absolute inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl h-full bg-surface border-l border-border shadow-[0_0_60px_rgba(0,0,0,0.3)] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-border bg-background/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckSquare size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-text">
                  {details?.voucher?.voucherNo ?? '...'}
                </h3>
                {details && <StatusChip status={details.orderStatus as StatusType} />}
              </div>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                Supplier Order Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-danger/10 text-text-muted hover:text-danger transition-all flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alert */}
        {alert && (
          <div
            className={`shrink-0 mx-6 mt-3 px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              alert.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-danger/10 border-danger/20 text-danger'
            }`}
          >
            {alert.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {alert.msg}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 animate-pulse">
              <CheckSquare size={32} className="text-primary/20" />
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Loading...
              </span>
            </div>
          ) : !details ? (
            <div className="text-center py-16 text-text-muted text-sm">Details not found.</div>
          ) : (
            <>
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border font-black uppercase tracking-widest text-xs ${
                  orderType === 'BUY'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                }`}
              >
                {orderType === 'BUY' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                {orderType} ORDER
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                    <Calendar size={10} /> Entry Date
                  </div>
                  <div className="text-sm font-black text-text">
                    {details.voucher?.entryDate
                      ? new Date(details.voucher.entryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>

                <div className="bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                    <UserCheck size={10} /> Supplier
                  </div>
                  <div className="text-sm font-black text-text">{details.account?.name ?? '—'}</div>
                  <div className="text-[9px] font-bold text-text-muted uppercase">
                    {details.account?.code}
                  </div>
                </div>

                {details.item && (
                  <div className="col-span-2 bg-background/50 border border-border/50 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-text-muted tracking-widest">
                      <Package size={10} /> Item
                    </div>
                    <div className="text-sm font-black text-text">{details.item?.name ?? '—'}</div>
                    <div className="text-[9px] font-bold text-text-muted uppercase">
                      {details.item?.code}
                    </div>
                  </div>
                )}
              </div>

              {/* Values */}
              <div className="space-y-4">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600/70 tracking-widest">
                      <IndianRupee size={10} /> Amount
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-1">
                      ₹{' '}
                      {Number(details.amount || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
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
                        {details.goldRate
                          ? `₹ ${Number(details.goldRate).toLocaleString('en-IN')}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Transactions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/40" />
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-muted">
                    <History size={10} /> Linked Transactions
                  </div>
                  <div className="h-px flex-1 bg-border/40" />
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-8 bg-background/30 rounded-2xl border border-dashed border-border/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">
                      No transactions linked yet
                    </p>
                  </div>
                ) : (
                  <div className="bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-surface/50 border-b border-border/40 text-[9px] font-black uppercase tracking-widest text-text-muted">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Narration</th>
                          <th className="px-4 py-2 text-right">Pure Gold</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {transactions.map((tx, idx) => {
                          const netGold = Number(tx.creditGold) - Number(tx.debitGold);
                          const netAmount = Number(tx.creditAmount) - Number(tx.debitAmount);

                          return (
                            <tr key={idx} className="hover:bg-primary/5 transition-colors">
                              <td className="px-4 py-2 font-bold text-text-muted whitespace-nowrap">
                                {new Date(tx.entryDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </td>
                              <td
                                className="px-4 py-2 text-text font-medium truncate max-w-[150px]"
                                title={tx.narration}
                              >
                                {tx.narration}
                              </td>
                              <td
                                className={`px-4 py-2 text-right font-black ${netGold > 0 ? 'text-emerald-500' : netGold < 0 ? 'text-danger' : 'text-text-muted/40'}`}
                              >
                                {netGold !== 0
                                  ? `${netGold > 0 ? '+' : ''}${netGold.toFixed(3)}g`
                                  : '—'}
                              </td>
                              <td
                                className={`px-4 py-2 text-right font-black ${netAmount > 0 ? 'text-emerald-500' : netAmount < 0 ? 'text-danger' : 'text-text-muted/40'}`}
                              >
                                {netAmount !== 0
                                  ? `${netAmount > 0 ? '+' : ''}₹${Math.abs(netAmount).toLocaleString('en-IN')}`
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-surface/50 font-black border-t border-border/40">
                          <td
                            colSpan={2}
                            className="px-4 py-2 uppercase text-[9px] tracking-widest text-text-muted"
                          >
                            Total Fulfilled
                          </td>
                          <td
                            className={`px-4 py-2 text-right ${netGold > 0 ? 'text-emerald-500' : netGold < 0 ? 'text-danger' : 'text-text-muted/40'}`}
                          >
                            {Math.abs(netGold)}g
                          </td>
                          <td
                            className={`px-4 py-2 text-right ${netAmount > 0 ? 'text-emerald-500' : netAmount < 0 ? 'text-danger' : 'text-text-muted/40'}`}
                          >
                            ₹{Math.abs(netAmount).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
              <Pencil size={13} /> Edit Order
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
