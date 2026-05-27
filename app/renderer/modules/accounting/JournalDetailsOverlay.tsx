import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, FileText, CornerDownRight, 
  Hash, Clock, Building2, Download, Printer, Copy, Pencil, Trash2
} from 'lucide-react';
import { Button } from '../../components/Button';
import { StatusChip, StatusType } from '../../components/StatusChip';

interface LedgerEntry {
  id: string;
  accountId: string;
  account: {
    name: string;
    code: string;
    unit: 'INR' | 'GRAM';
  };
  debitAmount: number;
  creditAmount: number;
  debitGold: number;
  creditGold: number;
  narration?: string;
}

interface JournalDetails {
  id: string;
  voucherNo: string;
  entryDate: string;
  narration?: string;
  sourceReference?: string;
  status: string;
  type?: string;
  createdAt: string;
  ledgerEntries: LedgerEntry[];
}

interface JournalDetailsOverlayProps {
  journalId: string;
  onClose: () => void;
  onEdit?: (details: any) => void;
  onCancelled?: () => void;
}

export function JournalDetailsOverlay({ journalId, onClose, onEdit, onCancelled }: JournalDetailsOverlayProps) {
  const [journal, setJournal] = useState<JournalDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await window.electronAPI.getJournalDetails(journalId);
        if (res.success && res.data) {
          const details = res.data;
          setJournal({
            ...details,
            voucherNo: details.voucher?.voucherNo || '',
            type: details.voucher?.type || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch journal details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [journalId]);

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <FileText className="absolute inset-0 m-auto text-primary" size={20} />
          </div>
          <span className="font-black text-[9px] uppercase tracking-widest text-text-muted">Loading Details...</span>
        </div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-text-muted font-bold text-xs">Journal entry not found.</p>
          <Button variant="ghost" size="sm" onClick={onClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  const totalDebitINR = journal.ledgerEntries.reduce((s, le) => s + (le.debitAmount || 0), 0);
  const totalCreditINR = journal.ledgerEntries.reduce((s, le) => s + (le.creditAmount || 0), 0);
  const totalDebitGram = journal.ledgerEntries.reduce((s, le) => s + (le.debitGold || 0), 0);
  const totalCreditGram = journal.ledgerEntries.reduce((s, le) => s + (le.creditGold || 0), 0);

  const handleCopy = () => {
    if (journal) {
      navigator.clipboard.writeText(journal.voucherNo);
      // Optional: show a toast or temporary label change
    }
  };

  const handleExportCSV = () => {
    if (!journal) return;
    
    const headers = [
      'Voucher No', 'Date', 'Total Narration', 'Source Ref', 
      'Account Name', 'Account Code', 'Debit (INR)', 'Credit (INR)', 
      'Debit (Gold)', 'Credit (Gold)', 'Line Narration'
    ];
    
    // Safely escape CSV fields
    const csv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = journal.ledgerEntries.map(le => [
      csv(journal.voucherNo),
      csv(journal.entryDate),
      csv(journal.narration),
      csv(journal.sourceReference),
      csv(le.account.name),
      csv(le.account.code),
      le.debitAmount || 0,
      le.creditAmount || 0,
      le.debitGold || 0,
      le.creditGold || 0,
      csv(le.narration)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Journal_${journal.voucherNo}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    window.print(); // Fallback to browser print which allows "Save as PDF"
  };

  const handleEdit = () => {
    if (journal && onEdit) {
      onEdit(journal);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right-4 duration-500 overflow-hidden shadow-2xl rounded-2xl border border-border/40">
      {/* Header Bar */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/50 backdrop-blur-xl flex items-center px-6 gap-4">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 text-text-muted hover:text-text rounded-xl transition-all border border-transparent hover:border-border"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="h-6 w-px bg-border" />
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black tracking-tight text-text">Journal Details</h1>
            <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
              {journal.voucherNo}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={handleCopy} className="rounded-xl h-8 text-[9px] font-black uppercase">Copy</Button>
           <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={handleExportCSV} className="rounded-xl h-8 text-[9px] font-black uppercase">CSV Export</Button>
           <div className="h-5 w-px bg-border mx-1" />
           {journal.type === 'JOURNAL' && (
             <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={handleEdit} className="rounded-xl h-8 text-[9px] font-black uppercase text-amber-500 hover:bg-amber-500/10">Edit</Button>
           )}
           <Button variant="primary" size="sm" icon={<FileText size={14} />} onClick={handlePDF} className="rounded-xl h-8 text-[9px] font-black uppercase shadow-lg shadow-primary/10">Export PDF</Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Summary Row */}
          <div className="grid grid-cols-4 gap-4">
             <div className="bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted">
                   <Calendar size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Entry Date</span>
                </div>
                <p className="text-sm font-black text-text">{new Date(journal.entryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
             </div>
             
             <div className="bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted">
                   <Clock size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Posted Time</span>
                </div>
                <p className="text-sm font-black text-text">{new Date(journal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             </div>

             <div className="bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm space-y-1 overflow-hidden">
                <div className="flex items-center gap-1.5 text-text-muted">
                   <CornerDownRight size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Source Ref</span>
                </div>
                <p className="text-sm font-black text-text truncate" title={journal.sourceReference}>
                  {journal.sourceReference ? (journal.sourceReference.length > 12 ? `${journal.sourceReference.substring(0, 12)}...` : journal.sourceReference) : '-'}
                </p>
             </div>

             <div className="bg-surface/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm space-y-1">
                <div className="flex items-center gap-1.5 text-text-muted">
                   <Building2 size={12} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Voucher Type</span>
                </div>
                <p className="text-sm font-black text-text">{journal.type || 'JOURNAL'}</p>
             </div>
          </div>

          {/* Narration */}
          <div className="bg-surface/20 p-5 rounded-2xl border border-border/30">
             <div className="flex items-center gap-2 mb-2">
                <FileText className="text-text-muted" size={14} />
                <h3 className="text-[9px] font-black uppercase tracking-widest text-text">Narration</h3>
             </div>
             <p className="text-sm font-medium text-text/80 leading-relaxed italic">
                {journal.narration || 'No narration provided.'}
             </p>
          </div>

          {/* Ledger Entries Table */}
          <div className="space-y-3">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                   <Hash size={12} /> entries
                </h3>
                <StatusChip status={journal.status as StatusType} />
             </div>

             <div className="bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm">
                <table className="w-full text-left table-fixed">
                   <thead>
                      <tr className="bg-background/40 border-b border-border/40">
                         <th className="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Account</th>
                         <th className="w-32 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">Debit</th>
                         <th className="w-32 px-5 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">Credit</th>
                         <th className="px-5 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted">Narration</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/10">
                      {journal.ledgerEntries.map((le) => (
                         <tr key={le.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-5 py-3 overflow-hidden">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 shrink-0 rounded-lg bg-background/50 border border-border flex items-center justify-center font-mono text-[10px] font-black text-primary">
                                     {le.account.code.substring(0, 2)}
                                  </div>
                                  <div className="min-w-0">
                                     <div className="font-extrabold text-xs text-text truncate">{le.account.name}</div>
                                     <div className="text-[8px] font-black text-text-muted uppercase tracking-wider">{le.account.code}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                               {(le.debitAmount > 0 || le.debitGold > 0) ? (
                                  <div className="space-y-0.5">
                                     {le.debitAmount > 0 && (
                                        <p className="font-mono text-sm font-black text-primary">₹{Number(le.debitAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                     )}
                                     {le.debitGold > 0 && (
                                        <p className="font-mono text-[9px] font-bold text-amber-500">{Number(le.debitGold).toFixed(3)}g</p>
                                     )}
                                  </div>
                               ) : (
                                  <span className="text-text-muted/10">—</span>
                                )}
                            </td>
                            <td className="px-5 py-3 text-right">
                               {(le.creditAmount > 0 || le.creditGold > 0) ? (
                                  <div className="space-y-0.5">
                                     {le.creditAmount > 0 && (
                                        <p className="font-mono text-sm font-black text-danger">₹{Number(le.creditAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                     )}
                                     {le.creditGold > 0 && (
                                        <p className="font-mono text-[9px] font-bold text-rose-400">{Number(le.creditGold).toFixed(3)}g</p>
                                     )}
                                  </div>
                               ) : (
                                  <span className="text-text-muted/10">—</span>
                               )}
                            </td>
                            <td className="px-5 py-3">
                               <p className="text-[10px] font-medium text-text-muted italic truncate" title={le.narration}>
                                  {le.narration || "—"}
                               </p>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                   <tfoot>
                      <tr className="bg-background/60 border-t border-border">
                         <td className="px-5 py-4 font-black text-[9px] uppercase tracking-[0.1em] text-text">Total Distribution</td>
                         <td className="px-5 py-4 text-right">
                            <div className="space-y-0.5">
                               <p className="font-mono text-base font-black text-primary">₹{totalDebitINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                               {totalDebitGram > 0 && <p className="font-mono text-[9px] font-black text-amber-500 uppercase">{totalDebitGram.toFixed(3)}g</p>}
                            </div>
                         </td>
                         <td className="px-5 py-4 text-right">
                            <div className="space-y-0.5">
                               <p className="font-mono text-base font-black text-danger">₹{totalCreditINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                               {totalCreditGram > 0 && <p className="font-mono text-[9px] font-black text-rose-400 uppercase">{totalCreditGram.toFixed(3)}g</p>}
                            </div>
                         </td>
                         <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-emerald-500">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                               <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Balanced</span>
                            </div>
                         </td>
                      </tr>
                   </tfoot>
                </table>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
