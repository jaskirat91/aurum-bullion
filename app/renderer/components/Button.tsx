import React, { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantMap: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:ring-primary/40',
  secondary:
    'bg-gradient-to-r from-secondary to-pink-600 text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/40 focus:ring-secondary/40',
  danger:
    'bg-gradient-to-r from-danger to-red-600 text-white shadow-lg shadow-danger/20 hover:shadow-danger/40 focus:ring-danger/40',
  success:
    'bg-gradient-to-r from-success to-teal-600 text-white shadow-lg shadow-success/20 hover:shadow-success/40 focus:ring-success/40',
  ghost:
    'bg-surface text-text-muted border border-border hover:bg-surface/10 hover:text-text focus:ring-primary/20',
};

const sizeMap: Record<Size, string> = {
  sm: 'py-2 px-4 text-xs font-black uppercase tracking-widest',
  md: 'py-2.5 px-6 text-sm font-black uppercase tracking-widest',
  lg: 'py-3 px-8 text-base font-black uppercase tracking-widest',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        disabled={disabled || loading}
        className={`
          relative inline-flex items-center justify-center gap-2 rounded-xl
          transition-all duration-200 focus:outline-none focus:ring-4
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantMap[variant]} ${sizeMap[size]} ${className}
        `}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Processing…
          </span>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
