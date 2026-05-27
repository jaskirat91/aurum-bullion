import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Trash2, 
  Edit2, 
  Calendar, 
  Hash, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft,
  CircleDot,
  User,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/Button';
import { StatusChip } from '@/components/StatusChip';

interface GoldVoucherDetailsOverlayProps {
  voucherId: string;
  onClose: () => void;
  onEdit: (voucher: any) => void;
}

export function GoldVoucherDetailsOverlay({ voucherId, onClose, onEdit }: GoldVoucherDetailsOverlayProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const res = await window.electronAPI.getGoldVoucherDetails(voucherId);
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [voucherId]);

  if (loading) return null; // Or a simple loader

  if (!data) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface p-8 rounded-3xl border border-border shadow-2xl">
        <p className="font-black">Voucher not found.</p>
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    </div>
  );

  const { voucher, partyAccount, receiptGold, issueGold, receiptAmount, issueAmount } = data;

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 border-b border-border bg-background/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">Gold Voucher</h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Hash size={10} /> {voucher.voucherNo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(data)} className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary">
              <Edit2 size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 rounded-xl hover:bg-danger/10 hover:text-danger">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8">
            {/* Status & Date Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-background/50 p-4 rounded-2xl border border-border/50">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Calendar size={10} className="text-primary" /> Entry Date
                </p>
                <p className="text-lg font-black">{new Date(voucher.entryDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-2xl border border-border/50">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <CircleDot size={10} className="text-primary" /> Status
                </p>
                <div className="flex mt-1">
                  <StatusChip status={voucher.status} />
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-background/50 p-6 rounded-[2rem] border border-border/50">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <User size={10} className="text-primary" /> Party Account
              </p>
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-2xl font-black text-primary">
                  {partyAccount.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black">{partyAccount.name}</h3>
                  <p className="text-xs font-bold text-text-muted tracking-tight">Code: {partyAccount.code}</p>
                </div>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Transaction Summary</h4>
               
               <div className="grid grid-cols-2 gap-4">
                 {/* Gold Cards */}
                 <div className="bg-surface p-6 rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <ArrowDownLeft size={48} className="text-emerald-600" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Gold Received</span>
                   <span className="text-3xl font-black text-emerald-600">{Number(receiptGold || 0).toFixed(3)}g</span>
                 </div>

                 <div className="bg-surface p-6 rounded-[2rem] border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                     <ArrowUpRight size={48} className="text-primary" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Gold Issued</span>
                   <span className="text-3xl font-black text-primary">{Number(issueGold || 0).toFixed(3)}g</span>
                 </div>

                 {/* Amount Cards */}
                 <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col items-center justify-center">
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Amount Received</span>
                   <span className="text-3xl font-black text-emerald-600">₹ {Number(receiptAmount || 0).toLocaleString('en-IN')}</span>
                 </div>

                 <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex flex-col items-center justify-center">
                   <span className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Amount Issued</span>
                   <span className="text-3xl font-black text-primary">₹ {Number(issueAmount || 0).toLocaleString('en-IN')}</span>
                 </div>
               </div>
            </div>

            {/* Narration */}
            {voucher.narration && (
              <div className="bg-background/50 p-6 rounded-[2rem] border border-border/50">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FileText size={10} className="text-primary" /> Narration
                </p>
                <p className="text-sm font-bold text-text italic leading-relaxed">
                  "{voucher.narration}"
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between px-2 opacity-50">
               <div className="flex items-center gap-2">
                 <Clock size={12} />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">Created: {new Date(voucher.createdAt).toLocaleString('en-IN')}</span>
               </div>
               <div className="flex items-center gap-2">
                 <Clock size={12} />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">Updated: {new Date(voucher.updatedAt).toLocaleString('en-IN')}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-border bg-background/50 flex gap-4 shrink-0">
          <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-black uppercase text-xs border border-border shadow-sm hover:bg-background transition-all gap-2">
            <Printer size={18} /> Print Voucher
          </Button>
          <Button onClick={() => onEdit(data)} className="flex-1 h-12 rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/10 gap-2">
            <Edit2 size={16} /> Edit Details
          </Button>
        </div>
      </div>
    </div>
  );
}
