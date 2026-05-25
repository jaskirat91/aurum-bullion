import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Plus, Search, ChevronLeft, ChevronRight,
  Calendar, UserCheck, Pencil, Trash2, Package, X as CloseIcon
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useConfirm } from '../../context/ConfirmationContext';
import { ReceiveRawMaterialForm } from './ReceiveRawMaterialForm';
import { ItemSelect } from '@/components/ItemSelect';

interface BatchRow {
  id: string;
  batchNo: string;
  itemId: string;
  sourcePartyId: string;
  status: string;
  createdAt: string;
  item: { id: string; name: string; code: string };
  party: { id: string; name: string; code: string };
  transactions: any[];
}

const STATUS_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'WIP', value: 'WIP' },
  { label: 'Completed', value: 'COMPLETED' },
];

export function ReceiveRawMaterial({ active }: { active?: boolean }) {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    batchNo: '', 
    partyName: '', 
    itemId: '', 
    itemDisplay: '',
    startDate: '', 
    endDate: '',
    status: 'RECEIVED' 
  });
  const [editData, setEditData] = useState<any>(null);
  const { confirm, alert } = useConfirm();

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedBatches(page, limit, {
        batchNo: filters.batchNo || undefined,
        manufacturerName: filters.partyName || undefined,
        itemId: filters.itemId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
      });
      if (res.success && res.data) {
        setBatches(res.data.items as BatchRow[]);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (view === 'LIST' && active) {
      fetchBatches();
    }
  }, [view, active, fetchBatches]);

  const totalPages = Math.ceil(total / limit);
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ 
      batchNo: '', 
      partyName: '', 
      itemId: '', 
      itemDisplay: '',
      startDate: '', 
      endDate: '',
      status: 'RECEIVED' 
    });
    setPage(1);
  };

  const handleEdit = (batch: BatchRow) => {
    const trx = batch.transactions?.find(t => (t as any).type === 'RECEIPT') || batch.transactions?.[0];
    if (!trx) return;

    const initialData = {
      batchNo: batch.batchNo,
      entryDate: trx.transactionDate || new Date(batch.createdAt).toISOString().split('T')[0],
      itemId: batch.item?.id || '',
      itemDisplay: batch.item ? `${batch.item.code} - ${batch.item.name}` : '',
      partyId: batch.party?.id || '',
      partyCode: batch.party?.code || '',
      partyName: batch.party?.name || '',
      grossGoldWeight: Number(trx.grossGoldWeight).toFixed(3),
      lessWeight: Number(trx.lessWeight).toFixed(3),
      tenchPercentage: Number(trx.tenchPercentage).toFixed(2),
      wastePercentage: Number(trx.wastePercentage).toFixed(2),
      debitAccountId: (trx as any).debitAccount?.id || '',
      debitAccountDisplay: (trx as any).debitAccount?.name || '',
    };

    setEditData(initialData);
    setView('EDIT');
  };

  const handleDelete = async (batchId: string, batchNo: string) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to PERMANENTLY delete batch ${batchNo}? This will also delete associated ledger entries and transactions.`,
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const res = await window.electronAPI.deleteBatch(batchId);
      if (res.success) {
        fetchBatches();
      } else {
        await alert({
          title: 'Error',
          message: 'Failed to delete batch: ' + (res as any).error,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (view === 'CREATE') {
    return (
      <ReceiveRawMaterialForm
        onCancel={() => setView('LIST')}
        onSuccess={() => { setView('LIST'); fetchBatches(); }}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    const batchId = batches.find(b => b.batchNo === editData.batchNo)?.id;
    return (
      <ReceiveRawMaterialForm
        onCancel={() => { setView('LIST'); setEditData(null); }}
        onSuccess={() => { setView('LIST'); setEditData(null); fetchBatches(); }}
        editBatchId={batchId}
        initialData={editData}
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
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Layers size={24} /></div>
              Raw Material Receipts
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">Manage incoming raw material batches</p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={18} />} onClick={() => setView('CREATE')} className="rounded-xl shadow-lg shadow-primary/20 h-11 px-6 font-black uppercase tracking-wider text-xs">
            New Receipt
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
                <input type="text" placeholder="Party name..." value={filters.partyName}
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
        <div className="bg-surface/20 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">#</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[160px]">Batch No.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Manufacturer</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Item</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Gross WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[90px]">Less WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[80px]">Tench %</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[80px]">Waste %</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Net WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[110px]">Pure Gold WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[100px]">Status</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={13} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                    <Layers size={32} className="text-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </div>
                </td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package size={40} className="text-text-muted/20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No raw material receipts found</p>
                    <button onClick={() => setView('CREATE')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                      <Plus size={12} /> Create First Receipt
                    </button>
                  </div>
                </td></tr>
              ) : batches.map((row, idx) => {
                const trx = row.transactions?.[0];
                return (
                  <tr key={row.id} className="group hover:bg-primary/5 transition-colors">
                    <td className="border px-3 py-2 font-black text-text-muted opacity-50">{(page - 1) * limit + idx + 1}</td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center gap-1.5 font-bold text-text/70 text-[10px]">
                        <Calendar size={11} className="text-text-muted" />
                        {trx?.transactionDate ? new Date(trx.transactionDate).toLocaleDateString() : new Date(row.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-mono font-black text-primary bg-primary/5 px-2 py-1 rounded-lg inline-block">{row.batchNo}</div>
                    </td>                    
                    <td className="border px-3 py-2">
                      <div className="font-bold text-text leading-none">{row.party?.name ?? '—'}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase">{row.party?.code}</div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-bold text-text leading-none">{row.item?.name ?? '—'}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase">{row.item?.code}</div>
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-text/80">
                      {trx?.grossGoldWeight ? Number(trx.grossGoldWeight).toFixed(3) + "g" : '0.000g'}
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-danger/60">
                      {trx?.lessWeight ? Number(trx.lessWeight).toFixed(3) + "g" : '0.000g'}
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-text/60">
                      {trx?.tenchPercentage ? Number(trx.tenchPercentage).toFixed(2) + "%" : '0.00%'}
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-text/60">
                      {trx?.wastePercentage ? Number(trx.wastePercentage).toFixed(2) + "%" : '0.00%'}
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-text/80">
                      {trx?.netWeight ? Number(trx.netWeight).toFixed(3) + "g" : '0.000g'}
                    </td>
                    <td className="border px-3 py-2 font-black text-right text-primary">
                      {trx?.netPureGoldWeight ? Number(trx.netPureGoldWeight).toFixed(3) + "g" : '0.000g'}
                    </td>
                    <td className="border px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            row.status === 'RECEIVED' ? 'bg-blue-500 text-white' :
                            row.status === 'WIP' ? 'bg-amber-500 text-white' :
                            'bg-emerald-500 text-white'
                        }`}>
                            {row.status}
                        </span>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(row)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                          title="Edit Receipt"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id, row.batchNo)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                          title="Delete Receipt"
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
        {total > 0 && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Showing <span className="text-text">{(page - 1) * limit + 1}</span>–
              <span className="text-text">{Math.min(page * limit, total)}</span> of <span className="text-text">{total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0 rounded-lg" />
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                  if (p === 3 || p === totalPages - 2) return <span key={p} className="text-text-muted text-[10px] font-bold px-1">...</span>;
                  return null;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary/10 text-text-muted'}`}>
                    {p}
                  </button>
                );
              })}
              <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0 rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
