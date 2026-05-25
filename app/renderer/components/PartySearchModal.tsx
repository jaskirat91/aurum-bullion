import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, User, ArrowDown, ArrowUp, CornerDownLeft, Plus } from 'lucide-react';
import { useNavigationStore } from '@/store/navigationStore';

interface Party {
  id: string;
  name: string;
  code: string;
  type: string;
  city?: string;
  ledger_account_id?: string;
}

interface PartySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (party: Party) => void;
  onQuickAdd?: () => void;
  partyTypes?: string[];
}

export function PartySearchModal({ isOpen, onClose, onSelect, onQuickAdd, partyTypes = [] }: PartySearchModalProps) {
  const { navigateWithAction } = useNavigationStore();
  const [search, setSearch] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [filtered, setFiltered] = useState<Party[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchParties = () => {
    window.electronAPI.listParties({ types: partyTypes }).then((res: any) => {
      if (res.success) setParties(res.data);
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchParties();
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const term = search.toLowerCase();
    const results = parties.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.code.toLowerCase().includes(term)
    );
    setFiltered(results);
    setSelectedIndex(0);
  }, [search, parties]);

  const handleQuickAdd = () => {
    if (onQuickAdd) {
      onQuickAdd();
    } else {
      onClose();
      navigateWithAction('PARTIES', 'REGISTER_PARTY');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      handleQuickAdd();
    }
  };

  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex, isOpen]);

  const modalRoot = document.getElementById('modal-root');
  if (!isOpen || !modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border bg-background/20 flex items-center gap-4">
          <Search className="text-primary shrink-0" size={24} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search parties by name or code..."
            className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-text-muted/30 text-text"
          />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-background/50 border border-border rounded-lg text-[10px] font-black text-text-muted uppercase">
            Esc
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-surface scroll-smooth">
          {filtered.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <p className="text-text-muted font-medium italic">No parties found matching "{search}"</p>
              <button 
                onClick={handleQuickAdd}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-sm hover:bg-primary/20 transition-all"
              >
                <Plus size={16} /> Create New Party (Ctrl+N)
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((party, idx) => (
                <div
                  key={party.id}
                  ref={idx === selectedIndex ? selectedRef : null}
                  onClick={() => onSelect(party)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    idx === selectedIndex ? 'bg-primary text-white shadow-lg shadow-primary/30 -translate-x-1' : 'hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${idx === selectedIndex ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`text-[10px] font-black tracking-widest uppercase opacity-70 ${idx === selectedIndex ? 'text-white' : 'text-primary'}`}>
                          {party.code}
                        </div>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${idx === selectedIndex ? 'bg-white/20 border-white/40 text-white' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                           {party.type}
                        </span>
                      </div>
                      <div className="font-extrabold text-base tracking-tight">{party.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {party.city && (
                      <div className={`flex items-center gap-2 text-xs font-bold ${idx === selectedIndex ? 'text-white/80' : 'text-text-muted'}`}>
                        <MapPin size={12} /> {party.city}
                      </div>
                    )}
                    {idx === selectedIndex && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded text-[10px] font-black uppercase">
                        Select <CornerDownLeft size={10} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-background/30 flex items-center justify-between text-[10px] font-black text-text-muted uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><ArrowUp size={10} /><ArrowDown size={10} /> Navigate</span>
            <span className="flex items-center gap-1.5"><Plus size={10} /> Ctrl+N New Party</span>
          </div>
          <div>{filtered.length} Parties Found</div>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
