import React from 'react';
import { Wallet, History, TrendingUp, TrendingDown } from 'lucide-react';

interface InstrumentBalance {
  opening: number;
  openingType: 'DR' | 'CR';
  debits: number;
  credits: number;
  net: number;
}

interface Balances {
  gold?: InstrumentBalance;
  cash?: InstrumentBalance;
}

interface PureMonitorProps {
  partyId: string | null;
  partyName: string | null;
  balances: Balances | null;
}

export function PureMonitor({ partyId, partyName, balances }: PureMonitorProps) {
  if (!partyId) {
    return (
      <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6 shrink-0">
          <Wallet className="text-primary" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pure Monitor</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
          <History size={32} className="mb-3" />
          <p className="text-[10px] font-extrabold px-6 leading-relaxed">SELECT A PARTY FOR REAL-TIME BALANCES</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-3xl border border-border/50 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <Wallet className="text-primary" size={16} />
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pure Monitor</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 animate-in zoom-in-95 duration-300">
        <div className="shrink-0 mb-4">
          <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] block mb-0.5">Party</span>
          <div className="text-sm font-black truncate text-primary">{partyName}</div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className="space-y-6">
            {/* Gold instrument section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-primary rounded-full" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Gold Asset</span>
              </div>
              
              <div className="space-y-3 bg-primary/5 rounded-2xl p-4 border border-primary/10">
                <div className="flex justify-between items-end border-b border-primary/10 pb-2">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Opening</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs">{(balances?.gold?.opening || 0).toFixed(3)}g</span>
                    <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded-sm ${balances?.gold?.openingType === 'CR' ? 'text-danger' : 'text-emerald-500'}`}>
                      {balances?.gold?.openingType}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Received (+)</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-xs ${(balances?.gold?.credits || 0) > 0 ? 'text-danger' : 'text-emerald-500'}`}>
                      <TrendingUp size={10} className="inline mr-1" /> {(balances?.gold?.credits || 0).toFixed(3)}g
                    </span>
                    <span className="text-[9px] font-black uppercase px-1 pt-1 rounded-sm text-danger">CR</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Issued (-)</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-xs ${(balances?.gold?.debits || 0) > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                      <TrendingDown size={10} className="inline mr-1" /> {(balances?.gold?.debits || 0).toFixed(3)}g
                    </span>
                    <span className="text-[9px] font-black uppercase px-1 pt-1 rounded-sm text-emerald-500">DR</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-primary/10 text-center">
                  <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest block mb-1">Net Gold</span>
                  <div className={`flex items-center justify-center gap-1 text-lg font-black tracking-tight ${(balances?.gold?.net || 0) > 0 ? 'text-danger' : 'text-emerald-500'}`}>
                    {Math.abs(balances?.gold?.net || 0).toFixed(3)}g
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ (balances?.gold?.net || 0) > 0 ? 'bg-danger/10 text-danger' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {(balances?.gold?.net || 0) > 0 ? 'CR' : (balances?.gold?.net || 0) === 0 ? 'Clear' : 'DR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash instrument section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Currency (INR)</span>
              </div>
              
              <div className="space-y-3 bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                <div className="flex justify-between items-end border-b border-emerald-500/10 pb-2">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Opening</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs">₹ {(balances?.cash?.opening || 0).toLocaleString('en-IN')}</span>
                    <span className={`text-[9px] font-black uppercase px-1 py-0.5 rounded-sm ${balances?.cash?.openingType === 'CR' ? 'text-danger' : 'text-emerald-500'}`}>
                      {balances?.cash?.openingType}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Payments (+)</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-xs ${(balances?.cash?.credits || 0) > 0 ? 'text-danger' : 'text-emerald-500'}`}>
                      <TrendingUp size={10} className="inline mr-1" /> ₹ {(balances?.cash?.credits || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1 pt-1 rounded-sm text-danger">CR</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-text-muted/60 uppercase">Issuance (-)</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-xs ${(balances?.cash?.debits || 0) > 0 ? 'text-emerald-500' : 'text-text-muted'}`}>
                      <TrendingDown size={10} className="inline mr-1" /> ₹ {(balances?.cash?.debits || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] font-black uppercase px-1 pt-1 rounded-sm text-emerald-500">DR</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-emerald-500/10 text-center">
                  <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest block mb-1">Net Balance</span>
                  <div className={`flex items-center justify-center gap-1 text-lg font-black tracking-tight ${(balances?.cash?.net || 0) > 0 ? 'text-danger' : 'text-emerald-500'}`}>
                    ₹ {Math.abs(balances?.cash?.net || 0).toLocaleString('en-IN')}
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ (balances?.cash?.net || 0) > 0 ? 'bg-danger/10 text-danger' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {(balances?.cash?.net || 0) > 0 ? 'CR' : (balances?.cash?.net || 0) === 0 ? 'Clear' : 'DR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
