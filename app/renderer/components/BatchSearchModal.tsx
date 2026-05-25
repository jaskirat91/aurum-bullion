import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Layers, Command, X, Calendar, Scale } from 'lucide-react';

interface Batch {
  id: string;
  batchNo: string;
  created_at: string;
  status: string;
  item?: { name: string; code: string };
  transactions?: { netPureGoldWeight: number; transactionDate?: string }[];
}

interface BatchSearchModalProps {
  onSelect: (batch: Batch) => void;
  onClose: () => void;
  partyId?: string;
  status?: string;
}

export function BatchSearchModal({ onSelect, onClose, partyId, status }: BatchSearchModalProps) {
  const [search, setSearch] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electronAPI.listBatches({ 
      assignedTo: partyId,
      status: status
    }).then(res => {
      if (res.success) setBatches(res.data as Batch[]);
    });
    inputRef.current?.focus();
  }, [partyId, status]);

  const getWeight = (b: Batch) => {
    return b.transactions?.[0]?.netPureGoldWeight || 0;
  };

  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const filtered = batches.filter(b => 
    b.batchNo.toLowerCase().includes(search.toLowerCase()) || 
    b.item?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="p-6 border-b border-border bg-background/20 relative">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-primary" size={24} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search recent batches..."
            className="w-full bg-surface/50 border border-border rounded-2xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text"
          />
        </div>

        <div className="max-h-[450px] overflow-y-auto p-4 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
              <Layers size={48} className="text-border mb-4" />
              <p className="font-bold text-text-muted">No historical batches found.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((batch, idx) => {
                const weight = getWeight(batch);
                return (
                  <button
                    key={batch.id}
                    ref={idx === selectedIndex ? selectedRef : null}
                    onClick={() => onSelect(batch)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                      selectedIndex === idx ? 'bg-primary/5 border-primary/20 translate-x-1' : 'border-transparent hover:bg-surface'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                        selectedIndex === idx ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-background text-text-muted'
                      }`}>
                        <Layers size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-primary uppercase tracking-widest">{batch.batchNo}</p>
                        <p className="text-lg font-black">{batch.item?.name || 'Unknown Item'}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500 flex items-center gap-1">
                        <Scale size={14} /> {weight.toFixed(3)}g
                      </p>
                      <p className="text-[10px] font-bold text-text-muted flex items-center gap-1 underline underline-offset-2 decoration-border">
                        <Calendar size={12} /> {batch.transactions?.[0]?.transactionDate || new Date(batch.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
}
