import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  History, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Package, 
  User, 
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers
} from 'lucide-react';
import { Button } from '@/components/Button';

interface Batch {
  id: string;
  batchNo: string;
  status: string;
  createdAt: string;
  item: { name: string; code: string };
  party: { name: string };
  assignedParty?: { name: string };
  transactions: any[];
}

export function BatchTrackingReport({ active }: { active: boolean }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ batchNo: '', status: '' });
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [summary, setSummary] = useState<{ status: string; count: number }[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedBatches(page, limit, filters);
      if (res.success) {
        setBatches(res.data?.items || []);
        setTotal(res.data?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const res = await window.electronAPI.getBatchSummary();
    if (res.success) setSummary(res.data || []);
  };

  useEffect(() => {
    if (active) {
      fetchData();
      fetchSummary();
    }
  }, [active, page, filters.status]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
            Batch Tracking Report
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">End-to-end lifecycle tracking of manufacturing batches.</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in zoom-in-95 duration-500">
        {['RECEIVED', 'WIP', 'COMPLETED', 'SOLD'].map((status) => {
          const item = summary.find(s => s.status === status);
          return (
            <div key={status} className="p-6 bg-surface border border-border rounded-3xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-1 p-0 h-full ${
                  status === 'COMPLETED' ? 'bg-emerald-500' :
                  status === 'WIP' ? 'bg-amber-500' :
                  status === 'SOLD' ? 'bg-blue-500' :
                  'bg-slate-500'
               }`} />
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                    {status == 'COMPLETED' ? 'COMPLETED (In Stock)' : status}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black tracking-tighter">{item?.count || 0}</span>
                    <span className="text-[10px] font-bold text-text-muted opacity-40 uppercase tracking-widest">Batches</span>
                  </div>
               </div>
               <div className={`absolute -right-2 -bottom-2 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity ${
                  status === 'COMPLETED' ? 'text-emerald-500' :
                  status === 'WIP' ? 'text-amber-500' :
                  status === 'SOLD' ? 'text-blue-500' :
                  'text-slate-500'
               }`}>
                  <Layers size={64} />
               </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-6 bg-surface/50 border border-border p-6 rounded-3xl shadow-sm">
        <div className="space-y-2 flex-1 min-w-[200px]">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
            <Search size={12} /> Batch Number
          </label>
          <input 
            type="text"
            placeholder="Search Batch No..."
            value={filters.batchNo}
            onChange={e => setFilters({...filters, batchNo: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-2 w-48">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1 flex items-center gap-2">
            <Filter size={12} /> Status
          </label>
          <select 
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
            className="w-full bg-background border border-border rounded-2xl px-4 py-2.5 font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="RECEIVED">RECEIVED</option>
            <option value="WIP">WIP</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="SOLD">SOLD</option>
          </select>
        </div>

        <Button variant="primary" icon={<Search size={18} />} onClick={() => { setPage(1); fetchData(); }} loading={loading}>
          Search
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="px-6 py-4 text-left w-16">Sr</th>
                <th className="px-6 py-4 text-left">Batch Info</th>
                <th className="px-6 py-4 text-left">Item Details</th>
                <th className="px-6 py-4 text-left">Assigned To</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {batches.length === 0 && !loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-20 text-center italic text-text-muted opacity-50 font-bold">No batches found matching criteria.</td>
                 </tr>
              ) : (
                batches.map((batch, idx) => (
                  <tr key={batch.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-text-muted">{(page - 1) * limit + idx + 1}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-extrabold text-sm text-primary">{batch.batchNo}</span>
                          <span className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                             <Calendar size={10} /> {new Date(batch.createdAt).toLocaleDateString()}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="font-extrabold text-sm">{batch.item.name}</span>
                          <span className="text-[10px] font-black text-violet-500 uppercase">{batch.item.code}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                             <User size={14} />
                          </div>
                          <span className="font-bold text-xs">{batch.assignedParty?.name || batch.party?.name || 'N/A'}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          batch.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          batch.status === 'WIP' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          batch.status === 'SOLD' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                       }`}>
                          {batch.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button 
                         variant="ghost" 
                         className="p-2 hover:bg-primary hover:text-white"
                         icon={<Eye size={16} />}
                         onClick={() => setSelectedBatch(batch)}
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
           <p className="text-xs font-bold text-text-muted">Showing {batches.length} of {total} batches</p>
           <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                icon={<ChevronLeft size={18} />} 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              />
              <span className="px-4 py-1.5 bg-surface border border-border rounded-xl text-xs font-black">
                {page} / {totalPages || 1}
              </span>
              <Button 
                variant="ghost" 
                icon={<ChevronRight size={18} />} 
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage(page + 1)}
              />
           </div>
        </div>
      </div>

      {/* Batch Details Modal */}
      {selectedBatch && (
        <BatchDetailsOverlay 
          batch={selectedBatch} 
          onClose={() => setSelectedBatch(null)} 
        />
      )}
    </div>
  );
}

function BatchDetailsOverlay({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  const [details, setDetails] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electronAPI.getBatchDetails(batch.batchNo).then(res => {
      if (res.success) setDetails(res.data);
      setLoading(false);
    });
  }, [batch.batchNo]);

  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end animate-in fade-in duration-300">
       <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
       
       <aside className="relative w-full max-w-3xl h-full bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
          {/* Modal Header */}
          <div className="p-8 border-b border-border flex items-center justify-between bg-primary/5">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                   <History size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black tracking-tight">{batch.batchNo}</h2>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                         {batch.status}
                      </span>
                      <span className="text-[10px] font-bold text-text-muted opacity-50 flex items-center gap-1">
                         <Clock size={10} /> Created: {new Date(batch.createdAt).toLocaleString()}
                      </span>
                   </div>
                </div>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
             {loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                   <p className="font-black uppercase tracking-widest text-xs">Loading Timeline...</p>
                </div>
             ) : (
                <div className="space-y-12">
                   {/* Summary Cards */}
                   <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-background border border-border rounded-3xl space-y-2">
                         <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                            <Package size={12} className="text-violet-500" /> Item
                         </div>
                         <div className="font-black text-lg">{details?.item.name}</div>
                         <div className="text-[10px] font-bold text-violet-500">{details?.item.code}</div>
                      </div>
                      <div className="p-6 bg-background border border-border rounded-3xl space-y-2">
                         <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                            <User size={12} className="text-blue-500" /> Source
                         </div>
                         <div className="font-black text-lg truncate">{details?.party.name}</div>
                      </div>
                      <div className="p-6 bg-background border border-border rounded-3xl space-y-2">
                         <div className="text-[10px] font-black uppercase text-text-muted tracking-widest flex items-center gap-2">
                            <Layers size={12} className="text-emerald-500" /> Activities
                         </div>
                         <div className="font-black text-lg">{details?.transactions.length} Steps</div>
                      </div>
                   </div>

                   {/* Timeline */}
                   <div className="space-y-6 relative">
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2 mb-8">
                         <History size={16} /> Transaction Timeline
                      </h3>
                      
                      <div className="absolute left-6 top-16 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />

                      <div className="space-y-10 pl-16">
                         {details?.transactions.map((tx: any, idx: number) => (
                            <div key={tx.id} className="relative group">
                               {/* Dot */}
                               <div className={`absolute -left-[54px] top-6 w-12 h-12 rounded-2xl border-4 border-surface shadow-xl flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${
                                  tx.type === 'RECEIPT' ? 'bg-emerald-500 text-white' : 
                                  tx.type === 'ISSUE_TO_KARIGAR' ? 'bg-amber-500 text-white' :
                                  'bg-blue-500 text-white'
                               }`}>
                                  {tx.type === 'RECEIPT' ? <ArrowDownLeft size={20} /> : 
                                   tx.type === 'ISSUE_TO_KARIGAR' ? <ArrowUpRight size={20} /> :
                                   <ArrowDownLeft size={20} />}
                               </div>

                               <div className="bg-background border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/30">
                                  <div className="flex items-center justify-between mb-4">
                                     <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                           tx.type === 'RECEIPT' ? 'text-emerald-500' : 
                                           tx.type === 'ISSUE_TO_KARIGAR' ? 'text-amber-500' :
                                           'text-blue-500'
                                        }`}>{tx.type.replace(/_/g, ' ')}</span>
                                        <span className="text-xs font-bold text-text-muted opacity-60">{new Date(tx.createdAt).toLocaleString()}</span>
                                     </div>
                                     <div className="text-right">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">Party</div>
                                        <div className="font-bold text-sm text-primary">{tx.party?.name || 'N/A'}</div>
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-4 gap-4 p-4 bg-surface/50 rounded-2xl border border-border/50">
                                     <div className="text-center border-r border-border/50 last:border-0">
                                        <div className="text-[9px] font-black text-text-muted uppercase">Gross</div>
                                        <div className="font-mono font-black text-sm">{Number(tx.grossGoldWeight).toFixed(3)}g</div>
                                     </div>
                                     <div className="text-center border-r border-border/50 last:border-0">
                                        <div className="text-[9px] font-black text-text-muted uppercase">Net Gold</div>
                                        <div className="font-mono font-black text-sm">{Number(tx.netWeight).toFixed(3)}g</div>
                                     </div>
                                     <div className="text-center border-r border-border/50 last:border-0">
                                        <div className="text-[9px] font-black text-text-muted uppercase">Pure (Fine)</div>
                                        <div className="font-mono font-black text-sm text-primary">{Number(tx.netPureGoldWeight).toFixed(3)}g</div>
                                     </div>
                                     <div className="text-center last:border-0">
                                        <div className="text-[9px] font-black text-text-muted uppercase">Lab/Stn</div>
                                        <div className="font-mono font-black text-sm">₹{Number(tx.totalStoneLabour || 0).toFixed(0)}</div>
                                     </div>
                                  </div>
                                  
                                  {tx.totalStones > 0 && (
                                     <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-text-muted px-2">
                                        <span className="flex items-center gap-1"><Layers size={10} /> {tx.totalStones} Stones</span>
                                        <span className="flex items-center gap-1"><Package size={10} /> Kundan: {tx.kundanWeight}g</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}
          </div>
       </aside>
    </div>
  );
}
