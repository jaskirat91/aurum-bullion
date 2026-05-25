import React, { useState, useImperativeHandle, useRef } from 'react';
import { ItemSearchModal } from './ItemSearchModal';
import { FormField, Input } from './FormField';
import { Search, X } from 'lucide-react';

interface ItemSelectProps {
  label: string;
  value: string;
  displayValue: string;
  onChange: (id: string, display: string) => void;
  onNext?: () => void;
  required?: boolean;
  inputRef?: React.RefObject<any>;
  categoryFilter?: string[];
  placeholder?: string;
  compact?: boolean;
}

export function ItemSelect({ 
  label, value, displayValue, onChange, onNext, required, inputRef, categoryFilter, placeholder = "Select Item...", compact
}: ItemSelectProps) {
  const [showModal, setShowModal] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(inputRef, () => ({
    focus: () => localRef.current?.focus()
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="relative group">
        {!compact && <span className="text-[9px] font-black uppercase text-text-muted opacity-60 mb-1.5 block">{label}</span>}
        <div className="relative">
          <Input
            ref={localRef}
            value={displayValue}
            readOnly
            onClick={() => setShowModal(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${compact ? 'h-9 py-2 text-[11px]' : 'h-10 py-2.5 text-xs'} pl-10 pr-10 font-bold cursor-pointer border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-background/50 rounded-xl`}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-40 group-hover:opacity-100 transition-colors pointer-events-none" size={compact ? 14 : 16} />
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
                localRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger hover:bg-danger/10 p-1 rounded-md transition-colors flex items-center justify-center shrink-0"
            >
              <X size={compact ? 14 : 16} />
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <ItemSearchModal
          categoryFilter={categoryFilter}
          onSelect={(item) => {
            onChange(item.id, `${item.code} - ${item.name}`);
            setShowModal(false);
            setTimeout(() => onNext?.(), 50);
          }}
          onClose={() => {
            setShowModal(false);
            localRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
