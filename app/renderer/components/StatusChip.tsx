import React from 'react';

export type StatusType = 'RECEIVED' | 'WIP' | 'COMPLETED' | 'IN_STOCK' | 'SOLD' | 'POSTED' | 'DRAFT' | 'VOID' | 'CANCELLED' | 'OPEN';

const statusConfig: Record<StatusType, { label: string; classes: string }> = {
  RECEIVED: { label: 'Received', classes: 'bg-primary/15 text-primary border-primary/30' },
  WIP:      { label: 'WIP', classes: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  COMPLETED:{ label: 'Completed', classes: 'bg-success/15 text-success border-success/30' },
  IN_STOCK: { label: 'In Stock', classes: 'bg-secondary/15 text-secondary border-secondary/30' },
  SOLD:     { label: 'Sold', classes: 'bg-danger/15 text-danger border-danger/30' },
  POSTED:   { label: 'Posted', classes: 'bg-success/15 text-success border-success/30' },
  DRAFT:    { label: 'Draft', classes: 'bg-text-muted/15 text-text-muted border-text-muted/30' },
  VOID:      { label: 'Void',      classes: 'bg-danger/15 text-danger border-danger/30' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  OPEN:      { label: 'Open',      classes: 'bg-primary/15 text-primary border-primary/30' },
};

interface StatusChipProps {
  status: StatusType;
}

export function StatusChip({ status }: StatusChipProps) {
  const config = statusConfig[status] ?? { label: status, classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

// ─── Toast/Alert ─────────────────────────────────────────────────────────────

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

const alertConfig = {
  success: { bg: 'bg-success/10', border: 'border-success/40', text: 'text-success', icon: '✓' },
  error:   { bg: 'bg-danger/10', border: 'border-danger/40', text: 'text-danger', icon: '✕' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-500', icon: '⚠' },
  info:    { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary', icon: 'ℹ' },
};

export function Alert({ type, message, onClose }: AlertProps) {
  const c = alertConfig[type];
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg} ${c.border} animate-fade-in`}>
      <span className={`text-lg font-black leading-none ${c.text}`}>{c.icon}</span>
      <p className={`flex-1 text-sm font-medium ${c.text}`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-text-muted hover:text-text transition-colors text-xs">
          ✕
        </button>
      )}
    </div>
  );
}
