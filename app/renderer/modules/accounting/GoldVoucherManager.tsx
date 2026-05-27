import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  FileText,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';
import { GoldVoucherForm } from './GoldVoucherForm';
import { GoldVoucherDetailsOverlay } from './GoldVoucherDetailsOverlay';
import { useConfirm } from '@/context/ConfirmationContext';

export function GoldVoucherManager() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const { confirm, alert } = useConfirm();
  const [filters, setFilters] = useState({
    voucherNo: '',
    partyName: '',
    startDate: '',
    endDate: '',
    status: '',
  });

  const limit = 10;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listGoldVouchers(page, limit, filters);
      if (res.success) {
        setItems(res?.data?.items || []);
        setTotal(res?.data?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch gold vouchers:', err);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers, showForm]);

  const handleEdit = async (voucher: any) => {
    setLoading(true);
    const res = await window.electronAPI.getGoldVoucherDetails(voucher.voucherId);
    if (res.success) {
      setEditingVoucher(res.data);
      setShowForm(true);
    }
    setLoading(false);
  };

  const handleDelete = async (voucherId: string) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: 'Are you sure you want to permanently delete this gold voucher? This will also remove all associated ledger entries.',
      type: 'warning'
    });

    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const res = await window.electronAPI.deleteGoldVoucher(voucherId);
      if (res.success) {
        fetchVouchers();
      } else {
        await alert({
          title: 'Error',
          message: res.error || 'Failed to delete voucher',
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
    setLoading(false);
  };

  if (showForm) {
    return (
      <div className="h-full flex flex-col bg-background animate-in slide-in-from-right duration-300">
        <div className="flex-1 overflow-hidden">
          <GoldVoucherForm 
            initialData={editingVoucher} 
            onSuccess={() => {
              setShowForm(false);
              setEditingVoucher(null);
              fetchVouchers();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingVoucher(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-text">Gold Vouchers</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">
                <FileText size={10} /> Accounting Module
              </span>
              <span className="text-[10px] font-bold text-text-muted">|</span>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Manage Gold & Equity</span>
            </div>
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setShowForm(true)} className="rounded-xl shadow-lg shadow-primary/10 h-10 px-4">
          New Voucher
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-surface/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input 
            type="text" 
            placeholder="Voucher No..."
            value={filters.voucherNo}
            onChange={e => setFilters({...filters, voucherNo: e.target.value})}
            className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text shadow-sm"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input 
            type="text" 
            placeholder="Account Name..."
            value={filters.partyName}
            onChange={e => setFilters({...filters, partyName: e.target.value})}
            className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text shadow-sm"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input 
            type="date" 
            value={filters.startDate}
            onChange={e => setFilters({...filters, startDate: e.target.value})}
            className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text shadow-sm"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input 
            type="date" 
            value={filters.endDate}
            onChange={e => setFilters({...filters, endDate: e.target.value})}
            className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text shadow-sm"
          />
        </div>
        <select 
          value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}
          className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text shadow-sm appearance-none"
        >
          <option value="">All Status</option>
          <option value="POSTED">Posted</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm flex flex-col min-h-0">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-surface z-10 border-b border-border shadow-sm">
              <tr className="bg-background/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">#</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">Voucher No</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[90px]">Type</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Account</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[200px]">Narration</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">Status</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[110px]">Cash AMT</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[100px]">Gold WT</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                  <TrendingUp size={32} className="text-primary/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                </div>
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <FileText size={40} className="text-text-muted/20" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No vouchers found</p>
                  <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                    <Plus size={12} /> Create First Voucher
                  </button>
                </div>
              </td></tr>
            ) : items.map((item, idx) => {
              const isIssue = (item.issueGold > 0 || item.issueAmount > 0);
              const displayGold = isIssue ? item.issueGold : item.receiptGold;
              const displayCash = isIssue ? item.issueAmount : item.receiptAmount;
              
              return (
                <tr key={item.voucherId} className="group hover:bg-primary/5 transition-colors">
                  <td className="border px-3 py-2 font-black text-text-muted">{idx + 1}</td>
                  <td className="border px-3 py-2 font-mono font-black">{item.voucher?.voucherNo}</td>
                  <td className="border px-3 py-2">
                    <div className={`flex items-center gap-1 font-bold uppercase ${!isIssue ? 'text-emerald-500' : 'text-primary'}`}>
                      {!isIssue ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                      {!isIssue ? 'RECEIPT' : 'ISSUE'}
                    </div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex items-center gap-1.5 font-bold text-text/70 text-[10px]">
                      <Calendar size={11} className="text-text-muted" />
                      {item.voucher?.entryDate ? new Date(item.voucher.entryDate).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="border px-3 py-2">
                    <div className="font-bold text-text leading-none">{item.partyAccount?.name ?? '—'}</div>
                    <div className="text-[9px] font-black text-text-muted uppercase">{item.partyAccount?.code}</div>
                  </td>
                  <td className="border px-3 py-2">
                    <p className="font-medium line-clamp-2" title={item.voucher?.narration}>
                      {item.voucher?.narration || <span className="text-text-muted/40 italic">No narration</span>}
                    </p>
                  </td>
                  <td className="border px-3 py-2"><StatusChip status={item.voucher.status} /></td>
                  <td className={`border px-3 py-2 font-black text-right ${!isIssue ? 'text-emerald-600' : 'text-primary'}`}>
                    {displayCash > 0 ? displayCash.toLocaleString('en-IN') : '—'}
                  </td>
                  <td className={`border px-3 py-2 font-black text-right ${!isIssue ? 'text-emerald-600' : 'text-primary'}`}>
                    {displayGold > 0 ? Number(displayGold).toFixed(3) : '—'}
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedVoucherId(item.voucherId)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                        title="View Details"
                      >
                        <FileText size={14} />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-600 hover:bg-amber-50 transition-all"
                        title="Edit Voucher"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.voucherId)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete Voucher"
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
    </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
            Showing <span className="text-text">{(page - 1) * limit + 1}</span>–
            <span className="text-text">{Math.min(page * limit, total)}</span> of <span className="text-text">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.ceil(total / limit) }).map((_, i) => (
              <button 
                key={i} 
                onClick={() => setPage(i + 1)}
                className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${page === i + 1 ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-text-muted'}`}
              >
                {i + 1}
              </button>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={page * limit >= total} 
              onClick={() => setPage(p => p + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Details Overlay */}
      {selectedVoucherId && (
        <GoldVoucherDetailsOverlay 
          voucherId={selectedVoucherId} 
          onClose={() => setSelectedVoucherId(null)}
          onEdit={(voucher) => {
            setSelectedVoucherId(null);
            handleEdit(voucher);
          }}
        />
      )}
    </div>
  );
}
