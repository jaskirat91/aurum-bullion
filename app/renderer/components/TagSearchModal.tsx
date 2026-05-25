import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Tag, ArrowDown, ArrowUp, CornerDownLeft } from 'lucide-react';

interface TagItem {
  id: string;
  tag: string;
  tagGrossWeight: number;
  tagNetWeight: number;
  tagAmount: number;
  tagKundanWeight: number;
  tagStoneWeight: number;
  tagMottiWeight: number;
  purityPercentage: number;
  soldGoldPercentage?: number;
  soldAmountPercentage?: number;
  finishedItem?: { name: string; code: string };  
}

interface TagSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tag: TagItem) => void;
  status?: 'IN_STOCK' | 'SOLD';
  customerId?: string;
}

export function TagSearchModal({ isOpen, onClose, onSelect, status, customerId }: TagSearchModalProps) {
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState<TagItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTags = async () => {
    const res = await window.electronAPI.listFinishedProducts({
      status: status || 'IN_STOCK',
      partyId: customerId || undefined,
      limit: 100
    });
    if (res.success) setTags(res.data?.items || []);
  };

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  const filtered = tags.filter(t => 
    t.tag.toLowerCase().includes(search.toLowerCase()) || 
    t.finishedItem?.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const modalRoot = document.getElementById('modal-root');
  if (!isOpen || !modalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl bg-surface border border-border shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border bg-background/20 flex items-center gap-4">
          <Search className="text-primary shrink-0" size={24} />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tags by tag no or item name..."
            className="w-full bg-transparent text-xl font-bold focus:outline-none placeholder:text-text-muted/30 text-text"
          />
        </div>

        <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-surface scroll-smooth">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-text-muted font-medium italic">No available stock found.</div>
          ) : (
            <div className="p-3 space-y-1">
              {filtered.map((tag, idx) => (
                <div
                  key={tag.id}
                  onClick={() => onSelect(tag)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                    idx === selectedIndex ? 'bg-primary text-white shadow-lg shadow-primary/30 -translate-x-1' : 'hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${idx === selectedIndex ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                      <Tag size={20} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black tracking-widest uppercase opacity-70">
                        {tag.finishedItem?.code || 'NOCODE'}
                      </div>
                      <div className="font-extrabold text-base tracking-tight">{tag.tag} | {tag.finishedItem?.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <div className="text-[9px] font-black uppercase opacity-60">Net WT</div>
                       <div className="font-black text-sm">{Number(tag.tagNetWeight).toFixed(3)}g</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] font-black uppercase opacity-60">Amount</div>
                       <div className="font-black text-sm">₹{tag.tagAmount}</div>
                    </div>
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
      </div>
    </div>,
    modalRoot
  );
}
