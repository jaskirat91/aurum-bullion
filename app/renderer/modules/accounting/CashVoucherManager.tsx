import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  UserCheck,
  Eye,
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/FormField';
import { StatusChip, StatusType } from '@/components/StatusChip';
import { CashVoucherForm } from './CashVoucherForm';
import { CashVoucherDetailsOverlay } from './CashVoucherDetailsOverlay';
import { BulkImportModal } from './BulkImportModal';
import { BankStatementReview } from './BankStatementReview';
import { useConfirm } from '../../context/ConfirmationContext';

interface CashVoucherRow {
  voucherId: string;
  voucher: {
    voucherNo: string;
    entryDate: string;
    status: string;
    narration?: string;
    type: 'RECEIPT' | 'PAYMENT';
  };
  partyAccount: { name: string; code: string };
  receiptAmount?: number;
  paymentAmount?: number;
  goldWeight?: number;
  createdAt: string;
  customerOrderVoucher?: { voucher: { voucherNo: string } };
  supplierOrderVoucher?: { voucher: { voucherNo: string } };
}

interface EditData {
  voucherId: string;
  type: 'Receipt' | 'Payment';
  accountId: string;
  accountName: string;
  entryDate: string;
  narration: string;
  partyAccountId: string;
  partyAccountName: string;
  receiptAmount?: number;
  paymentAmount?: number;
  goldRate?: number;
  goldWeight?: number;
  remarks?: string;
  remarksTime?: string;
  customerOrderVoucherId?: string;
  supplierOrderVoucherId?: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'POSTED', label: 'Posted' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'PAYMENT', label: 'Payment' },
];

export function CashVoucherManager() {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'IMPORT_REVIEW'>('LIST');
  const [vouchers, setVouchers] = useState<CashVoucherRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    voucherNo: '',
    accountName: '',
    startDate: '',
    endDate: '',
    status: '',
    type: '',
  });
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const { confirm, alert } = useConfirm();

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listCashVouchers(page, limit, {
        voucherNo: filters.voucherNo || undefined,
        accountName: filters.accountName || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
      });
      if (res.success && res.data) {
        setVouchers(res.data.items as CashVoucherRow[]);
        console.log('Cash Vouchers', JSON.stringify(res.data.items));
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch cash vouchers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers, view]);

  const totalPages = Math.ceil(total / limit);
  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleEdit = (row: CashVoucherRow) => {
    // We need more details than just the row, but let's see if we can get them
    (async () => {
      try {
        const res = await window.electronAPI.getCashVoucherDetails(row.voucherId);
        if (res.success) {
          handleEditFromOverlay(res.data);
        }
      } catch (err) {
        console.error('Failed to load voucher for edit:', err);
      }
    })();
  };

  const handleDelete = async (voucherId: string, voucherNo: string) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to PERMANENTLY delete cash voucher ${voucherNo}? This will also delete all associated ledger entries and cannot be undone.`,
      type: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      const res = await window.electronAPI.deleteCashVoucher(voucherId);
      if (res.success) {
        fetchVouchers();
      } else {
        await alert({
          title: 'Error',
          message: 'Failed to delete voucher: ' + (res as any).error,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
      await alert({
        title: 'System Error',
        message: 'A system error occurred during deletion.',
        type: 'error',
      });
    }
  };

  const handleEditFromOverlay = (details: any) => {
    setSelectedVoucherId(null);
    const ed: EditData = {
      voucherId: details.voucherId,
      type: details.voucher?.type === 'RECEIPT' ? 'Receipt' : 'Payment',
      accountId: details.accountId ?? '',
      accountName: details.account ? `${details.account.code} — ${details.account.name}` : '',
      entryDate: details.voucher?.entryDate ?? '',
      narration: details.voucher?.narration ?? '',
      partyAccountId: details.partyAccount?.id ?? '',
      partyAccountName: details.partyAccount
        ? `${details.partyAccount.code} — ${details.partyAccount.name}`
        : '',
      receiptAmount: details.receiptAmount,
      paymentAmount: details.paymentAmount,
      goldRate: details.goldRate,
      goldWeight: details.goldWeight,
      remarks: details.remarks || '',
      remarksTime: details.remarksTime || '',
      customerOrderVoucherId: details.customerOrderVoucher?.voucherId || '',
      supplierOrderVoucherId: details.supplierOrderVoucher?.voucherId || '',
    };
    setEditData(ed);
    setView('EDIT');
  };

  if (view === 'CREATE') {
    return (
      <CashVoucherForm
        onCancel={() => setView('LIST')}
        onSuccess={() => {
          setView('LIST');
          fetchVouchers();
        }}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    return (
      <CashVoucherForm
        onCancel={() => {
          setView('LIST');
          setEditData(null);
        }}
        onSuccess={() => {
          setView('LIST');
          setEditData(null);
          fetchVouchers();
        }}
        editVoucherId={editData.voucherId}
        initialData={editData}
      />
    );
  }

  if (view === 'IMPORT_REVIEW' && activeImportId) {
    return (
      <BankStatementReview
        importId={activeImportId}
        onClose={() => {
          setView('LIST');
          setActiveImportId(null);
        }}
        onSuccess={() => {
          setView('LIST');
          setActiveImportId(null);
          fetchVouchers();
        }}
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
              <div className="p-1.5 bg-primary/10 text-primary rounded-xl">
                <Wallet size={22} />
              </div>
              Cash Vouchers
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
              Cash transactions with parties
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<Upload size={16} />}
              onClick={() => setShowImportModal(true)}
              className="rounded-xl border border-border/40 h-10 px-4 font-bold text-[10px] uppercase tracking-widest"
            >
              Bulk Import
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setView('CREATE')}
              className="rounded-xl shadow-lg shadow-primary/10 h-10 px-4"
            >
              New Voucher
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 bg-surface/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={13}
            />
            <input
              type="text"
              placeholder="Voucher No..."
              value={filters.voucherNo}
              onChange={(e) => updateFilter('voucherNo', e.target.value)}
              className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
            />
          </div>
          <div className="relative">
            <UserCheck
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={13}
            />
            <input
              type="text"
              placeholder="Account name..."
              value={filters.accountName}
              onChange={(e) => updateFilter('accountName', e.target.value)}
              className="w-full bg-background/40 border border-border rounded-xl pl-8 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
            />
          </div>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
            className="rounded-xl h-9 text-xs"
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
            className="rounded-xl h-9 text-xs"
          />
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="bg-background/40 border border-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[50px]">
                  #
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">
                  Voucher No
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[90px]">
                  Type
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">
                  Date
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">
                  Account
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">
                  Order
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[200px]">
                  Narration
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[120px]">
                  Status
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right">
                  Cash AMT
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">
                  Gold WT
                </th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[120px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                      <Wallet size={32} className="text-primary/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Loading...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Wallet size={40} className="text-text-muted/20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        No cash vouchers found
                      </p>
                      <button
                        onClick={() => setView('CREATE')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all"
                      >
                        <Plus size={12} /> Create First Voucher
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                vouchers.map((row, idx) => (
                  <tr key={row.voucherId} className="group hover:bg-primary/5 transition-colors">
                    <td className="border px-3 py-2 font-black text-text-muted">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="border px-3 py-2 font-mono font-black">
                      {row.voucher?.voucherNo}
                    </td>
                    <td className="border px-3 py-2">
                      <div
                        className={`flex items-center gap-1 font-bold uppercase ${row.voucher?.type === 'RECEIPT' ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {row.voucher?.type === 'RECEIPT' ? (
                          <ArrowDownRight size={10} />
                        ) : (
                          <ArrowUpRight size={10} />
                        )}
                        {row.voucher?.type}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center gap-1.5 font-bold text-text/70 text-[10px]">
                        <Calendar size={11} className="text-text-muted" />
                        {row.voucher?.entryDate
                          ? new Date(row.voucher.entryDate).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="font-bold text-text leading-none">
                        {row.partyAccount?.name ?? '—'}
                      </div>
                      <div className="text-[9px] font-black text-text-muted uppercase">
                        {row.partyAccount?.code}
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      {row.customerOrderVoucher ? (
                        <div className="font-bold text-text leading-none">
                          {row.customerOrderVoucher?.voucher?.voucherNo}
                        </div>
                      ) : (
                        <div className="text-[9px] font-black text-text-muted uppercase">
                          {row.supplierOrderVoucher?.voucher?.voucherNo}
                        </div>
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      <p className="font-medium line-clamp-1" title={row.voucher?.narration}>
                        {row.voucher?.narration || (
                          <span className="text-text-muted/40 italic">No narration</span>
                        )}
                      </p>
                    </td>
                    <td className="border px-3 py-2">
                      <StatusChip status={row.voucher?.status as StatusType} />
                    </td>
                    <td className="border px-3 py-2 font-bold text-right text-text/80">
                      ₹{' '}
                      {(row.voucher?.type === 'RECEIPT'
                        ? row.receiptAmount
                        : row.paymentAmount
                      )?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border px-3 py-2 font-bold text-right">
                      {row.goldWeight ? row.goldWeight.toFixed(3) + 'g' : '—'}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Showing <span className="text-text">{(page - 1) * limit + 1}</span>–
              <span className="text-text">{Math.min(page * limit, total)}</span> of{' '}
              <span className="text-text">{total}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 p-0"
              />
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                  if (p === 3 || p === totalPages - 2)
                    return (
                      <span key={p} className="text-text-muted text-[10px]">
                        ...
                      </span>
                    );
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${page === p ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-text-muted'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronRight size={14} />}
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 p-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* Details Overlay */}
      {selectedVoucherId && (
        <CashVoucherDetailsOverlay
          voucherId={selectedVoucherId}
          onClose={() => setSelectedVoucherId(null)}
          onEdit={handleEditFromOverlay}
          onCancelled={() => {
            setSelectedVoucherId(null);
            fetchVouchers();
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <BulkImportModal
          onClose={() => setShowImportModal(false)}
          onImportStarted={(importId) => {
            setShowImportModal(false);
            setActiveImportId(importId);
            setView('IMPORT_REVIEW');
          }}
        />
      )}
    </div>
  );
}
