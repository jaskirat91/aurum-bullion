import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, Hash, X, Filter, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { AccountSearchModal } from '@/components/AccountSearchModal';

interface ReportRow {
  accountId: string;
  accountName: string;
  accountCode: string;
  debitGold: number;
  debitAmount: number;
  creditGold: number;
  creditAmount: number;
}

export function AccountLedgerReport({ active }: { active: boolean }) {
  const [selectedAccounts, setSelectedAccounts] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDataForAll, setIsDataForAll] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const filterEmpty = selectedAccounts.length === 0;
    try {
      const res = await window.electronAPI.getAccountLedgerReport({
        accountIds: filterEmpty ? undefined : selectedAccounts.map(a => a.id),
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) {
        setData(res.data || []);
        setIsDataForAll(filterEmpty);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchData();
  }, [active]);

  const removeAccount = (id: string) => {
    setSelectedAccounts(prev => prev.filter(a => a.id !== id));
  };

  const totals = data.reduce((acc, row) => ({
    debitGold: acc.debitGold + row.debitGold,
    debitAmount: acc.debitAmount + row.debitAmount,
    creditGold: acc.creditGold + row.creditGold,
    creditAmount: acc.creditAmount + row.creditAmount,
  }), { debitGold: 0, debitAmount: 0, creditGold: 0, creditAmount: 0 });

  const isBalanced = Math.abs(totals.debitGold - totals.creditGold) < 0.001 && 
                    Math.abs(totals.debitAmount - totals.creditAmount) < 0.01;

  const exportCSV = () => {
    const headers = ['Sr', 'Account', 'Debit Gold', 'Debit Amount', 'Credit Gold', 'Credit Amount'];
    const rows = data.map((row, idx) => [
      idx + 1,
      `"${row.accountName} (${row.accountCode})"`,
      row.debitGold.toFixed(3),
      row.debitAmount.toFixed(2),
      row.creditGold.toFixed(3),
      row.creditAmount.toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Account_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Account Ledger Report
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">Consolidated summary of multiple ledger accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            icon={<Download size={18} />} 
            onClick={exportCSV}
            disabled={data.length === 0}
          >
            Export CSV
          </Button>
          <Button variant="primary" icon={<Filter size={18} />} onClick={fetchData} loading={loading}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-surface/50 border border-border rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Select Accounts (Optional: All if empty)</label>
             <button 
               onClick={() => setModalOpen(true)}
               className="text-[10px] font-black uppercase text-emerald-500 hover:underline"
             >+ Add Account</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[44px]">
            {selectedAccounts.length === 0 ? (
              <span className="text-text-muted italic text-xs py-2">All accounts included. Click '+ Add Account' to filter.</span>
            ) : (
              selectedAccounts.map(a => (
                <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 font-bold text-xs group">
                  <Hash size={12} />
                  <span>{a.name}</span>
                  <button onClick={() => removeAccount(a.id)} className="hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-surface/50 border border-border rounded-3xl space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
            <Calendar size={12} /> Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1.5">
               <span className="text-[10px] font-bold text-text-muted opacity-50 uppercase ml-1">From</span>
               <input 
                 type="date" 
                 value={startDate}
                 onChange={e => setStartDate(e.target.value)}
                 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
               />
             </div>
             <div className="space-y-1.5">
               <span className="text-[10px] font-bold text-text-muted opacity-50 uppercase ml-1">To</span>
               <input 
                 type="date" 
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
                 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
               />
             </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-muted w-16">Sr</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-muted">Account</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Debit Gold</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Debit Amt</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Credit Gold</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Credit Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-3 opacity-30">
                       <Search size={48} />
                       <p className="font-bold text-sm">No records found. Adjust filters or generate report.</p>
                     </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={row.accountId} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-text-muted">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm">{row.accountName}</span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase">{row.accountCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-500">{row.debitGold.toFixed(3)}g</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">₹{row.debitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-500">{row.creditGold.toFixed(3)}g</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600">₹{row.creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-emerald-500/5 border-t-2 border-emerald-500/20">
              <tr>
                <td colSpan={2} className="px-6 py-4 font-black uppercase text-xs tracking-widest text-emerald-600">Grand Totals</td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-500 text-base">{totals.debitGold.toFixed(3)}g</td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 text-base">₹{totals.debitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-500 text-base">{totals.creditGold.toFixed(3)}g</td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-600 text-base">₹{totals.creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Balance Indicator - Only shown when report was generated with 'All Accounts' */}
      {isDataForAll && data.length > 0 && (
        <div className={`p-6 border rounded-3xl flex items-center justify-between shadow-lg transition-colors overflow-hidden relative ${
          isBalanced 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className={`p-3 rounded-2xl ${isBalanced ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
               {isBalanced ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div>
              <h3 className="font-black uppercase tracking-[0.2em] text-sm">Status: {isBalanced ? 'Balanced' : 'Discrepancy Detected'}</h3>
              <p className="text-xs font-bold opacity-80 mt-1">
                {isBalanced 
                  ? 'All debits and credits match perfectly across your entire ledger.' 
                  : 'There is a system-wide discrepancy between total debits and credits.'}
              </p>
            </div>
          </div>
          <div className="text-right relative z-10">
             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Net Difference</div>
             <div className="font-mono font-black text-lg">
                {Math.abs(totals.debitGold - totals.creditGold).toFixed(3)}g / ₹{Math.abs(totals.debitAmount - totals.creditAmount).toFixed(2)}
             </div>
          </div>
        </div>
      )}

      <AccountSearchModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={(a) => {
          if (!selectedAccounts.find(sa => sa.id === a.id)) {
            setSelectedAccounts([...selectedAccounts, a]);
          }
          setModalOpen(false);
        }}
        leafOnly={true}
      />
    </div>
  );
}
