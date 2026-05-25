import React, { useState, useImperativeHandle } from 'react';
import { FormField, Input } from './FormField';
import { AccountSearchModal } from './AccountSearchModal';
import { Hash, X } from 'lucide-react';

interface AccountSelectProps {
  label: string;
  value: string; // The selected Account ID
  displayValue: string; // The Code/Name to show in the input
  onChange: (id: string, name: string) => void;
  onNext?: () => void;
  required?: boolean;
  inputRef?: React.RefObject<any>;
  groupsOnly?: boolean;
  leafOnly?: boolean;
  allowedTypes?: string[];
  allowedSubtypes?: string[];
}

export function AccountSelect({ 
  label, value, displayValue, onChange, onNext, required, inputRef, groupsOnly, leafOnly, allowedTypes, allowedSubtypes 
}: AccountSelectProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const localRef = React.useRef<HTMLInputElement>(null);

  useImperativeHandle(inputRef, () => ({
    focus: () => localRef.current?.focus()
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      setModalOpen(true);
    }
  };

  return (
    <>
      <FormField label={label} required={required}>
        <div className="relative">
          <Input
            ref={localRef}
            value={displayValue}
            readOnly
            onClick={() => setModalOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Select Account..."
            className="cursor-pointer pr-10 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            required={required}
          />
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
                localRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-danger hover:bg-danger/10 p-1 rounded-md transition-colors flex items-center justify-center shrink-0"
            >
              <X size={16} />
            </button>
          ) : (
            <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-40 shrink-0 pointer-events-none" size={16} />
          )}
        </div>
      </FormField>

      <AccountSearchModal
        isOpen={modalOpen}
        groupsOnly={groupsOnly}
        leafOnly={leafOnly}
        allowedTypes={allowedTypes}
        allowedSubtypes={allowedSubtypes}
        onClose={() => {
          setModalOpen(false);
          // Return focus to input when modal closes
          localRef.current?.focus();
        }}
        onSelect={(acc) => {
          onChange(acc.id, `${acc.code} - ${acc.name}`);
          setModalOpen(false);
          // Small delay to ensure focus is stable before calling onNext
          setTimeout(() => onNext?.(), 50);
        }}
      />
    </>
  );
}
