import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { ItemSelect } from '@/components/ItemSelect';
import { Button } from '@/components/Button';
import { Alert, StatusChip } from '@/components/StatusChip';
import { useConfirm } from '@/context/ConfirmationContext';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  User,
  CheckCircle2,
  Tag,
  Layers,
  Package,
  Eye,
  X,
  Scale,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Zap,
  Percent,
  Calculator
} from 'lucide-react';

interface FinishedProduct {
  id: string;
  tag: string;
  batchId: string;
  partyId?: string;
  finishedItemId: string;
  grossWeight: number;
  kundanWeight: number;
  stoneWeight: number;
  mottiWeight: number;
  piroiWeight: number;
  netWeight: number;
  purityPercentage: number;
  pureGoldWeight: number;
  labourCost: number;
  tagGrossWeight: number;
  tagKundanWeight: number;
  tagStoneWeight: number;
  tagMottiWeight: number;
  tagNetWeight: number;
  tagAmount: number;
  totalStones: number;
  bStoneWeight: number;
  colorStoneWeight: number;
  taarPattiWeight: number;
  grossWeightOfItems: number;
  status: 'IN_STOCK' | 'SOLD';
  createdAt: string;
  finishedItem?: { name: string; code: string };
  batch?: { batchNo: string };
  party?: { name: string; code: string };
  soldGoldPercentage?: number;
  soldGoldWeight?: number;
  soldAmountPercentage?: number;
  soldAmount?: number;
  transactionDate?: string;
}

export function FinishedStock({ active }: { active?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: FinishedProduct[]; total: number; totals?: any }>({ items: [], total: 0 });
  const { confirm } = useConfirm();
  const [error, setError] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Filters
  const [filters, setFilters] = useState({
    itemId: '',
    batchNo: '',
    status: '' as '' | 'IN_STOCK' | 'SOLD',
    startDate: '',
    endDate: '',
    grossWeight: '',
    page: 1,
    limit: 10,
  });

  const [viewProduct, setViewProduct] = useState<FinishedProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<FinishedProduct | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listFinishedProducts({
        itemId: filters.itemId || undefined,
        batchNo: filters.batchNo || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        grossWeight: filters.grossWeight || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError({ type: 'error', msg: (res as any).error || 'Failed to fetch stock' });
      }
    } catch (err) {
      setError({ type: 'error', msg: 'System error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (active) {
      fetchData();
    }
  }, [active, filters.itemId, filters.batchNo, filters.status, filters.startDate, filters.endDate, filters.grossWeight, filters.page, filters.limit]);

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listFinishedProducts({
        itemId: filters.itemId || undefined,
        batchNo: filters.batchNo || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        grossWeight: filters.grossWeight || undefined,
        page: 1,
        limit: 1000000,
      });
      if (res.success && res.data) {
        const items = res.data.items;
        const headers = ['Tag', 'Item', 'Batch', 'Date', 'Gross WT', 'KN WT', 'Motti WT', 'ST WT', 'Net WT', 'Amt', 'Status', 'Party'];
        const csvRows = [
          headers.join(','),
          ...items.map((item: any) => [
            `"${item.tag}"`,
            `"${item.finishedItem?.name || ''}"`,
            `"${item.batch?.batchNo || ''}"`,
            `"${new Date(item.transactionDate || item.createdAt).toLocaleDateString()}"`,
            item.tagGrossWeight,
            item.tagKundanWeight,
            item.tagMottiWeight,
            item.tagStoneWeight,
            item.tagNetWeight,
            item.tagAmount,
            item.status,
            `"${item.party?.name || ''}"`
          ].join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FinishedStock_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (err) {
      setError({ type: 'error', msg: 'Failed to download CSV' });
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(data.total / filters.limit);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] overflow-hidden animate-in fade-in duration-500 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Archive size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter uppercase">Finished Stock</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none mt-1">Inventory Management</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-surface/50 p-2 rounded-2xl border border-border/50">
          <Button 
            variant="primary" 
            onClick={() => {
              setEditProduct(null);
              setIsModalOpen(true);
            }}
            className="h-9 px-2 text-xs flex items-center gap-2"
          >
            <Plus size={16} />
            Add Stock
          </Button>
        </div>

      </div>
      {/* Filters */}
      <div className="flex items-center gap-3 bg-surface/50 p-2 rounded-2xl border border-border/50">
          <div className="w-40">
            <ItemSelect
              label=""
              placeholder="Filter by Item"
              value={filters.itemId}
              displayValue={filters.itemId ? 'Item Selected' : ''}
              onChange={(id) => setFilters({ ...filters, itemId: id, page: 1 })}
              required={false}
              categoryFilter={['FINISHED_GOOD']}
            />
          </div>
          <div className="w-40">
            <Input
              placeholder="Filter by Batch"
              value={filters.batchNo}
              onChange={(e) => setFilters({ ...filters, batchNo: e.target.value, page: 1 })}
              className="h-9 px-3 text-[11px] font-bold"
            />
          </div>
          <div className="w-24">
            <Input
              placeholder="Gross Wt."
              value={filters.grossWeight}
              onChange={(e) => setFilters({ ...filters, grossWeight: e.target.value, page: 1 })}
              className="h-9 px-3 text-[11px] font-bold"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
            className="h-9 px-3 rounded-lg border border-border bg-surface text-[11px] font-bold focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="SOLD">Sold</option>
          </select>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black uppercase text-text-muted">From</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                className="h-9 px-2 rounded-lg border border-border bg-surface text-[10px] font-bold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black uppercase text-text-muted">To</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                className="h-9 px-2 rounded-lg border border-border bg-surface text-[10px] font-bold focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <Button variant="ghost" onClick={() => {
            setFilters({ itemId: '', batchNo: '', status: '', startDate: '', endDate: '', grossWeight: '', page: 1, limit: 10 });
          }} className="h-9 px-3 text-xs">
            Reset
          </Button>
          <Button 
            variant="primary" 
            onClick={downloadCSV}
            className="h-9 px-2 text-xs"
          >
            Download CSV
          </Button>
        </div>      

      {error && <div className="px-2 shrink-0"><Alert type={error.type} message={error.msg} onClose={() => setError(null)} /></div>}

      {/* Table Section */}
      <div className="flex-1 bg-surface rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-surface z-10 border-b border-border shadow-sm">
              {data.totals && (
                <tr className="bg-primary/5 font-black text-[10px]">
                  <th className="border p-2 text-center uppercase tracking-widest text-primary" colSpan={4}>Total</th>
                  <th className="border p-2 text-right text-primary">{data.totals.grossWeight.toFixed(3)}g</th>
                  <th className="border p-2 text-right text-primary">{data.totals.kundanWeight.toFixed(3)}g</th>
                  <th className="border p-2 text-right text-primary">{data.totals.mottiWeight.toFixed(3)}g</th>
                  <th className="border p-2 text-right text-primary">{data.totals.stoneWeight.toFixed(3)}g</th>
                  <th className="border p-2 text-right text-primary">{data.totals.netWeight.toFixed(3)}g</th>
                  <th className="border p-2 text-right text-primary">{data.totals.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</th>
                  <th className="border p-2" colSpan={2}></th>
                </tr>
              )}
              <tr>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest w-10">#</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">Tag / Item</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">Batch</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">Created At</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">Gross WT.</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">KN. WT.</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">MOTTI. WT.</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">ST. WT.</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">NET. WT.</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">AMT</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest">Status / Party</th>
                <th className="border p-2 text-left font-black uppercase text-text-muted tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted animate-pulse text-xs">
                    Loading Stock Data...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted opacity-50 text-xs italic">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                data.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-2 border font-black text-text-muted/40">
                      {(filters.page - 1) * filters.limit + index + 1}
                    </td>
                    <td className="p-2 border text-[10px]">
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono  font-black text-primary truncate">{item.tag || 'N/A'}</span>
                        <span className=" font-bold uppercase">{item.finishedItem?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-2 truncate border">
                      <span className=" font-mono font-black py-0.5 px-2 bg-muted rounded-md border border-border/50">
                        {item.batch?.batchNo || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2 font-bold uppercase border">
                      {new Date(item.transactionDate || item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagGrossWeight.toFixed(3)}g
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagKundanWeight.toFixed(3)}g
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagMottiWeight.toFixed(3)}g
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagStoneWeight.toFixed(3)}g
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagNetWeight.toFixed(3)}g
                    </td>
                    <td className="p-2 text-right font-bold border">
                      {item.tagAmount.toFixed(2)}
                    </td>
                    <td className="p-2 border">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className={` font-black uppercase px-2 py-0.5 rounded-full w-fit ${
                          item.status === 'SOLD' ? 'bg-danger/10 text-danger' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.status}
                        </span>
                        {item.party && (
                          <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                            <User size={8} className="text-text-muted shrink-0" />
                            <span className=" font-bold truncate">{item.party.name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center border">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewProduct(item)}
                          className="h-7 w-7 !p-0 rounded-lg hover:bg-primary/10 text-primary transition-all border border-primary/20"
                          title="View Full Details"
                          icon={<Eye size={14} />}
                        />
                        {item.status === 'IN_STOCK' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditProduct(item);
                                setIsModalOpen(true);
                              }}
                              className="h-7 w-7 !p-0 rounded-lg hover:bg-amber-500/10 text-amber-500 transition-all border border-amber-500/20"
                              title="Edit Product"
                              icon={<Edit2 size={14} />}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Confirm Delete',
                                  message: 'Are you sure you want to delete this finished stock? This action cannot be undone.',
                                  type: 'warning',
                                  confirmLabel: 'Delete Now',
                                  cancelLabel: 'Cancel'
                                });

                                if (confirmed) {
                                  setLoading(true);
                                  const res = await window.electronAPI.deleteFinishedProduct(item.id);
                                  if (res.success) {
                                    setError({ type: 'success', msg: 'Stock deleted successfully' });
                                    fetchData();
                                  } else {
                                    setError({ type: 'error', msg: res.error || 'Failed to delete' });
                                  }
                                  setLoading(false);
                                }
                              }}
                              className="h-7 w-7 !p-0 rounded-lg hover:bg-danger/10 text-danger transition-all border border-danger/20"
                              title="Delete Product"
                              icon={<Trash2 size={14} />}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-border flex items-center justify-between bg-surface/30 px-6 shrink-0">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            Showing {data.items.length} of {data.total} items
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              className="h-7 w-7 !p-0 rounded-lg border border-border"
              icon={<ChevronLeft size={14} />}
            />
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setFilters({ ...filters, page: p })}
                    className={`h-7 w-7 text-[9px] font-black rounded-lg transition-all ${
                      filters.page === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-muted text-text-muted'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={filters.page === totalPages || totalPages === 0}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              className="h-7 w-7 !p-0 rounded-lg border border-border"
              icon={<ChevronRight size={14} />}
            />
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setViewProduct(null)} />
           <div className="relative w-full max-w-4xl bg-surface rounded-[2rem] border-2 border-primary/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                   <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Eye size={20} />
                   </div>
                   <div>
                      <h3 className="text-lg font-black tracking-tight leading-none uppercase">Product Details</h3>
                      <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mt-0.5">Full Audit & specification view</p>
                   </div>
                </div>
                <button onClick={() => setViewProduct(null)} className="h-8 w-8 bg-surface rounded-full flex items-center justify-center border border-border hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-all text-text-muted">
                   <X size={16} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 <div className="grid grid-cols-12 gap-6">
                    {/* Left: Basic Info & Status */}
                    <div className="col-span-4 space-y-4">
                       <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">                        
                          <span className="text-[8px] font-black text-primary/60 uppercase tracking-[0.2em] block mb-1">Tag Number</span>
                          <span className="text-sm font-black font-mono text-primary leading-none block">{viewProduct.tag}</span>
                          <div className="mt-4 flex items-center gap-2">
                             <Package size={12} className="text-text-muted" />
                             <span className="text-[10px] font-bold text-text-muted uppercase">{viewProduct.finishedItem?.name}</span>
                          </div>
                       </div>

                       <div className="p-4 bg-surface border border-border rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                             <span className="font-extrabold text-text-muted uppercase">Status</span>
                             <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${viewProduct.status === 'SOLD' ? 'bg-danger text-white' : 'bg-emerald-500 text-white'}`}>
                                {viewProduct.status}
                             </span>
                          </div>
                          <div className="h-px bg-border/50" />
                          <div className="flex justify-between items-center text-[10px]">
                             <span className="font-extrabold text-text-muted uppercase">Audit Date</span>
                             <span className="font-black font-mono">
                                {new Date(viewProduct.createdAt).toLocaleString()}
                             </span>
                          </div>
                       </div>

                       {viewProduct.party && (
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                             <div className="flex items-center gap-2 mb-2">
                                <User size={14} className="text-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Customer / Party</span>
                             </div>
                             <div className="font-black text-sm">{viewProduct.party.code} - {viewProduct.party.name}</div>
                          </div>
                       )}
                    </div>

                    {/* Right: Detailed Specification */}
                    <div className="col-span-8 space-y-6">
                       <div className="grid grid-cols-3 gap-3">
                          <DetailCard icon={<Scale size={12} />} label="Gross Weight" value={viewProduct.grossWeight} unit="g" />
                          <DetailCard icon={<Zap size={12} />} label="Net Weight" value={viewProduct.netWeight} unit="g" color="text-primary" />
                          <DetailCard icon={<Percent size={12} />} label="Purity" value={viewProduct.purityPercentage} unit="%" color="text-amber-600" />
                          <DetailCard icon={<CheckCircle2 size={12} />} label="Pure Gold" value={viewProduct.pureGoldWeight} unit="g" color="text-emerald-600" />
                          <DetailCard icon={<Calculator size={12} />} label="Labour Cost" value={viewProduct.labourCost} unit="₹" prefix />
                          <DetailCard icon={<Layers size={12} />} label="Batch Ref" value={viewProduct.batch?.batchNo || 'N/A'} isText />
                       </div>

                       <div className="bg-surface border border-border rounded-2xl p-4 overflow-hidden relative">
                          <div className="flex items-center gap-2 mb-4">
                             <Tag size={14} className="text-primary" />
                             <span className="text-[10px] font-black uppercase text-primary tracking-widest">Tag Printing Specification</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                             <TinyStat label="Tag Gross" value={viewProduct.tagGrossWeight} />
                             <TinyStat label="Tag Net" value={viewProduct.tagNetWeight} highlight />
                             <TinyStat label="Tag Kundan" value={viewProduct.tagKundanWeight} />
                             <TinyStat label="Tag Motti" value={viewProduct.tagMottiWeight} />
                             <TinyStat label="Tag Stone" value={viewProduct.tagStoneWeight} />
                             <div className="col-span-2 p-2 bg-emerald-500/10 rounded-lg flex flex-col justify-center">
                                <span className="text-[7px] font-black text-emerald-600 uppercase mb-0.5">Final Tag Amount</span>
                                <span className="text-sm font-black text-emerald-600 font-mono">₹ {viewProduct.tagAmount.toLocaleString()}</span>
                             </div>
                          </div>
                       </div>

                       <div className="bg-surface border border-border rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-4">
                             <Calculator size={14} className="text-text-muted" />
                             <span className="text-[10px] font-black uppercase text-text-muted tracking-widest">Weights of Items</span>
                          </div>
                          <div className="grid grid-cols-5 gap-4">
                             <TinyStat label="Kundan" value={viewProduct.kundanWeight} />
                             <TinyStat label="Stone" value={viewProduct.stoneWeight} />
                             <TinyStat label="Motti" value={viewProduct.mottiWeight} />
                             <TinyStat label="Piroi" value={viewProduct.piroiWeight} />
                             <TinyStat label="Taar-Patti" value={viewProduct.taarPattiWeight} />
                             <TinyStat label="B-Stone" value={viewProduct.bStoneWeight} />
                             <TinyStat label="Color Stone" value={viewProduct.colorStoneWeight} />
                             <TinyStat label="Gross of Items" value={viewProduct.grossWeightOfItems} highlight />
                             <TinyStat label="Total Stones" value={viewProduct.totalStones} isInt />
                          </div>
                       </div>

                       {viewProduct.status === 'SOLD' && (
                          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-4">
                             <div className="flex items-center gap-2 mb-4">
                                <DollarSign size={14} className="text-danger" />
                                <span className="text-[10px] font-black uppercase text-danger tracking-widest">Sale Details</span>
                             </div>
                             <div className="grid grid-cols-4 gap-4">
                                <TinyStat label="Sale Gold %" value={viewProduct.soldGoldPercentage || 0} isPercent />
                                <TinyStat label="Sold Gold WT" value={viewProduct.soldGoldWeight || 0} unit="g" />
                                <TinyStat label="Sale INR %" value={viewProduct.soldAmountPercentage || 0} isPercent />
                                <TinyStat label="Realized Amt" value={viewProduct.soldAmount || 0} unit="₹" prefix />
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isModalOpen && (
        <FinishedProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditProduct(null);
          }}
          product={editProduct}
          onSuccess={(msg) => {
            setIsModalOpen(false);
            setEditProduct(null);
            setError({ type: 'success', msg });
            fetchData();
          }}
        />
      )}
    </div>
  );
};

const ViewProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  viewProduct: FinishedProduct;
}> = ({ isOpen, onClose, viewProduct }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="grid grid-cols-12 max-h-[90vh]">
          {/* Left: Product Overview */}
          <div className="col-span-4 bg-surface-muted/50 p-8 border-r border-border overflow-y-auto">
            <div className="space-y-8">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Package size={24} />
                </div>
                <h3 className="text-2xl font-black tracking-tighter uppercase mb-1">Product Details</h3>
                <div className="flex items-center gap-2">
                  <StatusChip status={viewProduct.status} />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    ID: {viewProduct.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={14} className="text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Tag / Reference</span>
                  </div>
                  <div className="font-mono text-xl font-black tracking-tighter text-primary">{viewProduct.tag}</div>
                </div>

                <div className="p-4 bg-surface border border-border rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={14} className="text-text-muted" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Item Specification</span>
                  </div>
                  <div className="font-black text-lg">{viewProduct.finishedItem?.code} - {viewProduct.finishedItem?.name}</div>
                </div>

                {viewProduct.party && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Customer / Party</span>
                    </div>
                    <div className="font-black text-sm">{viewProduct.party.code} - {viewProduct.party.name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Detailed Specification */}
          <div className="col-span-8 p-8 overflow-y-auto bg-surface">
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-3">
                <DetailCard icon={<Scale size={12} />} label="Gross Weight" value={viewProduct.grossWeight} unit="g" />
                <DetailCard icon={<Zap size={12} />} label="Net Weight" value={viewProduct.netWeight} unit="g" color="text-primary" />
                <DetailCard icon={<Percent size={12} />} label="Purity" value={viewProduct.purityPercentage} unit="%" color="text-amber-600" />
                <DetailCard icon={<CheckCircle2 size={12} />} label="Pure Gold" value={viewProduct.pureGoldWeight} unit="g" color="text-emerald-600" />
                <DetailCard icon={<Calculator size={12} />} label="Labour Cost" value={viewProduct.labourCost} unit="₹" prefix />
                <DetailCard icon={<Layers size={12} />} label="Batch Ref" value={viewProduct.batch?.batchNo || 'N/A'} isText />
              </div>

              <div className="bg-surface-muted/30 border border-border/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <Tag size={16} className="text-primary" />
                  <span className="text-[11px] font-black uppercase text-primary tracking-widest">Tag Printing Details</span>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  <TinyStat label="Tag Gross" value={viewProduct.tagGrossWeight} unit="g" highlight />
                  <TinyStat label="Tag Kundan" value={viewProduct.tagKundanWeight} unit="g" />
                  <TinyStat label="Tag Stone" value={viewProduct.tagStoneWeight} unit="g" />
                  <TinyStat label="Tag Motti" value={viewProduct.tagMottiWeight} unit="g" />
                  <TinyStat label="Tag Net" value={viewProduct.tagNetWeight} unit="g" highlight />
                  <TinyStat label="Tag Amount" value={viewProduct.tagAmount} unit="₹" prefix highlight />
                  <TinyStat label="Stones" value={viewProduct.totalStones} isInt />
                </div>
              </div>

              {viewProduct.status === 'SOLD' && (
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 text-primary">
                    <DollarSign size={16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Sale Transaction Info</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <TinyStat label="Sold Pure G" value={viewProduct.soldGoldWeight || 0} unit="g" highlight />
                    <TinyStat label="Gold %" value={viewProduct.soldGoldPercentage || 0} isPercent />
                    <TinyStat label="Amount %" value={viewProduct.soldAmountPercentage || 0} isPercent />
                    <TinyStat label="Realized Amt" value={viewProduct.soldAmount || 0} unit="₹" prefix />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={onClose} className="px-8 py-2 text-sm font-black uppercase tracking-widest">
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinishedProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product?: FinishedProduct | null;
  onSuccess: (msg: string) => void;
}> = ({ isOpen, onClose, product, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [formData, setFormData] = useState({
    finishedItemId: product?.finishedItemId || '',
    itemDisplay: product?.finishedItem ? `${product.finishedItem.code} - ${product.finishedItem.name}` : '',
    transactionDate: product?.transactionDate ? new Date(product.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    grossWeight: product?.grossWeight || 0,
    kundanWeight: product?.kundanWeight || 0,
    stoneWeight: product?.stoneWeight || 0,
    mottiWeight: product?.mottiWeight || 0,
    piroiWeight: product?.piroiWeight || 0,
    netWeight: product?.netWeight || 0,
    purityPercentage: product?.purityPercentage || 0,
    labourCost: product?.labourCost || 0,
    tagGrossWeight: product?.tagGrossWeight || 0,
    tagKundanWeight: product?.tagKundanWeight || 0,
    tagStoneWeight: product?.tagStoneWeight || 0,
    tagMottiWeight: product?.tagMottiWeight || 0,
    tagNetWeight: product?.tagNetWeight || 0,
    tagAmount: product?.tagAmount || 0,
    tagValue: product?.tag || '',
  });

  const dateRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<any>(null);
  const grossRef = useRef<HTMLInputElement>(null);
  const kundanRef = useRef<HTMLInputElement>(null);
  const stoneRef = useRef<HTMLInputElement>(null);
  const mottiRef = useRef<HTMLInputElement>(null);
  const netRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => dateRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update Net Weight automatically
  useEffect(() => {
    const calculatedNet = (formData.tagGrossWeight || 0) - 
                          (formData.tagKundanWeight || 0) - 
                          (formData.tagStoneWeight || 0) - 
                          (formData.tagMottiWeight || 0);
    setFormData(prev => ({ 
      ...prev, 
      tagNetWeight: calculatedNet > 0 ? Number(calculatedNet.toFixed(3)) : 0,
      // Also sync internal weights for consistency if needed
      grossWeight: prev.tagGrossWeight,
      netWeight: calculatedNet > 0 ? Number(calculatedNet.toFixed(3)) : 0,
      kundanWeight: prev.tagKundanWeight,
      stoneWeight: prev.tagStoneWeight,
      mottiWeight: prev.tagMottiWeight
    }));
  }, [formData.tagGrossWeight, formData.tagKundanWeight, formData.tagStoneWeight, formData.tagMottiWeight]);

  // Update Tag when properties change
  useEffect(() => {
    const generatedTag = `${(formData.tagGrossWeight || 0).toFixed(3)} | ${(formData.tagKundanWeight || 0).toFixed(3)} | ${(formData.tagMottiWeight || 0).toFixed(3)} | ${(formData.tagStoneWeight || 0).toFixed(3)} | ${(formData.tagNetWeight || 0).toFixed(3)} | ${(formData.tagAmount || 0).toFixed(2)}`;
    setFormData(prev => ({ ...prev, tagValue: generatedTag }));
  }, [formData.tagGrossWeight, formData.tagKundanWeight, formData.tagMottiWeight, formData.tagStoneWeight, formData.tagNetWeight, formData.tagAmount]);

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef.current?.focus) {
        nextRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        const res = await window.electronAPI.updateFinishedProduct({
          id: product.id,
          ...formData,
        });
        if (res.success) {
          onSuccess('Stock updated successfully');
        } else {
          setError({ type: 'error', msg: res.error || 'Failed to update' });
        }
      } else {
        const res = await window.electronAPI.createFinishedProduct(formData);
        if (res.success) {
          onSuccess('Stock created successfully');
        } else {
          setError({ type: 'error', msg: res.error || 'Failed to create' });
        }
      }
    } catch (err: any) {
      setError({ type: 'error', msg: err.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-muted/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              {product ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">{product ? 'Edit' : 'Add'} Finished Stock</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Manual Inventory Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-muted flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && <div className="shrink-0"><Alert type={error.type} message={error.msg} onClose={() => setError(null)} /></div>}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Receipt Date (Entry Date)" required>
              <Input
                ref={dateRef}
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, itemRef)}
                className="font-bold"
              />
            </FormField>

            <ItemSelect
              label="Finished Item"
              value={formData.finishedItemId}
              displayValue={formData.itemDisplay}
              categoryFilter={['FINISHED_GOOD']}
              inputRef={itemRef}
              onChange={(id, display) => setFormData({ ...formData, finishedItemId: id, itemDisplay: display })}
              onNext={() => grossRef.current?.focus()}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-surface-muted/30 rounded-2xl border border-border/50">
             <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Tag Specifications</div>
             
             <FormField label="Tag Gross Wt.">
               <Input
                 ref={grossRef}
                 type="number"
                 step="0.001"
                 value={formData.tagGrossWeight}
                 onChange={(e) => setFormData({ ...formData, tagGrossWeight: parseFloat(e.target.value) || 0 })}
                 onKeyDown={(e) => handleKeyDown(e, kundanRef)}
                 className="font-bold"
               />
             </FormField>

             <FormField label="Tag Kundan Wt.">
               <Input
                 ref={kundanRef}
                 type="number"
                 step="0.001"
                 value={formData.tagKundanWeight}
                 onChange={(e) => setFormData({ ...formData, tagKundanWeight: parseFloat(e.target.value) || 0 })}
                 onKeyDown={(e) => handleKeyDown(e, stoneRef)}
                 className="font-bold"
               />
             </FormField>

             <FormField label="Tag Stone Wt.">
               <Input
                 ref={stoneRef}
                 type="number"
                 step="0.001"
                 value={formData.tagStoneWeight}
                 onChange={(e) => setFormData({ ...formData, tagStoneWeight: parseFloat(e.target.value) || 0 })}
                 onKeyDown={(e) => handleKeyDown(e, mottiRef)}
                 className="font-bold"
               />
             </FormField>

             <FormField label="Tag Motti Wt.">
               <Input
                 ref={mottiRef}
                 type="number"
                 step="0.001"
                 value={formData.tagMottiWeight}
                 onChange={(e) => setFormData({ ...formData, tagMottiWeight: parseFloat(e.target.value) || 0 })}
                 onKeyDown={(e) => handleKeyDown(e, amountRef)}
                 className="font-bold"
               />
             </FormField>

             <FormField label="Tag Net Wt.">
               <Input
                 ref={netRef}
                 type="number"
                 step="0.001"
                 value={formData.tagNetWeight}
                 readOnly
                 className="font-bold bg-surface-muted cursor-not-allowed opacity-70"
               />
             </FormField>

             <FormField label="Tag Amount">
               <Input
                 ref={amountRef}
                 type="number"
                 step="0.01"
                 value={formData.tagAmount}
                 onChange={(e) => setFormData({ ...formData, tagAmount: parseFloat(e.target.value) || 0 })}
                 onKeyDown={(e) => handleKeyDown(e, submitRef)}
                 className="font-bold"
               />
             </FormField>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Generated Tag Number</div>
            <div className="text-xl font-mono font-black tracking-tighter text-primary truncate">
              {formData.tagValue || '---'}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button ref={submitRef} type="submit" variant="primary" loading={loading} className="px-8">
              {product ? 'Update Stock' : 'Save Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

function DetailCard({ icon, label, value, unit = '', color = 'text-text', prefix = false, isText = false }: any) {
  return (
    <div className="p-3 bg-surface border border-border rounded-xl">
      <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
        <span className="text-primary">{icon}</span>
        <span className="text-[8px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-sm font-black truncate font-mono ${color}`}>
        {isText ? value : `${prefix ? unit + ' ' : ''}${typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: unit === 'g' || label === 'Net Weight' || label === 'Gross Weight' ? 3 : 2 }) : value}${!prefix ? unit : ''}`}
      </div>
    </div>
  );
}

function TinyStat({ label, value, highlight = false, isInt = false, isPercent = false, unit = '', prefix = false }: any) {
  return (
    <div className={`flex flex-col ${highlight ? 'text-primary' : 'text-text-muted'}`}>
       <span className="text-[7px] font-black uppercase mb-0.5 opacity-50">{label}</span>
       <span className={`text-[11px] font-black font-mono leading-none ${highlight ? 'text-primary' : 'text-text'}`}>
          {prefix && unit}
          {isInt ? value : value.toLocaleString(undefined, { minimumFractionDigits: isPercent ? 2 : 3 })}
          {isPercent ? '%' : !prefix ? unit : ''}
       </span>
    </div>
  )
}
