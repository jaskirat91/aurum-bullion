import React, { useState, useImperativeHandle, useRef } from 'react';
import { FormField, Input } from './FormField';
import { PartySearchModal } from './PartySearchModal';
import { Search, X } from 'lucide-react';

interface Party {
  id: string;
  name: string;
  code: string;
  type: string;
  city?: string;
  ledger_account_id?: string;
}

interface PartySelectProps {
  label: string;
  value: string;
  displayValue: string;
  onChange: (id: string, code: string, name: string, type: string, accountId?: string) => void;
  onNext?: () => void;
  required?: boolean;
  inputRef?: React.RefObject<any>;
  partyTypes: string[];
  className?: string;
  labelSize?: string;
  inputHeight?: string;
  fontSize?: string;
}

export function PartySelect({ 
  label, 
  value, 
  displayValue, 
  onChange, 
  onNext, 
  required, 
  inputRef,
  partyTypes,
  className = '',
  labelSize,
  inputHeight,
  fontSize,
}: PartySelectProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(inputRef, () => ({
    focus: () => localRef.current?.focus()
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2' || e.key === 'Enter') {
      e.preventDefault();
      setModalOpen(true);
    } else if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  const handleSelect = (party: Party) => {
    onChange(party.id, party.code, party.name, party.type, party.ledger_account_id);
    setModalOpen(false);
    setTimeout(() => onNext?.(), 50);
  };

  return (
    <>
      <div className="relative group">
        <FormField label={label} required={required} labelSize={labelSize}>
          <div className="relative">
            <Input
              ref={localRef}
              value={displayValue}
              readOnly
              onClick={() => setModalOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Select Party..."
              className={`pl-10 pr-10 font-bold cursor-pointer transition-all outline-none ${inputHeight} ${fontSize} ${className}`}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary opacity-40 group-hover:opacity-100 transition-colors pointer-events-none" size={16} />
            {value && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('', '', '', '');
                  localRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger hover:bg-danger/10 p-1 rounded-md transition-colors flex items-center justify-center shrink-0"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </FormField>
      </div>

      <PartySearchModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          localRef.current?.focus();
        }}
        onSelect={handleSelect}
        partyTypes={partyTypes ?? []}
      />
    </>
  );
}
