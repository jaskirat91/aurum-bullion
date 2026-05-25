import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, User, X, Filter, Package, Hash, RotateCcw } from 'lucide-react';
import { Button } from '@/components/Button';
import { PartySearchModal } from '@/components/PartySearchModal';
import { ItemSearchModal, Item } from '@/components/ItemSearchModal';

interface ReportRow {
  id: string;
  transactionDate: string;
  party?: { name: string; code: string };
  finishedItem?: { name: string; code: string };
  goldLedgerEntry?: {
    narration?: string;
    debitGold: number;
    debitAmount: number;
    creditGold: number;
    creditAmount: number;
  };
  amountLedgerEntry?: {
    narration?: string;
    debitGold: number;
    debitAmount: number;
    creditGold: number;
    creditAmount: number;
  };
  tagGrossWeight: number;
  tagKundanWeight: number;
  tagStoneWeight: number;
  tagMottiWeight: number;
  piroiWeight: number;
  tagNetWeight: number;
  tagAmount: number;
  soldGoldPercentage: number;
  soldAmountPercentage: number;
}

export function CustomerPurchaseLedger({ active }: { active: boolean }) {
  const [selectedParties, setSelectedParties] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getCustomerPurchaseLedgerReport({
        partyIds: selectedParties.length > 0 ? selectedParties.map(p => p.id) : undefined,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) {
        console.log(res.data);
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchData();
  }, [active]);

  const handleClear = () => {
    setSelectedParties([]);
    setSelectedItems([]);
    setStartDate('');
    setEndDate('');
    setData([]);
  };

  const removeParty = (id: string) => {
    setSelectedParties(prev => prev.filter(p => p.id !== id));
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const exportCSV = () => {
    const headers = [
      'Sr', 'Date', 'Customer', 'Item', 'Narration', 
      'Gross Wt', 'Kundan Wt', 'Stone Wt', 'Motti Wt', 'Net Wt', 
      'Amount', 'Purity %', 'Labour %', 
      'Dr Gold', 'Dr Amount', 'Cr Gold', 'Cr Amount'
    ];
    
    const rows = data.map((row, idx) => {
      const narration = [row.goldLedgerEntry?.narration, row.amountLedgerEntry?.narration]
        .filter(Boolean)
        .join(" | ");
      
      return [
        idx + 1,
        row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : '',
        `"${row.party?.name} (${row.party?.code})"`,
        `"${row.finishedItem?.name}"`,
        `"${narration}"`,
        Number(row.tagGrossWeight).toFixed(3),
        Number(row.tagKundanWeight).toFixed(3),
        Number(row.tagStoneWeight).toFixed(3),
        Number(row.tagMottiWeight).toFixed(3),
        Number(row.tagNetWeight).toFixed(3),
        Number(row.tagAmount).toFixed(2),
        Number(row.soldGoldPercentage).toFixed(3),
        Number(row.soldAmountPercentage).toFixed(3),
        (Number(row.goldLedgerEntry?.debitGold || 0) + Number(row.amountLedgerEntry?.debitGold || 0)).toFixed(3),
        (Number(row.goldLedgerEntry?.debitAmount || 0) + Number(row.amountLedgerEntry?.debitAmount || 0)).toFixed(2),
        (Number(row.goldLedgerEntry?.creditGold || 0) + Number(row.amountLedgerEntry?.creditGold || 0)).toFixed(3),
        (Number(row.goldLedgerEntry?.creditAmount || 0) + Number(row.amountLedgerEntry?.creditAmount || 0)).toFixed(2)
      ];
    });
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Customer_Purchase_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase italic">
            Customer Purchase Ledger
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">Detailed ledger of customer purchases and accounting impacts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={handleClear}>
            Clear
          </Button>
          <Button 
            variant="ghost" 
            icon={<Download size={18} />} 
            onClick={exportCSV}
            disabled={data.length === 0}
          >
            Export CSV
          </Button>
          <Button variant="primary" icon={<Filter size={18} />} onClick={fetchData} loading={loading}>
            Filter Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Parties Multi-Select */}
        <div className="lg:col-span-2 p-5 bg-surface/50 border border-border rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                <User size={12} /> Select Customers
             </label>
             <button 
               onClick={() => setPartyModalOpen(true)}
               className="text-[10px] font-black uppercase text-primary hover:underline"
             >+ Add Customer</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedParties.length === 0 ? (
              <span className="text-text-muted italic text-[10px] py-2 opacity-50">All customers included.</span>
            ) : (
              selectedParties.map(p => (
                <div key={p.id} className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl text-primary font-bold text-[10px] group">
                  <span>{p.name}</span>
                  <button onClick={() => removeParty(p.id)} className="hover:text-red-500 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Items Multi-Select */}
        <div className="lg:col-span-1 p-5 bg-surface/50 border border-border rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                <Package size={12} /> Items
             </label>
             <button 
               onClick={() => setItemModalOpen(true)}
               className="text-[10px] font-black uppercase text-indigo-500 hover:underline"
             >+ Add Item</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedItems.length === 0 ? (
              <span className="text-text-muted italic text-[10px] py-2 opacity-50">All items.</span>
            ) : (
              selectedItems.map(i => (
                <div key={i.id} className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 font-bold text-[10px] group">
                  <span>{i.name}</span>
                  <button onClick={() => removeItem(i.id)} className="hover:text-red-500 transition-colors">
                    <X size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Date Range */}
        <div className="p-5 bg-surface/50 border border-border rounded-3xl space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
            <Calendar size={12} /> Date Range
          </label>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <input 
                 type="date" 
                 value={startDate}
                 onChange={e => setStartDate(e.target.value)}
                 className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary"
               />
             </div>
             <div className="space-y-1">
               <input 
                 type="date" 
                 value={endDate}
                 onChange={e => setEndDate(e.target.value)}
                 className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary"
               />
             </div>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-background/50 border-b border-border">
                <th className="px-4 py-3 text-left border font-black uppercase tracking-widest text-text-muted w-12">Sr.</th>
                <th className="px-4 py-3 text-left border font-black uppercase tracking-widest text-text-muted w-24">Date</th>
                <th className="px-4 py-3 text-left border font-black uppercase tracking-widest text-text-muted">Customer</th>
                <th className="px-4 py-3 text-left border font-black uppercase tracking-widest text-text-muted">Item</th>
                {/* <th className="px-4 py-3 text-left font-black uppercase tracking-widest text-text-muted">Narration</th> */}
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Gross</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Kundan</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Stone</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Motti</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Piroi</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Net</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Amount</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Pur %</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Lab %</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Dr Gold</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Dr Amt</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Cr Gold</th>
                <th className="px-4 py-3 text-right border font-black uppercase tracking-widest text-text-muted">Cr Amt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={17} className="px-6 py-20 text-center">
                     <div className="flex flex-col items-center gap-3 opacity-30">
                       <Search size={40} />
                       <p className="font-bold text-xs uppercase tracking-widest">No matching records found.</p>
                     </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const narration = [row.goldLedgerEntry?.narration, row.amountLedgerEntry?.narration]
                    .filter(Boolean)
                    .join(" | ");

                  const drGold = Number(row.goldLedgerEntry?.debitGold || 0) + Number(row.amountLedgerEntry?.debitGold || 0);
                  const drAmount = Number(row.goldLedgerEntry?.debitAmount || 0) + Number(row.amountLedgerEntry?.debitAmount || 0);
                  const crGold = Number(row.goldLedgerEntry?.creditGold || 0) + Number(row.amountLedgerEntry?.creditGold || 0);
                  const crAmount = Number(row.goldLedgerEntry?.creditAmount || 0) + Number(row.amountLedgerEntry?.creditAmount || 0);

                  return (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-4 py-3 text-text-muted border">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold border">
                        {row.transactionDate ? new Date(row.transactionDate).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex flex-col">
                          <span className="font-extrabold truncate w-32">{row.party?.name}</span>
                          <span className="text-[9px] uppercase">{row.party?.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold border">{row.finishedItem?.name}</td>
                      {/* <td className="px-4 py-3 text-[10px] text-text-muted italic truncate max-w-[120px]" title={narration}>
                        {narration || '-'}
                      </td> */}
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.tagGrossWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.tagKundanWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.tagStoneWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.tagMottiWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.piroiWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.tagNetWeight).toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">₹{Number(row.tagAmount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.soldGoldPercentage)}%</td>
                      <td className="px-4 py-3 text-right font-bold border">{Number(row.soldAmountPercentage)}%</td>
                      <td className="px-4 py-3 text-right font-bold border">{drGold.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{drAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold border">{crGold.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right font-bold border">{crAmount.toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PartySearchModal 
        isOpen={partyModalOpen} 
        onClose={() => setPartyModalOpen(false)} 
        onSelect={(p) => {
          if (!selectedParties.find(sp => sp.id === p.id)) {
            setSelectedParties([...selectedParties, p]);
          }
          setPartyModalOpen(false);
        }}
        partyTypes={['CUSTOMER']}
      />

      {itemModalOpen && (
        <ItemSearchModal 
          onClose={() => setItemModalOpen(false)}
          categoryFilter={['FINISHED_GOOD']}
          onSelect={(i) => {
            if (!selectedItems.find(si => si.id === i.id)) {
              setSelectedItems([...selectedItems, i]);
            }
            setItemModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
