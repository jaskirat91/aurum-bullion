import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  X as CloseIcon, 
  ChevronLeft, 
  ChevronRight,
  Send,
  UserCheck,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useConfirm } from '../../context/ConfirmationContext';
import { ItemSelect } from '@/components/ItemSelect';
import { IssueMaterialForm } from './IssueMaterialForm';

interface BatchRow {
  id: string;
  batchNo: string;
  itemId: string;
  sourcePartyId: string;
  assignedTo: string;
  status: string;
  createdAt: string;
  item: { id: string; name: string; code: string };
  party: { id: string; name: string; code: string }; // Original source party
  karigar?: { id: string; name: string; code: string }; // Current karigar
  transactions: any[];
}

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'WIP (Issued)', value: 'WIP' },
  { label: 'Completed', value: 'COMPLETED' }
];

export function IssueMaterial({ active }: { active?: boolean }) {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    batchNo: '', 
    partyName: '', // Karigar name
    itemId: '', 
    itemDisplay: '',
    startDate: '', 
    endDate: '',
    status: 'WIP' 
  });
  const [editData, setEditData] = useState<any>(null);
  const { confirm, alert: showModalAlert } = useConfirm();

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedBatches(page, limit, {
        batchNo: filters.batchNo || undefined,
        karigarName: filters.partyName || undefined, // This filters by assigned party in my repo update
        itemId: filters.itemId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
      });
      if (res.success && res.data) {
        setBatches(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    if (active && view === 'LIST') {
      fetchBatches();
    }
  }, [active, view, fetchBatches]);

  const handleEdit = (batch: BatchRow) => {
    const issueTrx = batch.transactions?.find(t => (t as any).type === 'ISSUE_TO_KARIGAR');
    if (!issueTrx) {
       showModalAlert({ title: 'Error', message: 'No issue transaction found for this batch.' });
       return;
    }

    const initialData = {
      batchId: batch.id,
      batchNo: batch.batchNo,
      batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Unknown Item'}`,
      entryDate: issueTrx.transactionDate || new Date(issueTrx.createdAt).toISOString().split('T')[0],
      partyId: batch.karigar?.id || issueTrx.party?.id || '',
      partyCode: batch.karigar?.code || issueTrx.party?.code || '',
      partyName: batch.karigar?.name || issueTrx.party?.name || '',
      grossGoldWeight: issueTrx.grossGoldWeight || 0,
      lessWeight: issueTrx.lessWeight || 0,
      batch: batch // Pass full batch for details view
    };

    setEditData({ transactionId: issueTrx.id, initialData });
    setView('EDIT');
  };

  const handleDelete = async (batch: BatchRow) => {
    const issueTrx = batch.transactions?.find(t => (t as any).type === 'ISSUE_TO_KARIGAR');
    if (!issueTrx) return;

    const ok = await confirm({
      title: 'Reverse Material Issue?',
      message: `Are you sure you want to reverse the issue for batch ${batch.batchNo}? This will move the batch back to RECEIVED status.`,
      confirmLabel: 'Yes, Reverse',
      type: 'warning'
    });

    if (ok) {
      try {
        const res = await window.electronAPI.reverseMaterialIssue(issueTrx.id);
        if (res.success) {
          fetchBatches();
        } else {
          showModalAlert({ title: 'Error', message: res.error || 'Failed to reverse issue.' });
        }
      } catch (err) {
        showModalAlert({ title: 'Error', message: 'System error occurred.' });
      }
    }
  };

  const updateFilter = (key: keyof typeof filters, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ batchNo: '', partyName: '', itemId: '', itemDisplay: '', startDate: '', endDate: '', status: 'WIP' });
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  if (view === 'CREATE') {
    return (
      <IssueMaterialForm 
        onCancel={() => setView('LIST')}
        onSuccess={() => { setView('LIST'); fetchBatches(); }}
        active={active}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    return (
      <IssueMaterialForm
        onCancel={() => { setView('LIST'); setEditData(null); }}
        onSuccess={() => { setView('LIST'); setEditData(null); fetchBatches(); }}
        editTransactionId={editData.transactionId}
        initialData={editData.initialData}
        active={active}
      />
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-background animate-in fade-in duration-500">
      <div className="flex-1 space-y-4 pb-4 overflow-auto custom-scrollbar px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Send size={24} /></div>
              Material Issues
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">Track batches issued to karigars</p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={18} />} onClick={() => setView('CREATE')} className="rounded-xl shadow-lg shadow-primary/20 h-11 px-6 font-black uppercase tracking-wider text-xs">
            New Issue
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-surface/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm shadow-sm">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
                <input type="text" placeholder="Batch No..." value={filters.batchNo}
                onChange={e => updateFilter('batchNo', e.target.value)}
                className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text" />
            </div>
            <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
                <input type="text" placeholder="Karigar name..." value={filters.partyName}
                onChange={e => updateFilter('partyName', e.target.value)}
                className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text" />
            </div>
            <div>
                <ItemSelect 
                    label="Item"
                    value={filters.itemId}
                    displayValue={filters.itemDisplay}
                    categoryFilter={['RAW_MATERIAL']}
                    onChange={(id, display) => {
                        setFilters(prev => ({ ...prev, itemId: id, itemDisplay: display }));
                        setPage(1);
                    }}
                    compact
                    placeholder="Search Item..."
                />
            </div>
            <input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} 
                className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text h-9" />
            <input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} 
                className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text h-9" />
            <div className="flex gap-2">
                <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}
                    className="flex-1 bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text h-9">
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button onClick={clearFilters} className="h-9 w-9 bg-background/40 border border-border rounded-xl flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/5 transition-all shrink-0">
                    <CloseIcon size={14} />
                </button>
            </div>
        </div>

        {/* Table */}
        <div className="bg-surface/20 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm overflow-hidden overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">#</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[130px]">Issue Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[170px]">Batch No.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Karigar</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Item</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Gross WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Net WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Pure Gold WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">Status</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                    <Layers size={32} className="text-primary/20" />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">Loading issues...</span>
                  </div>
                </td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-text-muted">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <History size={40} />
                    <span className="font-black uppercase tracking-[0.2em] text-[10px]">No issues found</span>
                  </div>
                </td></tr>
              ) : batches.map((row, idx) => {
                const issueTrx = row.transactions?.find(t => (t as any).type === 'ISSUE_TO_KARIGAR');
                return (
                  <tr key={row.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="border px-3 py-2 text-text-muted font-bold font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center gap-1.5 font-bold text-text/70 text-[10px]">
                        <Calendar size={11} className="text-text-muted" />
                        {issueTrx?.transactionDate ? new Date(issueTrx.transactionDate).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded-lg inline-block tracking-tighter">{row.batchNo}</div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-bold text-text leading-none">{issueTrx?.party?.name ?? '—'}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase mt-0.5">{issueTrx?.party?.code}</div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-bold text-text leading-none">{row.item?.name}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase mt-0.5">{row.item?.code}</div>
                    </td>
                    <td className="border px-3 py-2 text-right">
                      <div className="font-black text-primary text-sm">{(issueTrx?.grossGoldWeight ?? 0).toFixed(3)}g</div>                      
                    </td>
                    <td className="border px-3 py-2 text-right">
                      <div className="font-black text-primary text-sm">{(issueTrx?.netWeight ?? 0).toFixed(3)}g</div>                      
                    </td>
                    <td className="border px-3 py-2 text-right">
                      <div className="font-black text-primary text-sm">{(issueTrx?.netPureGoldWeight ?? 0).toFixed(3)}g</div>                      
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        row.status === 'WIP' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                        row.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                        'bg-text-muted/10 text-text-muted border border-border/50'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(row)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                          title="Edit Issue"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                          title="Reverse Issue"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} batches</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center px-4 bg-surface/50 border border-border rounded-xl">
                <span className="text-xs font-black text-primary">{page}</span>
                <span className="text-[10px] font-black text-text-muted mx-2">/</span>
                <span className="text-xs font-black text-text-muted">{totalPages}</span>
              </div>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
