import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Calendar, Eye, ArrowDownRight, ArrowUpRight,
  Pencil, Trash2, UserCheck, CheckSquare
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormField';
import { StatusChip, StatusType } from '@/components/StatusChip';
import { SupplierOrderForm } from './SupplierOrderForm';
import { SupplierOrderDetailsOverlay } from './SupplierOrderDetailsOverlay';
import { useConfirm } from '../../context/ConfirmationContext';

interface SupplierOrderRow {
  voucherId: string;
  voucher: { 
    voucherNo: string; 
    entryDate: string; 
    status: string; 
    narration?: string;
  };
  account: { name: string; code: string };
  orderType: 'BUY' | 'SELL';
  orderStatus: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  amount?: number;
  goldWeight?: number;
  createdAt: string;
}

interface EditData {
  voucherId: string;
  orderType: 'BUY' | 'SELL';
  orderStatus: 'OPEN' | 'COMPLETED' | 'CANCELLED';
  accountId: string;
  accountName: string;
  itemId?: string;
  itemName?: string;
  entryDate: string;
  narration: string;
  amount?: number;
  goldRate?: number;
  goldWeight?: number;
}

const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'OPEN', label: 'Open' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
];

export function SupplierOrderManager() {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [vouchers, setVouchers] = useState<SupplierOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ voucherNo: '', accountName: '', startDate: '', endDate: '', orderStatus: '', orderType: '' });
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const { confirm, alert } = useConfirm();

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listSupplierOrders(page, limit, {
        voucherNo: filters.voucherNo || undefined,
        accountName: filters.accountName || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        orderStatus: filters.orderStatus || undefined,
        orderType: filters.orderType || undefined,
      });
      if (res.success && res.data) {
        setVouchers(res.data.items as SupplierOrderRow[]);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch supplier orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers, view]);

  const totalPages = Math.ceil(total / limit);
  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleEdit = (row: SupplierOrderRow) => {
    (async () => {
      try {
        const res = await window.electronAPI.getSupplierOrderDetails(row.voucherId);
        if (res.success) {
          handleEditFromOverlay(res.data);
        }
      } catch (err) {
        console.error('Failed to load order for edit:', err);
      }
    })();
  };

  const handleDelete = async (voucherId: string, voucherNo: string) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to PERMANENTLY delete supplier order ${voucherNo}? This will also delete all associated ledger entries and cannot be undone.`,
      type: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const res = await window.electronAPI.deleteSupplierOrder(voucherId);
      if (res.success) {
        fetchVouchers();
      } else {
        await alert({
          title: 'Error',
          message: 'Failed to delete order: ' + (res as any).error,
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
      await alert({
        title: 'System Error',
        message: 'A system error occurred during deletion.',
        type: 'error'
      });
    }
  };

  const handleEditFromOverlay = (details: any) => {
    setSelectedVoucherId(null);
    const ed: EditData = {
      voucherId: details.voucherId,
      orderType: details.orderType,
      orderStatus: details.orderStatus,
      accountId: details.accountId ?? '',
      accountName: details.account ? `${details.account.code} — ${details.account.name}` : '',
      itemId: details.itemId ?? '',
      itemName: details.item ? `${details.item.code} — ${details.item.name}` : '',
      entryDate: details.voucher?.entryDate ?? '',
      narration: details.voucher?.narration ?? '',
      amount: details.amount,
      goldRate: details.goldRate,
      goldWeight: details.goldWeight,
    };
    setEditData(ed);
    setView('EDIT');
  };

  if (view === 'CREATE') {
    return (
      <SupplierOrderForm
        onCancel={() => setView('LIST')}
        onSuccess={() => { setView('LIST'); fetchVouchers(); }}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    return (
      <SupplierOrderForm
        onCancel={() => { setView('LIST'); setEditData(null); }}
        onSuccess={() => { setView('LIST'); setEditData(null); fetchVouchers(); }}
        editVoucherId={editData.voucherId}
        initialData={editData}
      />
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4 overflow-auto custom-scrollbar px-6 py-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 text-primary rounded-xl"><CheckSquare size={22} /></div>
              Supplier Orders
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Manage Supplier Orders</p>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setView('CREATE')} className="rounded-xl shadow-lg shadow-primary/10 h-10 px-4">
            New Order
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-surface/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
            <input type="text" placeholder="Order No..." value={filters.voucherNo}
              onChange={e => updateFilter('voucherNo', e.target.value)}
              className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text" />
          </div>
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
            <input type="text" placeholder="Supplier name..." value={filters.accountName}
              onChange={e => updateFilter('accountName', e.target.value)}
              className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text" />
          </div>
          <Input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} className="rounded-xl h-9 text-xs" />
          <Input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} className="rounded-xl h-9 text-xs" />
          <select value={filters.orderType} onChange={e => updateFilter('orderType', e.target.value)}
            className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.orderStatus} onChange={e => updateFilter('orderStatus', e.target.value)}
            className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text">
            {ORDER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">#</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">Order No</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[90px]">Type</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Supplier</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[200px]">Narration</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">Status</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right">Amount</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">Gold WT</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                    <CheckSquare size={32} className="text-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </div>
                </td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <CheckSquare size={40} className="text-text-muted/20" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No orders found</p>
                    <button onClick={() => setView('CREATE')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                      <Plus size={12} /> Create First Order
                    </button>
                  </div>
                </td></tr>
              ) : vouchers.map((row, idx) => (
                <tr key={row.voucherId} className="group hover:bg-primary/5 transition-colors">
                  <td className="border px-3 py-2 font-black text-text-muted">{(page - 1) * limit + idx + 1}</td>
                  <td className="border px-3 py-2 font-mono font-black">{row.voucher?.voucherNo}</td>
                  <td className="border px-3 py-2">
                    <div className={`flex items-center gap-1 font-bold uppercase ${row.orderType === 'BUY' ? 'text-green-500' : 'text-blue-500'}`}>
                      {row.orderType === 'BUY' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                      {row.orderType}
                    </div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex items-center gap-1.5 font-bold text-text/70 text-[10px]">
                      <Calendar size={11} className="text-text-muted" />
                      {row.voucher?.entryDate ? new Date(row.voucher.entryDate).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="font-bold text-text leading-none">{row.account?.name ?? '—'}</div>
                    <div className="text-[9px] font-black text-text-muted uppercase">{row.account?.code}</div>
                  </td>
                  <td className="border px-3 py-2">
                    <p className="font-medium line-clamp-1" title={row.voucher?.narration}>
                      {row.voucher?.narration || <span className="text-text-muted/40 italic">No narration</span>}
                    </p>
                  </td>
                  <td className="border px-3 py-2"><StatusChip status={row.orderStatus as StatusType} /></td>
                  <td className="border px-3 py-2 font-bold text-right text-text/80">
                    ₹ {(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border px-3 py-2 font-bold text-right">
                    {row.goldWeight ? row.goldWeight.toFixed(3) + "g" : '—'}
                  </td>                  
                  <td className="border px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedVoucherId(row.voucherId)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(row)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                        title="Edit Voucher"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(row.voucherId, row.voucher?.voucherNo)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                        title="Delete Voucher"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Showing <span className="text-text">{(page - 1) * limit + 1}</span>–
              <span className="text-text">{Math.min(page * limit, total)}</span> of <span className="text-text">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 w-8 p-0" />
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                  if (p === 3 || p === totalPages - 2) return <span key={p} className="text-text-muted text-[10px]">...</span>;
                  return null;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${page === p ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-text-muted'}`}>
                    {p}
                  </button>
                );
              })}
              <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="h-8 w-8 p-0" />
            </div>
          </div>
        )}
      </div>

      {/* Details Overlay */}
      {selectedVoucherId && (
        <SupplierOrderDetailsOverlay
          voucherId={selectedVoucherId}
          onClose={() => setSelectedVoucherId(null)}
          onEdit={handleEditFromOverlay}
          onCancelled={() => { setSelectedVoucherId(null); fetchVouchers(); }}
        />
      )}
    </div>
  );
}
