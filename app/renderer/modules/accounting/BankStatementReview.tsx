import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Save, Trash2, 
  ArrowDownRight, ArrowUpRight, Calendar, User, Search
} from 'lucide-react';
import { Button } from '@/components/Button';
import { PartySelect } from '@/components/PartySelect';
import { useConfirm } from '../../context/ConfirmationContext';

interface BankRow {
  id: string;
  entryDate: string;
  entryTime?: string;
  narration: string;
  amount: number;
  type: 'DR' | 'CR';
  detectedPartyId?: string;
  detectedParty?: { name: string; code: string };
  confidenceScore: number;
  status: string;
  remarks?: string;
}

interface BankStatementReviewProps {
  importId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BankStatementReview({ importId, onClose, onSuccess }: BankStatementReviewProps) {
  const [rows, setRows] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const { confirm, alert } = useConfirm();

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getStagedRows(importId);
      if (res.success && res.data) {
        setRows(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch staged rows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, [importId]);

  const handleUpdateRow = async (rowId: string, updates: any) => {
    try {
      const res = await window.electronAPI.updateStagedRow({ id: rowId, ...updates });
      if (res.success) {
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...updates } : r));
      }
    } catch (err) {
      console.error('Failed to update row:', err);
    }
  };

  const handlePartyChange = (rowId: string, id: string, code: string, name: string) => {
     handleUpdateRow(rowId, { 
        detectedPartyId: id || undefined,
        detectedParty: id ? { code, name } : undefined
     });
  };

  const handleFinalize = async () => {
    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    const invalidTimes = rows.filter(r => r.status === 'PENDING' && r.entryTime && !timeRegex.test(r.entryTime));
    if (invalidTimes.length > 0) {
      await alert({
        title: 'Invalid Time Format',
        message: `There are ${invalidTimes.length} transactions with invalid time format. Time must be in HH:MM AM/PM format (e.g. 12:45 PM or 09:15 AM) or left empty.`,
        type: 'error'
      });
      return;
    }

    const unknownParties = rows.filter(r => !r.detectedPartyId && r.status === 'PENDING').length;
    if (unknownParties > 0) {
      const confirmed = await confirm({
        title: 'Unknown Parties',
        message: `There are ${unknownParties} transactions without a selected party. These will be skipped. Continue?`,
        type: 'warning'
      });
      if (!confirmed) return;
    }

    setFinalizing(true);
    try {
      const res = await window.electronAPI.finalizeBankImport(importId);
      if (res.success && res.data) {
        const { createdCount, failedCount } = res.data;
        await alert({
          title: 'Import Complete',
          message: `Successfully created ${createdCount} vouchers. ${failedCount} rows were skipped or failed.`,
          type: failedCount > 0 ? 'warning' : 'success'
        });
        onSuccess();
      } else {
        await alert({ title: 'Error', message: 'Finalization failed: ' + (res as any).error, type: 'error' });
      }
    } catch (err: any) {
      await alert({ title: 'System Error', message: err.message, type: 'error' });
    } finally {
      setFinalizing(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 40) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) ? d.toLocaleDateString() : dateStr;
    } catch { return dateStr; }
  };

  const handleToggleExclude = (row: BankRow) => {
    const newStatus = row.status === 'EXCLUDED' ? 'PENDING' : 'EXCLUDED';
    handleUpdateRow(row.id, { status: newStatus });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-surface/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl h-9 w-9 p-0">
            <Trash2 size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-text flex items-center gap-2">
              Review Bank Statement
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none mt-0.5">Verify and map transactions before posting</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleFinalize} 
            loading={finalizing}
            icon={<CheckCircle2 size={16} />}
            className="rounded-xl shadow-lg shadow-primary/10 px-8 font-bold uppercase tracking-widest text-[10px] h-10"
          >
            Post Vouchers
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="bg-surface/20 rounded-2xl border border-border/40 overflow-hidden shadow-sm backdrop-blur-sm">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <thead>
              <tr className="bg-background/40 border-b border-border/40">
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[100px]">Date</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[110px]">Time</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left">Narration</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[250px]">Mapped Party</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[60px]">Conf.</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-right w-[120px]">Amount</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[80px]">Type</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-left w-[180px]">Remarks</th>
                <th className="border px-3 py-2 font-black uppercase tracking-widest text-center w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-muted animate-pulse">
                    <Search size={32} className="text-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading transactions...</span>
                  </div>
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-text-muted italic">No transactions found for this import.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className={`group hover:bg-primary/5 transition-colors ${row.status === 'EXCLUDED' ? 'bg-background/20 opacity-50 line-through' : ''}`}>
                  <td className="border px-3 py-2 font-bold text-[10px]">{formatDate(row.entryDate)}</td>
                  <td className="border px-1 py-1">
                    <input 
                      type="text"
                      placeholder="HH:MM AM/PM"
                      maxLength={8}
                      className={`w-full bg-transparent p-1 font-medium text-[11px] focus:ring-1 ring-primary rounded ${
                        row.entryTime && !/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i.test(row.entryTime) 
                          ? 'border border-red-500 focus:ring-red-500 bg-red-500/5' 
                          : ''
                      }`}
                      value={row.entryTime || ''}
                      onChange={(e) => handleUpdateRow(row.id, { entryTime: e.target.value })}
                    />
                  </td>
                  <td className="border px-1 py-1">
                    <input className="w-full bg-transparent p-1 font-medium text-[11px] focus:ring-1 ring-primary rounded" 
                      value={row.narration} onChange={(e) => handleUpdateRow(row.id, { narration: e.target.value })} />
                  </td>
                  <td className="border px-1 py-1">
                    <PartySelect 
                      label=""
                      value={row.detectedPartyId || ''} 
                      displayValue={row.detectedParty ? `${row.detectedParty.code} - ${row.detectedParty.name}` : ''}
                      onChange={(id, code, name) => handlePartyChange(row.id, id, code, name)}
                      partyTypes={[]}
                      className="h-8 text-[10px] font-bold"
                    />
                  </td>
                  <td className="text-[10px] font-black uppercase flex items-center justify-center">
                    {
                      row.confidenceScore >= 90 ? <span className="flex w-3 h-3 bg-success rounded-full"></span> :
                      row.confidenceScore >= 85 ? <span className="flex w-3 h-3 bg-warning rounded-full"></span> : 
                      <span className="flex w-3 h-3 bg-danger rounded-full"></span>
                    }
                    {/* {row.confidenceScore}% */}
                  </td>
                  <td className="border px-1 py-1">
                    <input type="number" className="w-full bg-transparent p-1 text-right font-bold text-[11px] focus:ring-1 ring-primary rounded" 
                      value={row.amount} onChange={(e) => handleUpdateRow(row.id, { amount: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="border px-1 py-1">
                    <select className="w-full bg-transparent p-1 text-[11px] font-bold cursor-pointer" 
                      value={row.type} onChange={(e) => handleUpdateRow(row.id, { type: e.target.value })}>
                      <option value="CR">CR</option>
                      <option value="DR">DR</option>
                    </select>
                  </td>                  
                  <td className="border px-1 py-2">
                    <input className="w-full bg-transparent p-1 text-[11px] focus:ring-1 ring-primary rounded" 
                      value={row.remarks || ''} onChange={(e) => handleUpdateRow(row.id, { remarks: e.target.value })} />                    
                  </td>
                  <td className=" px-1 py-2 flex items-center justify-center">
                      <button onClick={() => handleToggleExclude(row)} className={`p-1 rounded-md ${row.status === 'EXCLUDED' ? 'text-primary' : 'text-danger'}`}>
                        <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
