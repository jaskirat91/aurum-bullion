import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, ChevronLeft, ChevronRight, 
  FileText, Calendar, Filter, Download, ArrowRight,
  Eye, CornerDownRight, Pencil, Trash2
} from 'lucide-react';
import { Button } from '@/components/Button';
import { FormField, Input } from '@/components/FormField';
import { StatusChip, StatusType } from '@/components/StatusChip';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalDetailsOverlay } from './JournalDetailsOverlay';
import { useConfirm } from '../../context/ConfirmationContext';

interface JournalEntry {
  id: string;
  voucher: {
    voucherNo: string;
    type: string;
  };
  entryDate: string;
  narration?: string;
  sourceReference?: string;
  status: string;
  createdAt: string;
}

export function JournalManager() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    voucherNo: '',
    sourceReference: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'LIST' | 'CREATE' | 'VIEW' | 'EDIT'>('LIST');
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const { confirm, alert } = useConfirm();

  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getPaginatedJournals(page, limit, filters);
      if (res.success && res.data) {
        setJournals(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch journals:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals, view]);

  const totalPages = Math.ceil(total / limit);

  if (view === 'CREATE') {
    return (
      <JournalEntryForm 
        onCancel={() => setView('LIST')} 
        onSuccess={() => {
          setView('LIST');
          fetchJournals();
        }}
      />
    );
  }

  if (view === 'EDIT' && editData) {
    return (
      <JournalEntryForm 
        onCancel={() => { setView('LIST'); setEditData(null); }} 
        onSuccess={() => {
          setView('LIST');
          setEditData(null);
          fetchJournals();
        }}
        editJournalId={editData.id}
        initialData={editData}
      />
    );
  }

  const handleExportAllCSV = async () => {
    try {
      const res = await window.electronAPI.exportJournals(filters);
      if (!res.success || !res.data) {
        console.error('Export failed:', (res as any).error);
        return;
      }

      const allJournals = res.data;
      if (allJournals.length === 0) return;
      
      const headers = [
        '#', 'Voucher No', 'Date', 'Status', 'Created At', 'Narration', 'Reference',
        'Account Name', 'Account Code', 'Debit (INR)', 'Credit (INR)', 'Debit (Gold)', 'Credit (Gold)', 'Line Narration'
      ];
      const csv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

      let rowIndex = 1;
      const csvRows: string[] = [];

      allJournals.forEach((j: any) => {
        j.ledgerEntries.forEach((le: any) => {
          const row = [
            rowIndex++,
        csv(j.voucher.voucherNo),
        csv(j.entryDate),
            csv(j.status),
            csv(new Date(j.createdAt).toLocaleString('en-IN')),
        csv(j.narration),
            csv(j.sourceReference),
            csv(le.account?.name),
            csv(le.account?.code),
            le.debitAmount || 0,
            le.creditAmount || 0,
            le.debitGold || 0,
            le.creditGold || 0,
            csv(le.narration)
          ];
          csvRows.push(row.join(','));
        });
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Journals_Complete_Export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export journals:', err);
    }
  };

  const handleEdit = async (journalId: string) => {
    try {
      const res = await window.electronAPI.getJournalDetails(journalId);
      if (res.success && res.data) {
        const details = res.data;
        const initialData = {
          id: details.id,
          voucherNo: details.voucher.voucherNo,
          entryDate: details.entryDate,
          narration: details.narration || '',
          lines: details.ledgerEntries.map((le: any) => ({
            accountId: le.accountId,
            accountName: le.account?.name || '',
            accountCode: le.account?.code || '',
            debitINR: le.debitAmount || '',
            creditINR: le.creditAmount || '',
            debitGold: le.debitGold || '',
            creditGold: le.creditGold || '',
            narration: le.narration || ''
          }))
        };
        setEditData(initialData);
        setView('EDIT');
      }
    } catch (err) {
      console.error('Failed to load journal for edit:', err);
    }
  };

  const handleDelete = async (journalId: string, voucherNo: string) => {
    const confirmed = await confirm({
      title: 'Confirm Deletion',
      message: `Are you sure you want to PERMANENTLY delete journal entry ${voucherNo}? This will also delete all associated ledger entries and cannot be undone.`,
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      const res = await window.electronAPI.deleteJournalEntry(journalId);
      if (res.success) {
        fetchJournals();
      } else {
        await alert({
          title: 'Error',
          message: 'Failed to delete journal: ' + (res as any).error,
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
    setSelectedJournalId(null);
    const initialData = {
      id: details.id,
      voucherNo: details.voucherNo,
      entryDate: details.entryDate,
      narration: details.narration || '',
      lines: details.ledgerEntries.map((le: any) => ({
        accountId: le.accountId,
        accountName: le.account?.name || '',
        accountCode: le.account?.code || '',
        debitINR: le.debitAmount || '',
        creditINR: le.creditAmount || '',
        debitGold: le.debitGold || '',
        creditGold: le.creditGold || '',
        narration: le.narration || ''
      }))
    };
    setEditData(initialData);
    setView('EDIT');
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4 overflow-auto custom-scrollbar px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text flex items-center gap-2">
              <div className="p-1.5 bg-success/10 text-success rounded-xl">
                <FileText size={22} />
              </div>
              Manage Journals
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
              Double-entry accounting ledger
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus size={16} />}
            onClick={() => setView('CREATE')}
            className="rounded-xl shadow-lg shadow-primary/10 h-10 px-4"
          >
            New Entry
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-surface/30 p-4 rounded-2xl border border-border/40 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Voucher No..."
              className="w-full bg-background/40 border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
              value={filters.voucherNo}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, voucherNo: e.target.value }));
                setPage(1);
              }}
            />
          </div>
          <Input 
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, startDate: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl h-9 text-xs"
          />
          <Input 
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, endDate: e.target.value }));
              setPage(1);
            }}
            className="rounded-xl h-9 text-xs"
          />
          <div className="flex gap-2 lg:col-span-1 xl:col-span-2">
             <Button variant="ghost" size="sm" icon={<Filter size={14} />} className="rounded-xl flex-1 h-9 text-[10px] font-black uppercase">Filter</Button>
             <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={handleExportAllCSV} className="rounded-xl flex-1 h-9 text-[10px] font-black uppercase">Export</Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="w-12 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">#</th>
                <th className="w-40 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Voucher</th>
                <th className="w-28 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Date</th>
                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Narration</th>
                <th className="w-32 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Created At</th>
                <th className="w-32 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Status</th>
                <th className="w-24 px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                      <FileText size={32} className="text-primary/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : journals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest italic">
                    No records found
                  </td>
                </tr>
              ) : (
                journals.map((journal, idx) => (
                  <tr key={journal.id} className="group hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 text-[10px] font-black text-text-muted">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md whitespace-nowrap">
                        {journal?.voucher?.voucherNo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5 text-text/70">
                        <Calendar size={12} className="text-text-muted" />
                        {new Date(journal.entryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-medium line-clamp-1 text-text/80" title={journal.narration}>
                          {journal.narration || <span className="text-text-muted/40 italic">No narration</span>}
                        </p>
                        {journal.sourceReference && (
                          <div className="flex items-center gap-1 text-[8px] font-black text-secondary uppercase tracking-widest">
                            <CornerDownRight size={8} />
                            Ref: {journal.sourceReference.length > 8 ? `${journal.sourceReference.substring(0, 8)}...` : journal.sourceReference}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-text/70">
                          {new Date(journal.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[8px] font-black text-text-muted uppercase">
                          {new Date(journal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip status={journal.status as StatusType} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setSelectedJournalId(journal.id);
                            setView('VIEW');
                          }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                        {journal.voucher.type === 'JOURNAL' && (
                          <>
                            <button 
                              onClick={() => handleEdit(journal.id)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
                              title="Edit Journal"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(journal.id, journal?.voucher?.voucherNo)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                              title="Delete Journal"
                            >
                              <Trash2 size={14} />
                            </button>
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
        <div className="flex items-center justify-between">
           <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
              Showing <span className="text-text">{(page - 1) * limit + 1}</span>-
              <span className="text-text">{Math.min(page * limit, total)}</span> of 
              <span className="text-text"> {total}</span>
           </p>
           <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                icon={<ChevronLeft size={14} />} 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 w-8 p-0"
              />
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  if (totalPages > 5 && p > 2 && p < totalPages - 1 && Math.abs(p - page) > 1) {
                    if (p === 3 || p === totalPages - 2) return <span key={p} className="text-text-muted text-[10px]">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                        page === p ? 'bg-primary text-white shadow-md' : 'hover:bg-primary/10 text-text-muted'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={<ChevronRight size={14} />} 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="h-8 w-8 p-0"
              />
           </div>
        </div>
      </div>

      {/* Detail View Overlay */}
      {view === 'VIEW' && selectedJournalId && (
        <JournalDetailsOverlay 
          journalId={selectedJournalId} 
          onClose={() => {
            setView('LIST');
            setSelectedJournalId(null);
          }} 
          onEdit={handleEditFromOverlay}
        />
      )}
    </div>
  );
}
