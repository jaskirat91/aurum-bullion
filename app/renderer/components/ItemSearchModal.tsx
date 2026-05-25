import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Package, Command, X, Tag, Scale } from 'lucide-react';

export interface Item {
  id: string;
  name: string;
  code: string;
  category: string;
  uom: string;
}

interface ItemSearchModalProps {
  onSelect: (item: Item) => void;
  onClose: () => void;
  categoryFilter?: string[];
}

export function ItemSearchModal({ onSelect, onClose, categoryFilter }: ItemSearchModalProps) {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.electronAPI.listItems().then(res => {
      if (res.success) {
        let allItems = res.data as Item[];
        if (categoryFilter && categoryFilter.length > 0) {
          allItems = allItems.filter(i => categoryFilter.includes(i.category));
        }
        setItems(allItems);
      }
    });
    inputRef.current?.focus();
  }, [categoryFilter]);

  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.code.toLowerCase().includes(search.toLowerCase())
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
      
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        <div className="p-6 border-b border-border bg-background/20 relative">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-primary" size={24} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search item by name or code..."
            className="w-full bg-surface/50 border border-border rounded-2xl py-5 pl-16 pr-6 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text"
          />
          <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="bg-background/80 border border-border px-2 py-1 rounded text-[10px] font-black text-text-muted flex items-center gap-1 shadow-sm">
               ESC to close
            </span>
          </div>
        </div>

        <div className="max-h-[450px] overflow-y-auto p-4 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
              <Package size={48} className="text-border mb-4" />
              <p className="font-bold text-text-muted">No items found matching "{search}"</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  ref={idx === selectedIndex ? selectedRef : null}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${
                    selectedIndex === idx 
                      ? 'bg-primary/5 border-primary/20 translate-x-1' 
                      : 'border-transparent hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                      selectedIndex === idx ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-background text-text-muted'
                    }`}>
                      <Tag size={20} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{item.code}</span>
                      </div>
                      <p className="text-lg font-black tracking-tight">{item.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-text-muted uppercase bg-background border border-border px-2 py-1 rounded-lg">
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-black text-secondary uppercase bg-secondary/10 border border-secondary/20 px-2 py-1 rounded-lg">
                      {item.uom}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-background/40 border-t border-border flex items-center justify-between px-8">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase text-text-muted tracking-widest">
            <div className="flex items-center gap-2"><Command size={14} /> Navigate</div>
            <div className="flex items-center gap-2"><div className="h-4 w-6 bg-border rounded flex items-center justify-center text-[10px]">⏎</div> Select</div>
          </div>
          <p className="text-[10px] font-bold text-text-muted opacity-50">Aurum Inventory Engine v1.0</p>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
