import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, User, X, Filter } from 'lucide-react';
import { Button } from '@/components/Button';
import { PartySearchModal } from '@/components/PartySearchModal';

interface ReportRow {
  partyId: string;
  partyName: string;
  partyCode: string;
  debitGold: number;
  debitAmount: number;
  creditGold: number;
  creditAmount: number;
}

export function PartyLedgerReport({ active }: { active: boolean }) {
  const [selectedParties, setSelectedParties] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const partyIds = selectedParties.map(p => p.id);
      const res = await window.electronAPI.getPartyLedgerReport({
        partyIds: partyIds.length > 0 ? partyIds : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) {
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchData();
  }, [active]);

  const removeParty = (id: string) => {
    setSelectedParties(prev => prev.filter(p => p.id !== id));
  };

  const totals = data.reduce((acc, row) => ({
    debitGold: acc.debitGold + row.debitGold,
    debitAmount: acc.debitAmount + row.debitAmount,
    creditGold: acc.creditGold + row.creditGold,
    creditAmount: acc.creditAmount + row.creditAmount,
  }), { debitGold: 0, debitAmount: 0, creditGold: 0, creditAmount: 0 });


  const exportCSV = () => {
    const headers = ['Sr', 'Party', 'Debit Gold', 'Debit Amount', 'Credit Gold', 'Credit Amount'];
    const rows = data.map((row, idx) => [
      idx + 1,
      `"${row.partyName} (${row.partyCode})"`,
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
    link.download = `Party_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            Party Ledger Report
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">Consolidated summary of multiple parties and date ranges.</p>
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
        {/* Parties Multi-Select */}
        <div className="lg:col-span-2 p-6 bg-surface/50 border border-border rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Select Parties (Optional: All if empty)</label>
             <button 
               onClick={() => setModalOpen(true)}
               className="text-[10px] font-black uppercase text-primary hover:underline"
             >+ Add Party</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[44px]">
            {selectedParties.length === 0 ? (
              <span className="text-text-muted italic text-xs py-2">All parties included. Click '+ Add Party' to filter.</span>
            ) : (
              selectedParties.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold text-xs group">
                  <User size={12} />
                  <span>{p.name}</span>
                  <button onClick={() => removeParty(p.id)} className="hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Date Range */}
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
                 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
               />
             </div>
             <div className="space-y-1.5">
               <span className="text-[10px] font-bold text-text-muted opacity-50 uppercase ml-1">To</span>
               <input 
                 type="date" 
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
                 className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
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
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-text-muted">Party</th>
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
                  <tr key={row.partyId} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-text-muted">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm">{row.partyName}</span>
                        <span className="text-[10px] font-black text-primary uppercase">{row.partyCode}</span>
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
            {/* Totals Footer */}
            <tfoot className="bg-primary/5 border-t-2 border-primary/20">
              <tr>
                <td colSpan={2} className="px-6 py-4 font-black uppercase text-xs tracking-widest text-primary">Grand Totals</td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-500 text-base">{totals.debitGold.toFixed(3)}g</td>
                <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 text-base">₹{totals.debitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-500 text-base">{totals.creditGold.toFixed(3)}g</td>
                <td className="px-6 py-4 text-right font-mono font-black text-red-600 text-base">₹{totals.creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>


      <PartySearchModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={(p) => {
          if (!selectedParties.find(sp => sp.id === p.id)) {
            setSelectedParties([...selectedParties, p]);
          }
          setModalOpen(false);
        }}
        partyTypes={['KARIGAR', 'MANUFACTURER', 'CUSTOMER']}
      />
    </div>
  );
}
