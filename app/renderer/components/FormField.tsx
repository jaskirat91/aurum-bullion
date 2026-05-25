import React, { forwardRef } from 'react';

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  accentColor?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: React.ReactNode;
  labelSize?: string;
}

const accentMap = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  danger: 'text-danger',
  success: 'text-success',
};

export function FormField({
  label,
  hint,
  required,
  children,
  className = '',
  accentColor,
  icon,
  labelSize = 'text-[10px]',
}: FormFieldProps) {
  const labelColor = accentColor ? accentMap[accentColor] : 'text-text-muted';
  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`flex items-center gap-1.5 uppercase tracking-wider font-extrabold ${labelSize} ${labelColor}`}>
        {icon && <span className="opacity-80">{icon}</span>}
        {label}
        {required && <span className="text-secondary ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  accentColor?: 'primary' | 'secondary' | 'danger';
  mono?: boolean;
}

const inputAccentMap = {
  primary: 'border-primary/40 focus:ring-primary/20 focus:border-primary',
  secondary: 'border-secondary/40 focus:ring-secondary/20 focus:border-secondary',
  danger: 'border-danger/40 focus:ring-danger/20 focus:border-danger',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ accentColor, mono, className = '', ...props }, ref) => {
    const accent = accentColor ? inputAccentMap[accentColor] : 'border-border focus:ring-primary/20 focus:border-primary';
    return (
      <input
        ref={ref}
        {...props}
        className={`
          w-full bg-surface/80 border rounded-lg px-3 py-2 text-text text-sm
          focus:outline-none focus:ring-2 transition-all shadow-sm
          placeholder:text-text-muted disabled:opacity-40 disabled:cursor-not-allowed
          ${accent} ${mono ? 'font-mono' : ''} ${className}
        `}
      />
    );
  }
);

Input.displayName = 'Input';

// ─── ReadonlyField ────────────────────────────────────────────────────────────

interface ReadonlyFieldProps {
  value: string | number;
  mono?: boolean;
  highlight?: boolean;
}

export function ReadonlyField({ value, mono, highlight }: ReadonlyFieldProps) {
  return (
    <div
      className={`
        w-full rounded-lg px-3 py-2 text-sm border border-border
        ${highlight
          ? 'bg-gradient-to-r from-primary/10 to-transparent border-primary/30 text-primary font-bold'
          : 'bg-surface/60 text-text-muted'}
        ${mono ? 'font-mono tracking-wider' : ''}
      `}
    >
      {value}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        {...props}
        className={`
          w-full bg-surface border border-border rounded-lg px-3 py-2
          text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all shadow-sm appearance-none cursor-pointer
          disabled:opacity-40 ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
