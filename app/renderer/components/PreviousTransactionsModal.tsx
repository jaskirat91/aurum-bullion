import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, CopyIcon, History, X } from 'lucide-react';

interface Transaction {
  entryDate: string;
  voucherNo: string;
  narration: string;
  debitAmount: number;
  creditAmount: number;
  debitGold: number;
  creditGold: number;
}

interface PreviousTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  orderTitle?: string;
}

export function PreviousTransactionsModal({
  isOpen,
  onClose,
  transactions,
  orderTitle,
}: PreviousTransactionsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copiedVoucherNo, setCopiedVoucherNo] = useState<string | null>(null);

  const handleCopy = (voucherNo: string) => {
    navigator.clipboard.writeText(voucherNo).then(() => {
      setCopiedVoucherNo(voucherNo);
      setTimeout(() => setCopiedVoucherNo(null), 2000);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalDrAmt = transactions.reduce((sum, tx) => sum + Number(tx.debitAmount || 0), 0);
  const totalCrAmt = transactions.reduce((sum, tx) => sum + Number(tx.creditAmount || 0), 0);
  const totalDrGold = transactions.reduce((sum, tx) => sum + Number(tx.debitGold || 0), 0);
  const totalCrGold = transactions.reduce((sum, tx) => sum + Number(tx.creditGold || 0), 0);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-border/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/40 bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Previous Transactions</h2>
              {orderTitle && (
                <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">
                  {orderTitle}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-text-muted hover:text-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 bg-surface/10">
          <div className="bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="bg-surface/80 border-b border-border/40">
                  <th className="px-4 py-3 text-left font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Voucher No.
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Narration
                  </th>
                  {/* <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Dr Amt
                  </th>
                  <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Cr Amt
                  </th> */}
                  <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Bal. Amt
                  </th>
                  {/* <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Dr Gold
                  </th>
                  <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Cr Gold
                  </th> */}
                  <th className="px-4 py-3 text-right font-black uppercase text-[10px] tracking-widest text-text-muted">
                    Bal. Gold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {transactions.map((tx, idx) => {
                  const balAmt = Number(tx.debitAmount || 0) - Number(tx.creditAmount || 0);
                  const balGold = Number(tx.debitGold || 0) - Number(tx.creditGold || 0);

                  return (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-bold text-text-muted whitespace-nowrap">
                        {tx.entryDate}
                      </td>
                      <td className="px-4 py-3 font-bold flex items-center gap-2">
                        {tx.voucherNo}
                        <button
                          onClick={() => handleCopy(tx.voucherNo)}
                          className="cursor-pointer text-text-muted hover:text-text font-normal transition-colors"
                          title="Copy Voucher No."
                        >
                          {copiedVoucherNo === tx.voucherNo ? (
                            <CheckIcon className="text-green-500 dark:text-green-400" size={16} />
                          ) : (
                            <CopyIcon size={16} />
                          )}
                        </button>
                      </td>
                      <td
                        className="px-4 py-3 text-text font-medium truncate max-w-[250px]"
                        title={tx.narration}
                      >
                        {tx.narration}
                      </td>
                      {/* <td className="px-4 py-3 text-right font-bold">
                        {Number(tx.debitAmount) > 0
                          ? Number(tx.debitAmount).toLocaleString('en-IN')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {Number(tx.creditAmount) > 0
                          ? Number(tx.creditAmount).toLocaleString('en-IN')
                          : '-'}
                      </td> */}
                      <td className={`px-4 py-3 text-right font-bold`}>
                        {Math.abs(balAmt).toLocaleString('en-IN')}{' '}
                        {balAmt > 0 ? 'Dr' : balAmt < 0 ? 'Cr' : ''}
                      </td>
                      {/* <td className="px-4 py-3 text-right font-bold text-blue-600 dark:text-blue-400">
                        {Number(tx.debitGold) > 0 ? Number(tx.debitGold).toFixed(3) + 'g' : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400">
                        {Number(tx.creditGold) > 0 ? Number(tx.creditGold).toFixed(3) + 'g' : '-'}
                      </td> */}
                      <td className={`px-4 py-3 text-right font-black`}>
                        {Math.abs(balGold).toFixed(3)}g{' '}
                        {balGold > 0 ? 'Dr' : balGold < 0 ? 'Cr' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-surface/80 font-black border-t-2 border-border/40">
                  <td
                    colSpan={3}
                    className="px-4 py-4 uppercase text-[10px] tracking-widest text-text-muted"
                  >
                    Grand Totals
                  </td>
                  {/* <td className="px-4 py-4 text-right text-base">
                    {totalDrAmt.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-right text-base">
                    {totalCrAmt.toLocaleString('en-IN')}
                  </td> */}
                  <td className={`px-4 py-4 text-right text-base `}>
                    {Math.abs(totalDrAmt - totalCrAmt).toLocaleString('en-IN')}{' '}
                    {totalDrAmt - totalCrAmt >= 0 ? 'Dr' : 'Cr'}
                  </td>
                  {/* <td className="px-4 py-4 text-right text-blue-600 dark:text-blue-400 text-base">
                    {totalDrGold.toFixed(3)}g
                  </td>
                  <td className="px-4 py-4 text-right text-orange-600 dark:text-orange-400 text-base">
                    {totalCrGold.toFixed(3)}g
                  </td> */}
                  <td className={`px-4 py-4 text-right text-base`}>
                    {Math.abs(totalDrGold - totalCrGold).toFixed(3)}g{' '}
                    {totalDrGold - totalCrGold >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/40 bg-surface/50 flex justify-between items-center">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
            Press{' '}
            <kbd className="px-2 py-1 bg-surface border border-border/40 rounded-lg text-text shadow-sm mx-1">
              ESC
            </kbd>{' '}
            to close
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
