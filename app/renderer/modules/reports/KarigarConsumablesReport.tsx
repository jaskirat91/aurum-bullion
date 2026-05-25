import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Calendar, 
  User, 
  X, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  ArrowDownLeft,
  Clock,
  Layers,
  Database
} from 'lucide-react';
import { Button } from '@/components/Button';
import { PartySearchModal } from '@/components/PartySearchModal';

interface SummaryData {
  grossGoldWeight: number;
  kundanWeight: number;
  piroiWeight: number;
  bStoneWeight: number;
  stoneWeight: number;
  taarPattiWeight: number;
  colorStoneWeight: number;
}

interface Transaction {
  id: string;
  transactionDate: string;
  createdAt: string;
  type: string;
  batch: { batchNo: string; item: { name: string; code: string } };
  party: { name: string; code: string };
  grossGoldWeight: number;
  netWeight: number;
  netPureGoldWeight: number;
  kundanWeight: number;
  piroiWeight: number;
  bStoneWeight: number;
  stoneWeight: number;
  taarPattiWeight: number;
  colorStoneWeight: number;
  totalStones: number;
  totalStoneLabour: number;
}

export function KarigarConsumablesReport({ active }: { active: boolean }) {
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ partyId?: string; startDate?: string; endDate?: string }>({});
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const reportRes = await window.electronAPI.getKarigarConsumablesReport(page, limit, filters);
      const summaryRes = await window.electronAPI.getKarigarConsumablesSummary(filters);
      
      if (reportRes.success) {
        setData(reportRes.data?.items || []);
        setTotal(reportRes.data?.total || 0);
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchData();
  }, [active, page, filters.partyId]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            Karigar Consumables Report
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">Consolidated tracking of materials received from Karigars.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="bg-surface/30 border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2 mb-4">
          <Database size={14} className="text-emerald-500" /> Material Consumption Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
           {[
             { label: 'Gross Gold', val: summary?.grossGoldWeight, unit: 'g', color: 'emerald' },
             { label: 'Kundan', val: summary?.kundanWeight, unit: 'g', color: 'amber' },
             { label: 'Piroi', val: summary?.piroiWeight, unit: 'g', color: 'blue' },
             { label: 'B.Stone', val: summary?.bStoneWeight, unit: 'g', color: 'rose' },
             { label: 'Stone', val: summary?.stoneWeight, unit: 'g', color: 'violet' },
             { label: 'Taar Patti', val: summary?.taarPattiWeight, unit: 'g', color: 'indigo' },
             { label: 'Color Stone', val: summary?.colorStoneWeight, unit: 'g', color: 'teal' }
           ].map((item) => (
             <div key={item.label} className="p-4 bg-background border border-border rounded-2xl flex flex-col items-center text-center group hover:border-emerald-500/30 transition-all">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50 mb-1">{item.label}</span>
                <span className="text-lg font-black tracking-tighter group-hover:text-emerald-500 transition-colors">
                  {Number(item.val || 0).toFixed(3)}
                  <span className="text-[10px] ml-0.5 opacity-30 font-bold">{item.unit}</span>
                </span>
             </div>
           ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-6 bg-surface/50 border border-border p-6 rounded-3xl shadow-sm">
        <div className="space-y-2 min-w-[250px] flex-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
            <User size={12} /> Filter by Karigar
          </label>
          <div className="relative">
             <input 
               type="text"
               readOnly
               placeholder="All Karigars"
               value={selectedParty?.name || ''}
               onClick={() => setPartyModalOpen(true)}
               className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer pr-10"
             />
             {selectedParty ? (
               <button onClick={() => { setSelectedParty(null); setFilters({ ...filters, partyId: undefined }); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/10 text-red-500 rounded-lg">
                 <X size={16} />
               </button>
             ) : (
               <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted opacity-30" />
             )}
          </div>
        </div>

        <div className="space-y-2 w-44">
           <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
             <Calendar size={12} /> From
           </label>
           <input 
             type="date"
             value={filters.startDate || ''}
             onChange={e => setFilters({ ...filters, startDate: e.target.value })}
             className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 outline-none"
           />
        </div>

        <div className="space-y-2 w-44">
           <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
             <Calendar size={12} /> To
           </label>
           <input 
             type="date"
             value={filters.endDate || ''}
             onChange={e => setFilters({ ...filters, endDate: e.target.value })}
             className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 outline-none"
           />
        </div>

        <Button variant="primary" icon={<Filter size={18} />} onClick={() => { setPage(1); fetchData(); }} loading={loading}>
          Apply Filters
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="px-6 py-4 text-left w-16">Sr.no</th>
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-left">Batch Details</th>
                <th className="px-6 py-4 text-left">Party Details</th>
                <th className="px-6 py-4 text-right">Pure Gold</th>
                <th className="px-6 py-4 text-right">Kundan WT</th>
                <th className="px-6 py-4 text-right">Piroi WT</th>
                <th className="px-6 py-4 text-right">T-Patri WT</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {data.length === 0 && !loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-20 text-center italic text-text-muted opacity-50 font-bold">No transactions found for current filters.</td>
                 </tr>
               ) : (
                 data.map((tx, idx) => (
                   <tr key={tx.id} className="hover:bg-emerald-500/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-[10px] text-text-muted">{(page-1)*limit + idx + 1}</td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-xs">{new Date(tx.transactionDate).toLocaleDateString()}</span>
                            <span className="text-[9px] font-bold text-text-muted opacity-50">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-extrabold text-sm text-emerald-600">{tx.batch?.batchNo}</span>
                            <span className="text-[10px] font-bold text-text-muted">{tx.batch?.item.name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-extrabold text-xs">{tx.party.name}</span>
                            <span className="text-[10px] font-black text-amber-500 uppercase">{tx.party.code}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="font-mono font-black text-emerald-600">{Number(tx.netPureGoldWeight).toFixed(3)}g</span>
                      </td>

                      <td className="px-6 py-4 text-right">
                         <span className="font-mono font-black">{Number(tx.kundanWeight).toFixed(3)}g</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="font-mono font-black">{Number(tx.piroiWeight).toFixed(3)}g</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="font-mono font-black">{Number(tx.taarPattiWeight).toFixed(3)}g</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <Button 
                           variant="ghost" 
                           icon={<Eye size={16} />} 
                           className="p-2 hover:bg-emerald-500 hover:text-white"
                           onClick={() => setSelectedTx(tx)}
                         />
                      </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border bg-background/50 flex items-center justify-between px-8">
           <p className="text-xs font-bold text-text-muted">Showing {data.length} of {total} records</p>
           <div className="flex items-center gap-2">
              <Button variant="ghost" icon={<ChevronLeft size={18} />} disabled={page === 1} onClick={() => setPage(page - 1)} />
              <span className="px-4 py-1.5 bg-surface border border-border rounded-xl text-xs font-black">{page} / {totalPages || 1}</span>
              <Button variant="ghost" icon={<ChevronRight size={18} />} disabled={page === totalPages || totalPages === 0} onClick={() => setPage(page + 1)} />
           </div>
        </div>
      </div>

      <PartySearchModal 
        isOpen={partyModalOpen} 
        onClose={() => setPartyModalOpen(false)} 
        onSelect={(p) => {
          setSelectedParty(p);
          setFilters({ ...filters, partyId: p.id });
          setPage(1);
          setPartyModalOpen(false);
        }}
        partyTypes={['KARIGAR']}
      />

      {selectedTx && (
        <TransactionDetailsOverlay 
          tx={selectedTx} 
          onClose={() => setSelectedTx(null)} 
        />
      )}
    </div>
  );
}

function TransactionDetailsOverlay({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end animate-in fade-in duration-300">
       <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
       
       <aside className="relative w-full max-w-2xl h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b border-border flex items-center justify-between bg-emerald-500/5">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                   <ArrowDownLeft size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight tracking-widest uppercase">Consumable Details</h2>
                   <p className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded inline-block mt-1">RECEIVE FROM KARIGAR</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
             {/* Info Cards */}
             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-background border border-border rounded-3xl space-y-2">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                      <Package size={12} className="text-violet-500" /> Batch & Item
                   </div>
                   <div className="font-black text-lg text-emerald-600">{tx.batch.batchNo}</div>
                   <div className="text-xs font-bold">{tx.batch.item.name} ({tx.batch.item.code})</div>
                </div>
                <div className="p-6 bg-background border border-border rounded-3xl space-y-2">
                   <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                      <User size={12} className="text-blue-500" /> Karigar
                   </div>
                   <div className="font-black text-lg">{tx.party.name}</div>
                   <div className="text-[10px] font-black text-amber-500 uppercase">{tx.party.code}</div>
                </div>
             </div>

             {/* Core Weights */}
             <div className="p-8 bg-emerald-500 border border-emerald-400 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                   <Clock size={120} />
                </div>
                <div className="relative z-10 grid grid-cols-3 gap-8">
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Gross Weight</div>
                      <div className="text-3xl font-black tabular-nums">{Number(tx.grossGoldWeight).toFixed(3)}g</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Net Weight</div>
                      <div className="text-3xl font-black tabular-nums">{Number(tx.netWeight).toFixed(3)}g</div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Pure Gold (Fine)</div>
                      <div className="text-3xl font-black tabular-nums bg-white text-emerald-600 px-3 py-1 rounded-2xl inline-block mt-1">{Number(tx.netPureGoldWeight).toFixed(3)}g</div>
                   </div>
                </div>
             </div>

             {/* Consumable Breakdown */}
             <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                   <Layers size={16} /> Material Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   {[
                      { label: 'Kundan Weight', val: tx.kundanWeight, unit: 'g' },
                      { label: 'Piroi Weight', val: tx.piroiWeight, unit: 'g' },
                      { label: 'B.Stone Weight', val: tx.bStoneWeight, unit: 'g' },
                      { label: 'Stone Weight', val: tx.stoneWeight, unit: 'g' },
                      { label: 'Taar Patti Weight', val: tx.taarPattiWeight, unit: 'g' },
                      { label: 'Color Stone Weight', val: tx.colorStoneWeight, unit: 'g' },
                      { label: 'Total Stones', val: tx.totalStones, unit: 'qty' },
                      { label: 'Stone Labour', val: tx.totalStoneLabour, unit: '₹' }
                   ].map((attr) => (
                      <div key={attr.label} className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl">
                         <span className="text-[10px] font-black uppercase text-text-muted opacity-60">{attr.label}</span>
                         <span className="font-mono font-bold text-sm">
                            {attr.unit === '₹' ? '₹' : ''}
                            {attr.unit === 'qty' ? attr.val : Number(attr.val).toFixed(3)}
                            {attr.unit === 'g' ? 'g' : ''}
                         </span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </aside>
    </div>
  );
}
