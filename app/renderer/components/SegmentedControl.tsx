import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (value: T) => void;
  onEnter?: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
}

export function SegmentedControl<T extends string>({ 
  options, 
  value, 
  onChange, 
  onEnter,
  inputRef 
}: SegmentedControlProps<T>) {
  return (
    <div 
      className="flex bg-surface border border-border p-0.5 rounded-lg h-[29px] items-center"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        const activeColorClass = opt.color || 'bg-primary';
        const shadowClass = opt.color ? `shadow-${opt.color.split('-')[1]}/20` : 'shadow-primary/20';

        return (
          <label key={opt.value} className="relative flex-1 h-full cursor-pointer group focus-within:ring-2 focus-within:ring-primary/20 rounded-md">
            <input
              ref={isActive ? inputRef : null}
              type="radio"
              name="segmented-control"
              value={opt.value}
              checked={isActive}
              onChange={() => onChange(opt.value)}
              className="absolute opacity-0 w-0 h-0"
            />
            <div className={`px-3 h-full rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap ${
              isActive 
              ? `${activeColorClass} text-white shadow-sm ${shadowClass}` 
              : 'text-text-muted group-hover:text-text'
            }`}>
              {opt.label}
            </div>
          </label>
        );
      })}
    </div>
  );
}
