import React, { useState, useEffect } from 'react';
import { Search, Download, Calendar, Filter, Printer } from 'lucide-react';
import { Button } from '@/components/Button';
import { AccountSelect } from '@/components/AccountSelect';
import { useSetupStore } from '@/store/setupStore';

interface ReportAccount {
  accountId: string;
  accountName: string;
  accountCode: string;
  drAmt: number;
  crAmt: number;
  drStk: number;
  crStk: number;
}

interface GroupedData {
  groupId: string;
  groupName: string;
  accounts: ReportAccount[];
}

export function LenaDenaReport({ active }: { active: boolean }) {
  const { companyInfo } = useSetupStore();
  const [selectedGroup, setSelectedGroup] = useState({ id: '', display: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getLenaDenaReport({
        groupId: selectedGroup.id || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      if (res.success) {
        setData(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) fetchData();
  }, [active]);

  const totals = data.reduce((acc, group) => {
    const groupTotals = group.accounts.reduce((gAcc, row) => ({
      drAmt: gAcc.drAmt + row.drAmt,
      crAmt: gAcc.crAmt + row.crAmt,
      drStk: gAcc.drStk + row.drStk,
      crStk: gAcc.crStk + row.crStk,
    }), { drAmt: 0, crAmt: 0, drStk: 0, crStk: 0 });
    
    return {
      drAmt: acc.drAmt + groupTotals.drAmt,
      crAmt: acc.crAmt + groupTotals.crAmt,
      drStk: acc.drStk + groupTotals.drStk,
      crStk: acc.crStk + groupTotals.crStk,
    };
  }, { drAmt: 0, crAmt: 0, drStk: 0, crStk: 0 });

  const exportCSV = () => {
    const headers = ['Account Name', 'Dr. Amt', 'Cr. Amt', 'Dr. Stk', 'Cr. Stk'];
    const rows: any[] = [];
    
    data.forEach(group => {
      // Add Group Header Row
      rows.push([
        `"** ${group.groupName}"`,
        '', '', '', ''
      ]);
      
      group.accounts.forEach((row) => {
        rows.push([
          `"${row.accountName}"`,
          (row.drAmt || 0).toFixed(2),
          (row.crAmt || 0).toFixed(2),
          (row.drStk || 0).toFixed(3),
          (row.crStk || 0).toFixed(3)
        ]);
      });
    });

    // Add Totals Row
    rows.push([
      'Total:',
      totals.drAmt.toFixed(2),
      totals.crAmt.toFixed(2),
      totals.drStk.toFixed(3),
      totals.crStk.toFixed(3)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement("a"));
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Lena_Dena_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (val: number) => {
    if (!val || val === 0) return '';
    return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatWeight = (val: number) => {
    if (!val || val === 0) return '';
    return val.toFixed(3);
  };

  const cellBorder = "border border-black/20 dark:border-white/20";

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:p-0 print:m-0">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            Lena Dena Report
          </h1>
          <p className="text-text-muted font-bold mt-1 opacity-60">Consolidated summary of pending balances by group.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            icon={<Download size={18} />} 
            onClick={exportCSV}
            disabled={data.length === 0}
          >
            Export CSV
          </Button>
          <Button 
            variant="ghost" 
            icon={<Printer size={18} />} 
            onClick={handlePrint}
            disabled={data.length === 0}
          >
            Print PDF
          </Button>
          <Button variant="primary" icon={<Filter size={18} />} onClick={fetchData} loading={loading}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Compact Filters */}
      <div className="p-4 bg-surface/50 border border-border rounded-2xl grid grid-cols-1 lg:grid-cols-4 gap-4 items-end shadow-sm print:hidden">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">Account Group</label>
            {selectedGroup.id && (
              <button 
                onClick={() => setSelectedGroup({ id: '', display: '' })}
                className="text-[10px] font-bold text-primary hover:underline"
              >Clear Selection (All Groups)</button>
            )}
          </div>
          <AccountSelect 
            label="" 
            value={selectedGroup.id}
            displayValue={selectedGroup.display || 'All Groups'}
            groupsOnly={true}
            onChange={(id, display) => setSelectedGroup({ id, display })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2 ml-1">
            <Calendar size={12} /> From Date
          </label>
          <input 
            type="date" 
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full h-[42px] bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2 ml-1">
            <Calendar size={12} /> To Date
          </label>
          <input 
            type="date" 
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full h-[42px] bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Report Container */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-xl shadow-black/5 print:shadow-none print:border-none print:bg-white print:text-black print:overflow-visible printable-report">
        
        {/* Printable Header */}
        <div className="hidden print:block p-4">
          <div className="flex justify-between items-start mb-6">
            <div className="w-24" /> {/* Spacer */}
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold uppercase mb-1">{companyInfo?.name}</h1>
              <div className="text-sm font-medium">
                {selectedGroup.display || 'ALL ACCOUNT GROUPS'} {endDate ? `as on ${new Date(endDate).toLocaleDateString('en-IN')}` : ''}
              </div>
            </div>
            <div className="text-right text-[10px] font-medium pt-1">
              Report Date : {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full border-collapse border border-black/30 dark:border-white/30 print:text-black print:border-2 print:border-black text-xs">
            <thead>
              <tr className="bg-background/50 print:bg-white">
                <th className={`px-3 py-2 text-left font-black uppercase tracking-widest text-text-muted ${cellBorder} print:border print:border-black print:text-black print:font-bold`}>Account Name</th>
                <th className={`px-3 py-2 text-right font-black uppercase tracking-widest text-text-muted ${cellBorder} print:border print:border-black print:text-black print:font-bold`}>Dr.Amt.</th>
                <th className={`px-3 py-2 text-right font-black uppercase tracking-widest text-text-muted ${cellBorder} print:border print:border-black print:text-black print:font-bold`}>Cr.Amt.</th>
                <th className={`px-3 py-2 text-right font-black uppercase tracking-widest text-text-muted ${cellBorder} print:border print:border-black print:text-black print:font-bold`}>Dr.Stk.</th>
                <th className={`px-3 py-2 text-right font-black uppercase tracking-widest text-text-muted ${cellBorder} print:border print:border-black print:text-black print:font-bold`}>Cr.Stk.</th>
              </tr>
            </thead>
            <tbody className="print:divide-black">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-20 text-center ${cellBorder} print:border print:border-black`}>
                     <div className="flex flex-col items-center gap-3 opacity-30">
                       <Search size={48} />
                       <p className="font-bold text-sm">No records found.</p>
                     </div>
                  </td>
                </tr>
              ) : (
                data.map((group) => (
                  <React.Fragment key={group.groupId}>
                    {/* Group Header Row */}
                    <tr className="bg-primary/5 print:bg-white font-black">
                      <td colSpan={5} className={`px-3 py-1.5 font-bold uppercase tracking-tight text-primary ${cellBorder} print:border print:border-black print:text-black`}>
                        ** {group.groupName}
                      </td>
                    </tr>
                    {/* Account Rows */}
                    {group.accounts.map((row) => (
                      <tr key={row.accountId} className="hover:bg-primary/5 transition-colors group print:hover:bg-transparent">
                        <td className={`px-3 py-1.5 ${cellBorder} print:border print:border-black`}>
                          <span className="font-extrabold text-sm print:text-black print:font-medium">{row.accountName}</span>
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold text-emerald-600 ${cellBorder} print:border print:border-black print:text-black print:font-medium`}>
                          {formatAmount(row.drAmt)}
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold text-red-600 ${cellBorder} print:border print:border-black print:text-black print:font-medium`}>
                          {formatAmount(row.crAmt)}
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold text-emerald-500 ${cellBorder} print:border print:border-black print:text-black print:font-medium`}>
                          {formatWeight(row.drStk)}
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono font-bold text-red-500 ${cellBorder} print:border print:border-black print:text-black print:font-medium`}>
                          {formatWeight(row.crStk)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {/* Totals Footer */}
            {data.length > 0 && (
              <tfoot className="bg-primary/5 print:bg-white">
                <tr className="font-black">
                  <td className={`px-3 py-2 uppercase text-[11px] tracking-widest text-primary ${cellBorder} print:text-black print:border print:border-black print:text-right`}>Total:</td>
                  <td className={`px-3 py-2 text-right font-mono font-black text-emerald-600 ${cellBorder} print:text-black print:border print:border-black print:text-sm`}>{formatAmount(totals.drAmt)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-black text-red-600 ${cellBorder} print:text-black print:border print:border-black print:text-sm`}>{formatAmount(totals.crAmt)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-black text-emerald-500 ${cellBorder} print:text-black print:border print:border-black print:text-sm`}>{formatWeight(totals.drStk)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-black text-red-500 ${cellBorder} print:text-black print:border print:border-black print:text-sm`}>{formatWeight(totals.crStk)}</td>
                </tr>
              </tfoot>
            )}
          </table>
          <div className="hidden print:block text-center text-[10px] mt-8 font-medium">
            Page No.1
          </div>
        </div>
      </div>

      {/* Global Print Styles - Ultra Force Mode */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* 1. Kill the entire app layout constraints for visible elements only */
          html, body, #root, .App, main, [data-module-container], section {
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            width: 100% !important;
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
          .opacity-0, header, nav, footer, .print\\:hidden, .sidebar, aside, button, .lucide {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            visibility: hidden !important;
          }

          .printable-report {
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
            border: 2px solid black !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 4px 8px !important;
            background: transparent !important;
            color: black !important;
            font-size: 9pt !important;
          }
          
          @page {
            size: A4;
            margin: 0.8cm;
          }
        }
      `}} />
    </div>
  );
}
