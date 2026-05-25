import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Hash, Tag, ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  code: string;
  account_type: string;
  account_subtype?: string;
  is_group: boolean;
}

interface AccountSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  groupsOnly?: boolean;
  leafOnly?: boolean;
  excludeId?: string;
  allowedTypes?: string[];
  allowedSubtypes?: string[];
  allowUnselect?: boolean;
}

export function AccountSearchModal({ 
  isOpen, onClose, onSelect, groupsOnly, leafOnly, excludeId, allowedTypes, allowedSubtypes, allowUnselect 
}: AccountSearchModalProps) {
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filtered, setFiltered] = useState<Account[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.listAccounts().then((res: any) => {
        if (res.success) {
          let data = res.data;
          if (groupsOnly) {
            data = data.filter((a: any) => a.is_group);
          }
          if (leafOnly) {
            data = data.filter((a: any) => !a.is_group);
          }
          if (excludeId) {
            data = data.filter((a: any) => a.id !== excludeId);
          }
          if (allowedTypes && allowedTypes.length > 0) {
            data = data.filter((a: any) => allowedTypes.includes(a.account_type));
          }
          if (allowedSubtypes && allowedSubtypes.length > 0) {
            data = data.filter((a: any) => allowedSubtypes.includes(a.account_subtype));
          }
          setAccounts(data);
        }
      });
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen, groupsOnly, excludeId, allowedTypes, allowedSubtypes]);

  useEffect(() => {
    const term = search.toLowerCase();
    const results = accounts.filter(a => 
      a.name.toLowerCase().includes(term) || 
      a.code.toLowerCase().includes(term)
    );

    if (allowUnselect) {
      results.unshift({
        id: '',
        name: 'None (Clear Selection)',
        code: '---',
        account_type: 'SYSTEM',
        is_group: false
      } as Account);
    }

    setFiltered(results);
    setSelectedIndex(0);
  }, [search, accounts, allowUnselect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) onSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
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
          <Search className="text-emerald-500 shrink-0" size={24} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Ledger Accounts (e.g. Cash, Bank...)"
            className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-text-muted/30 text-text"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted italic">No accounts found.</div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((account, idx) => (
                <div
                  key={account.id}
                  ref={idx === selectedIndex ? selectedRef : null}
                  onClick={() => onSelect(account)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    idx === selectedIndex ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'hover:bg-emerald-500/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${idx === selectedIndex ? 'bg-white/20' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      <Hash size={20} />
                    </div>
                    <div>
                      <div className={`text-[10px] font-black uppercase opacity-70 ${idx === selectedIndex ? 'text-white' : 'text-emerald-500'}`}>
                        {account.code}
                      </div>
                      <div className="font-extrabold text-base">{account.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${idx === selectedIndex ? 'border-white/30' : 'border-border'}`}>
                        {account.account_type}
                     </span>
                     {idx === selectedIndex && <CornerDownLeft size={16} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    modalRoot
  );
}
