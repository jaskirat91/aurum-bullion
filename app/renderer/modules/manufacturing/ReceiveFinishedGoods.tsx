import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Plus, Search, ChevronLeft, ChevronRight,
  Calendar, UserCheck, Pencil, Trash2, Package, X as CloseIcon
} from 'lucide-react';
import { Button } from '@/components/Button';
import { useConfirm } from '../../context/ConfirmationContext';
import { ReceiveFinishedGoodsForm } from './ReceiveFinishedGoodsForm';

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
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'WIP (Pending)', value: 'WIP' },
];

export function ReceiveFinishedGoods({ active }: { active?: boolean }) {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ 
    batchNo: '', 
    partyName: '', 
    startDate: '', 
    endDate: '',
    status: 'COMPLETED' 
  });
  const [editData, setEditData] = useState<any>(null);
  const { confirm, alert } = useConfirm();

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedBatches(page, limit, {
        batchNo: filters.batchNo || undefined,
        karigarName: filters.partyName || undefined,
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
    if (view === 'LIST') {
      fetchBatches();
    }
  }, [view, fetchBatches]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ 
      batchNo: '', 
      partyName: '', 
      startDate: '', 
      endDate: '',
      status: 'COMPLETED' 
    });
    setPage(1);
  };

  const handleEdit = (batch: BatchRow) => {
    const receiptTrx = batch.transactions?.find((t: any) => t.type === 'RECEIVE_FROM_KARIGAR');
    if (!receiptTrx) return;

    const initialData = {
      batchNo: batch.id,
      batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Item'}`,
      batchStatus: 'COMPLETED',
      entryDate: receiptTrx.transactionDate || new Date().toISOString().split('T')[0],
      itemId: receiptTrx.finishedItemId || batch.itemId,
      itemDisplay: receiptTrx.finishedItem ? `${receiptTrx.finishedItem.code} - ${receiptTrx.finishedItem.name}` : '',
      partyId: receiptTrx.party?.id || '',
      partyCode: receiptTrx.party?.code || '',
      partyName: receiptTrx.party?.name || '',
      grossGoldWeight: receiptTrx.grossGoldWeight,
      lessWeight: receiptTrx.lessWeight,
      tenchPercentage: receiptTrx.tenchPercentage,
      wastePercentage: receiptTrx.wastePercentage,
      kundanWeight: receiptTrx.kundanWeight || 0,
      totalStones: receiptTrx.totalStones || 0,
      piroiWeight: receiptTrx.piroiWeight || 0,
      taarPattiWeight: receiptTrx.taarPattiWeight || 0,
      bStoneWeight: receiptTrx.bStoneWeight || 0,
      colorStoneWeight: receiptTrx.colorStoneWeight || 0,
      labourRate: receiptTrx.labourPerStone || 18,
      tagGrossWeight: receiptTrx.tagGrossWeight || 0,
      tagKundanWeight: receiptTrx.tagKundanWeight || 0,
      tagStoneWeight: receiptTrx.tagStoneWeight || 0,
      tagMottiWeight: receiptTrx.tagMottiWeight || 0,
      tagNetWeight: receiptTrx.tagNetWeight || 0,
      tagAmount: receiptTrx.tagAmount || 0,
    };

    setEditData(initialData);
    setView('EDIT');
  };

  const handleDelete = async (batch: BatchRow) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete the finished goods receipt for batch ${batch.batchNo}? This will revert the batch to WIP status.`,
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const fpRes = await window.electronAPI.listFinishedProducts({ batchNo: batch.batchNo });
      if (fpRes.success && fpRes.data && fpRes.data.items.length > 0) {
        const fpId = fpRes.data.items[0].id;
        const res = await window.electronAPI.deleteReceivedFinishedProduct(fpId);
        if (res.success) {
          fetchBatches();
        } else {
          await alert({ title: 'Error', message: 'Failed to delete: ' + res.error, type: 'error' });
        }
      } else {
         await alert({ title: 'Error', message: 'Could not find finished product record for this batch.', type: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (view === 'CREATE') {
    return (
      <ReceiveFinishedGoodsForm
        onCancel={() => setView('LIST')}
        onSuccess={() => { setView('LIST'); fetchBatches(); }}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    return (
      <ReceiveFinishedGoodsForm
        onCancel={() => { setView('LIST'); setEditData(null); }}
        onSuccess={() => { setView('LIST'); setEditData(null); fetchBatches(); }}
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
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl"><Layers size={24} /></div>
              Finished Goods Receipts
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">Manage receipts from karigars</p>
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
                <input type="text" placeholder="Karigar name..." value={filters.partyName}
                onChange={e => updateFilter('partyName', e.target.value)}
                className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text" />
            </div>
            <input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} 
                className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text h-9" />
            <input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} 
                className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text h-9" />
            <div className="flex gap-2 lg:col-span-2">
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
        <div className="bg-surface/20 rounded-2xl border border-border/40 shadow-sm backdrop-blur-sm overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">#</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[150px]">Batch No</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Karigar</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Finished Item</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">Gross WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">KT. WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">PR. WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">T-Patti WT.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[150px]">Labour</th>                
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                    <Layers size={32} className="text-emerald-500/30" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </div>
                </td></tr>
              ) : batches.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Package size={40} className="text-text-muted/20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No finished goods receipts found</p>
                    <button onClick={() => setView('CREATE')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">
                      <Plus size={12} /> Create First Receipt
                    </button>
                  </div>
                </td></tr>
              ) : batches.map((row, idx) => {
                const receiptTrx = row.transactions?.find(t => t.type === 'RECEIVE_FROM_KARIGAR');
                return (
                  <tr key={row.id} className="group hover:bg-emerald-500/5 transition-colors">
                    <td className="border font-bold px-3 py-2">{(page - 1) * limit + idx + 1}</td>                    
                    <td className="border font-bold px-3 py-2">
                      <div className="flex items-center gap-1.5 text-text/70 text-[10px]">
                        <Calendar size={11} className="text-text-muted" />
                        {receiptTrx?.transactionDate ? new Date(receiptTrx.transactionDate).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="border font-bold px-3 py-2">
                      <div className="font-mono font-black text-emerald-600 bg-emerald-500/5 px-2 py-1 rounded-lg inline-block">{row.batchNo}</div>
                    </td>
                    <td className="border font-bold px-3 py-2">
                      <div className=" text-text leading-none">{receiptTrx?.party?.name ?? '—'}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase">{receiptTrx?.party?.code}</div>
                    </td>
                    <td className="border font-bold px-3 py-2">
                      <div className=" text-text leading-none">{receiptTrx?.finishedItem?.name ?? row.item?.name ?? '—'}</div>
                      <div className="text-[9px] font-black text-text-muted uppercase">{receiptTrx?.finishedItem?.code ?? row.item?.code}</div>
                    </td>
                    <td className="border font-bold px-3 py-2  text-right text-text/80">
                      {receiptTrx?.grossGoldWeight ? Number(receiptTrx.grossGoldWeight).toFixed(3) + "g" : '—'}
                    </td>
                    <td className="border font-bold px-3 py-2  text-right">
                      {receiptTrx?.kundanWeight ? Number(receiptTrx.kundanWeight).toFixed(3) + "g" : '—'}
                    </td>
                    <td className="border font-bold px-3 py-2  text-right">
                      {receiptTrx?.piroiWeight ? Number(receiptTrx.piroiWeight).toFixed(3) + "g" : '—'}
                    </td>
                    <td className="border font-bold px-3 py-2  text-right">
                      {receiptTrx?.taarPattiWeight ? Number(receiptTrx.taarPattiWeight).toFixed(3) + "g" : '—'}
                    </td>
                    <td className="border font-bold px-3 py-2  text-right text-danger">
                      <div className="">{receiptTrx?.totalStoneLabour ? "₹" + receiptTrx?.totalStoneLabour  : '—'} (Stone)</div>
                      <div className=" ">{receiptTrx?.kundanWeight ? receiptTrx?.kundanWeight + "g"  : '—'} (Kundan)</div>
                    </td>
                    <td className="border font-bold px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {receiptTrx && (
                          <>
                            <button
                              onClick={() => handleEdit(row)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                              title="Edit Receipt"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                              title="Delete Receipt"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {!receiptTrx && row.status === 'WIP' && (
                          <button
                            onClick={() => {
                               populateFromBatchInForm(row);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase text-[8px]"
                          >
                             <Plus size={10} /> Receive
                          </button>
                        )}
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
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${page === p ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-emerald-500/10 text-text-muted'}`}>
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

  function populateFromBatchInForm(batch: BatchRow) {
    const trx = batch.transactions?.[0];
    const initialData = {
      batchNo: batch.id,
      batchDisplay: `${batch.batchNo} - ${batch.item?.name || 'Item'} (${trx?.grossGoldWeight.toFixed(3)}g)`,
      batchStatus: batch.status,
      tenchPercentage: 100.00,
      entryDate: new Date().toISOString().split('T')[0],
      itemId: batch.item?.id || '',
      itemDisplay: batch.item ? `${batch.item.code} - ${batch.item.name}` : '',
      partyId: batch.party?.id || '',
      partyCode: batch.party?.code || '',
      partyName: batch.party?.name || '',
    };
    setEditData(initialData);
    setView('CREATE');
  }
}
