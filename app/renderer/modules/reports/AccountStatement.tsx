import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, User, Filter, Printer, X, Scissors, Hash } from 'lucide-react';
import { Button } from '@/components/Button';
import { AccountSearchModal } from '@/components/AccountSearchModal';
import { RateCutForm } from '../accounting/RateCutForm';

interface ReportRow {
  entryDate: string;
  voucherType: string;
  partyName: string;
  partyType: string;
  itemName: string;
  voucherNo: string;
  voucherNarration: string;
  tagGrossWeight: number;
  tagKundanWeight: number;
  taarPattiWeight: number;
  tagMottiWeight: number;
  tagStoneWeight: number;
  tagNetWeight: number;
  soldGoldPercentage: number;
  DrAmt: number;
  CrAmt: number;
  RunningAmt: number;
  DrStk: number;
  CrStk: number;
  BalStk: number;
}

export function AccountStatement({ active }: { active: boolean }) {
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [freezeDate, setFreezeDate] = useState('');
  const [isRateCutModalOpen, setIsRateCutModalOpen] = useState(false);

  const accountRef = React.useRef<HTMLDivElement>(null);
  const fromDateRef = React.useRef<HTMLInputElement>(null);
  const toDateRef = React.useRef<HTMLInputElement>(null);
  const generateBtnRef = React.useRef<HTMLButtonElement>(null);
  const printBtnRef = React.useRef<HTMLButtonElement>(null);
  const csvBtnRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Initial focus when component becomes active
    if (active) {
      setTimeout(() => accountRef.current?.focus(), 100);
    }
  }, [active]);

  const fetchData = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      // 1. Fetch Latest Account Details (Specifically for Freeze Date)
      const accRes = await window.electronAPI.getAccountDetails(selectedAccount.id);
      if (accRes.success && accRes.data) {
        setFreezeDate(accRes.data.account_freeze_date || '');
      }

      // 2. Fetch Statement Data
      const res = await window.electronAPI.getAccountStatement({
        accountId: selectedAccount.id,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) {
        setData(res.data || []);
        // Shift focus to print after generation
        setTimeout(() => printBtnRef.current?.focus(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset state when account changes
  useEffect(() => {
    setFreezeDate('');
    setData([]);
  }, [selectedAccount]);

  useEffect(() => {
    if (active && selectedAccount) fetchData();
  }, [active]);

  const isCustomerAccount = data.length > 0 ? data[0].partyType === 'CUSTOMER' : (selectedAccount?.account_subtype === 'RECEIVABLE');

  const exportCSV = () => {
    const headers = [
      'Date', 'A/C Head', 'Party Name', 'Item', 'Voucher No', 'Narration', 
      // ...(isCustomerAccount ? ['Gross Wt.', 'Kundan Wt.', 'T-Patti Wt.', 'MT wt.', 'ST Wt.', 'Net Wt.', 'Purity'] : []),
      'Dr. Amt.', 'Cr. Amt.', 'Bal. Amt', 
      'Dr. Stk.', 'Cr. Stk.', 'Bal. Stk.'
    ];
    
    const rows = data.map(row => [
      row.entryDate,
      row.voucherType,
      row.partyName,
      row.itemName || '',
      row.voucherNo || '',
      row.voucherNarration || '',
      // ...(isCustomerAccount ? [
      //   row.tagGrossWeight || 0,
      //   row.tagKundanWeight || 0,
      //   row.taarPattiWeight || 0,
      //   row.tagMottiWeight || 0,
      //   row.tagStoneWeight || 0,
      //   row.tagNetWeight || 0,
      //   row.soldGoldPercentage || 0,
      // ] : []),
      row.DrAmt?.toFixed(2) || 0,
      row.CrAmt?.toFixed(2) || 0,
      row.RunningAmt?.toFixed(2) || 0,
      row.DrStk?.toFixed(3) || 0,
      row.CrStk?.toFixed(3) || 0,
      row.BalStk?.toFixed(3) || 0
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Account_Statement_${selectedAccount?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // const totals = data.reduce((acc, row) => ({
  //   gross: acc.gross + (Number(row.tagGrossWeight) || 0),
  //   kundan: acc.kundan + (Number(row.tagKundanWeight) || 0),
  //   tpatti: acc.tpatti + (Number(row.taarPattiWeight) || 0),
  //   mt: acc.mt + (Number(row.tagMottiWeight) || 0),
  //   st: acc.st + (Number(row.tagStoneWeight) || 0),
  //   net: acc.net + (Number(row.tagNetWeight) || 0),
  // }), { gross: 0, kundan: 0, tpatti: 0, mt: 0, st: 0, net: 0 });

  return (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      {/* compact row for Title and Filters */}
      <div className="flex items-center justify-between print:hidden gap-4 bg-surface/50 p-3 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4 shrink-0">
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            Account Statement
          </h1>
          <div className="h-6 w-px bg-border" />
        </div>

        <div className="flex-1 flex items-center gap-4 overflow-hidden">
          {/* Account Select */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
             <label className="text-[10px] font-black uppercase text-text-muted shrink-0">Account:</label>
             <div 
               ref={accountRef}
               tabIndex={0}
               onClick={() => setModalOpen(true)}
               onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
               className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary transition-all min-w-0 focus:ring-2 focus:ring-primary/20 outline-none"
             >
                {selectedAccount ? (
                  <>
                    <Hash size={14} className="text-primary shrink-0" />
                    <span className="text-xs font-bold truncate">{selectedAccount.name}</span>
                  </>
                ) : (
                  <>
                    <Search size={14} className="text-text-muted" />
                    <span className="text-xs font-medium text-text-muted">Select Account...</span>
                  </>
                )}
             </div>
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2 shrink-0">
             <label className="text-[10px] font-black uppercase text-text-muted">From:</label>
             <input 
               ref={fromDateRef}
               type="date" 
               value={startDate}
               onChange={e => setStartDate(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && toDateRef.current?.focus()}
               className="bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none"
             />
          </div>
          <div className="flex items-center gap-2 shrink-0">
             <label className="text-[10px] font-black uppercase text-text-muted">To:</label>
             <input 
               ref={toDateRef}
               type="date" 
               value={endDate}
               onChange={e => setEndDate(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && generateBtnRef.current?.focus()}
               className="bg-background border border-border rounded-xl px-2 py-1 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none"
             />
          </div>

          <Button 
            ref={generateBtnRef}
            variant="primary" 
            size="sm"
            icon={<Filter size={14} />} 
            onClick={fetchData} 
            loading={loading} 
            disabled={!selectedAccount}
          >
            Generate
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button 
            ref={printBtnRef}
            variant="ghost" 
            size="sm"
            icon={<Printer size={16} />} 
            onClick={handlePrint}
            onKeyDown={e => e.key === 'Enter' && csvBtnRef.current?.focus()}
            disabled={data.length === 0}
          >
            Print
          </Button>
          <Button 
            ref={csvBtnRef}
            variant="ghost" 
            size="sm"
            icon={<Download size={16} />} 
            onClick={() => { exportCSV(); setTimeout(() => accountRef.current?.focus(), 100); }}
            disabled={data.length === 0}
          >
            CSV
          </Button>
        </div>
      </div>

      {/* Main Print Wrapper */}
      <div id="printable-statement" className="print:m-0 print:p-0">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest">Account Statement</h1>
          {selectedAccount && (
            <>
              <div className="mt-2 text-lg font-bold">
                {selectedAccount.name} <span className="text-sm opacity-60">({selectedAccount.code})</span>
              </div>
              <div className="text-xs mt-1 font-medium italic">
                Period: {startDate || 'Beginning'} — {endDate || 'Present'}
              </div>
            </>
          )}
        </div>

        {/* Report Header Info */}
        {selectedAccount && data.length > 0 && (
          <div className="p-1 flex items-center justify-between shadow-sm print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary print:hidden">
                <Hash size={24} />
              </div>
              <div>
                <h2 className="text-md font-black uppercase tracking-tight text-text print:text-xl">{selectedAccount.name}</h2>
                <div className="flex items-center gap-3 text-xs font-bold text-text-muted print:text-black">
                  <span className="bg-primary/10 py-0.5 rounded text-primary print:bg-transparent uppercase tracking-widest">{selectedAccount.code}</span>
                  <div className="h-3 w-px bg-border print:bg-black" />
                  <span>Statement Period: {startDate || 'Start'} — {endDate || 'End'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6 print:hidden">
              {isCustomerAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRateCutModalOpen(true)}
                  className="text-violet-600 hover:bg-violet-600/10 hover:text-violet-700 border border-violet-200"
                  icon={<Scissors size={14} />}
                >
                  Rate Cut
                </Button>
              )}
              <div className="flex flex-col items-end">
                <label className="text-[10px] font-black uppercase text-blue-600 mb-1 tracking-widest flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  A/C Freeze Date
                </label>
                <input 
                  type="date" 
                  value={freezeDate}
                  onChange={async (e) => {
                    const newDate = e.target.value;
                    setFreezeDate(newDate);
                    if (selectedAccount?.id) {
                      await window.electronAPI.updateAccountFreezeDate(selectedAccount.id, newDate || null);
                    }
                  }}
                  className="bg-background border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none text-blue-600 shadow-sm transition-all hover:border-blue-400"
                />
              </div>

              <div className="text-right">
                <div className="text-[10px] font-black uppercase text-text-muted mb-1">Generated On</div>
                <div className="text-xs font-bold font-mono">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Excel-like Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm print:rounded-none print:border-none">
          <div className="overflow-x-auto pb-3">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-background/80 print:bg-gray-100">
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-left font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Date</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-left font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Type</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-left font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Item</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-left font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Voucher</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-left font-black uppercase tracking-tighter text-text-muted print:text-black max-w-xs break-all">Narration</th>
                  
                  {/* {isCustomerAccount && (
                    <>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Gross</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Kundan</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">T-Patti</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">MT</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">ST</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Net</th>
                      <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Purity</th>
                    </>
                  )} */}

                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Dr. Amt.</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Cr. Amt.</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-2 text-right font-black uppercase tracking-tighter text-primary print:text-black bg-primary/5 print:bg-transparent whitespace-nowrap">Bal. Amt.</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Dr. Stk</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-text-muted print:text-black whitespace-nowrap">Cr. Stk</th>
                  <th className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-2 text-right font-black uppercase tracking-tighter text-secondary print:text-black bg-secondary/5 print:bg-transparent whitespace-nowrap">Bal. Stk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 print:divide-black">
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={isCustomerAccount ? 18 : 11} className="px-6 py-12 text-center border border-border">
                       <div className="flex flex-col items-center gap-2 opacity-20 print:hidden">
                         <Search size={32} />
                         <p className="font-bold text-xs uppercase tracking-widest">No data to display</p>
                       </div>
                       <div className="hidden print:block text-black font-bold">No records found.</div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => {
                    const isFrozen = freezeDate && row.entryDate <= freezeDate;
                    return (
                      <tr key={idx} className={`hover:bg-primary/[0.02] transition-colors print:hover:bg-transparent ${isFrozen ? 'text-blue-600 font-medium' : ''}`}>
                      <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 font-mono whitespace-nowrap">
                        {new Date(row.entryDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 font-bold uppercase whitespace-nowrap">{row.voucherType}</td>
                      <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 font-bold italic whitespace-nowrap">{row.itemName || '-'}</td>
                      <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 font-bold whitespace-nowrap">{row.voucherNo || '-'}</td>
                      <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 font-medium print:opacity-100 max-w-xs break-all">{row.voucherNarration || '-'}</td>
                      
                      {/* {isCustomerAccount && (
                        <>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.tagGrossWeight?.toFixed(3) || '-'}</td>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.tagKundanWeight?.toFixed(3) || '-'}</td>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.taarPattiWeight?.toFixed(3) || '-'}</td>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.tagMottiWeight?.toFixed(3) || '-'}</td>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.tagStoneWeight?.toFixed(3) || '-'}</td>
                          <td className="border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono whitespace-nowrap">{row.tagNetWeight?.toFixed(3) || '-'}</td>
                          
                          <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono font-bold whitespace-nowrap ${isFrozen ? 'text-blue-600' : 'text-secondary'}`}>{row.soldGoldPercentage ? `${row.soldGoldPercentage}%` : '-'}</td>
                        </>
                      )} */}
                      
                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 text-right font-mono font-bold whitespace-nowrap ${isFrozen ? 'text-blue-600 print:text-blue-600' : 'print:text-black'}`}>
                        {row.DrAmt ? row.DrAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 text-right font-mono font-bold whitespace-nowrap ${isFrozen ? 'text-blue-600 print:text-blue-600' : 'print:text-black'}`}>
                        {row.CrAmt ? row.CrAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                      </td>
                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-2 py-1.5 text-right font-mono font-black bg-primary/5 print:bg-transparent whitespace-nowrap text-[14px] ${isFrozen ? 'text-blue-600' : (row.RunningAmt >= 0 ? 'text-emerald-700' : 'text-red-700')}`}>
                        {Math.abs(row.RunningAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {row.RunningAmt >= 0 ? 'Dr' : 'Cr'}
                      </td>

                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono font-bold whitespace-nowrap ${isFrozen ? 'text-blue-600 print:text-blue-600' : 'print:text-black'}`}>
                        {row.DrStk ? row.DrStk.toFixed(3) : '-'}
                      </td>
                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono font-bold whitespace-nowrap ${isFrozen ? 'text-blue-600 print:text-blue-600' : 'print:text-black'}`}>
                        {row.CrStk ? row.CrStk.toFixed(3) : '-'}
                      </td>
                      <td className={`border border-border border-slate-300 dark:border-slate-700 print:border-black px-1 py-1.5 text-right font-mono font-black bg-secondary/5 print:bg-transparent whitespace-nowrap text-[14px] ${isFrozen ? 'text-blue-600' : (row.BalStk >= 0 ? 'text-emerald-700' : 'text-red-700')}`}>
                        {Math.abs(row.BalStk).toFixed(3)} {row.BalStk >= 0 ? 'Dr' : 'Cr'}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              {/* Totals Footer */}
              {/* {data.length > 0 && isCustomerAccount && (
                <tfoot className="bg-surface/80 font-black print:bg-gray-100">
                   <tr className="border-t-2 border-border print:border-black">
                     <td colSpan={5} className="border border-border print:border-black px-3 py-2 text-right uppercase tracking-widest text-text-muted print:text-black">Totals</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.gross.toFixed(3)}</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.kundan.toFixed(3)}</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.tpatti.toFixed(3)}</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.mt.toFixed(3)}</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.st.toFixed(3)}</td>
                     <td className="border border-border print:border-black px-1 py-2 text-right font-mono text-primary print:text-black">{totals.net.toFixed(3)}</td>
                     <td colSpan={7} className="border border-border print:border-black bg-background/20 print:bg-transparent"></td>
                   </tr>
                </tfoot>
              )} */}
            </table>
          </div>
        </div>
      </div>

      <AccountSearchModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setTimeout(() => fromDateRef.current?.focus(), 100); }} 
        onSelect={(acc) => {
          setSelectedAccount(acc);
          setModalOpen(false);
          setTimeout(() => fromDateRef.current?.focus(), 100);
        }}
        leafOnly={true}
      />

      {isRateCutModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-6">
          <div className="w-full max-w-5xl h-[85vh] bg-surface rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
            <RateCutForm
              partyAccountId={selectedAccount.id}
              partyAccountName={selectedAccount.name}
              onCancel={() => setIsRateCutModalOpen(false)}
              onSuccess={() => {
                setIsRateCutModalOpen(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}

      {/* Global Print Styles - Ultra Force Mode */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 landscape !important;
          margin: 0.5cm !important;
        }

        @media print {
          /* 1. Kill the entire app layout constraints for visible elements only */
          html, body, #root, .App, main, [data-module-container], section {
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            width: 29.7cm !important; /* Force Landscape Width */
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
            background: white !important;
            font-family: 'Inter', sans-serif !important;
          }

          /* 2. Target the specific active wrapper in ReportsLayout */
          .opacity-100 {
             position: static !important;
             display: block !important;
             overflow: visible !important;
             height: auto !important;
             opacity: 1 !important;
             visibility: visible !important;
          }

          /* 3. Explicitly hide inactive tabs and other non-print elements */
          .opacity-0, header, nav, footer, .print\\:hidden, .sidebar, aside, button, .lucide, .print-hide {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            visibility: hidden !important;
          }

          #printable-statement {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
            border: none !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
            border: 1px solid black !important;
            table-layout: fixed !important;
          }
          
          /* Extreme Specificity Override */
          #printable-statement table tr th,
          #printable-statement table tr td {
            border: 1px solid black !important;
            padding: 2px 2px !important;
            background: transparent !important;
            color: black !important;
            font-size: 6pt !important; 
            font-weight: 500 !important;
            text-transform: none !important;
            word-break: break-all !important;
            white-space: normal !important;
            line-height: 1 !important;
          }

          /* Explicit Column Widths for 18-Column Layout */
          #printable-statement table tr th:nth-child(1), #printable-statement table tr td:nth-child(1) { width: 35pt; } /* Date */
          #printable-statement table tr th:nth-child(2), #printable-statement table tr td:nth-child(2) { width: 30pt; } /* Type */
          #printable-statement table tr th:nth-child(3), #printable-statement table tr td:nth-child(3) { width: 60pt; } /* Item */
          #printable-statement table tr th:nth-child(4), #printable-statement table tr td:nth-child(4) { width: 40pt; } /* Voucher */
          #printable-statement table tr th:nth-child(5), #printable-statement table tr td:nth-child(5) { width: 80pt; } /* Narration */
          
          /* Financials & Weights (Auto-fit) */
          #printable-statement table tr th:nth-last-child(-n+13),
          #printable-statement table tr td:nth-last-child(-n+13) { 
            width: 4.5% !important; 
          }

          /* Ensure headers wrap and are centered */
          #printable-statement table tr th {
            text-align: center !important;
            vertical-align: middle !important;
            background: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
          }

          th {
            white-space: normal !important; /* Allow headers to wrap */
            line-height: 1 !important;
          }
          
          @page {
            size: A4 landscape !important;
            margin: 0.3cm !important;
          }
        }
      `}} />
    </div>
  );
}
