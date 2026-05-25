import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'question' | 'warning' | 'info' | 'error' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  type = 'question',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (document.activeElement === confirmBtnRef.current) {
        cancelBtnRef.current?.focus();
      } else {
        confirmBtnRef.current?.focus();
      }
    }
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={24} />;
      case 'error':
        return <AlertTriangle className="text-red-500" size={24} />;
      case 'info':
        return <Info className="text-blue-500" size={24} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-500" size={24} />;
      default:
        return <Info className="text-primary" size={24} />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      case 'error': return 'border-red-500/20 bg-red-500/5';
      case 'info': return 'border-blue-500/20 bg-blue-500/5';
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5';
      default: return 'border-primary/20 bg-primary/5';
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'warning': return 'primary';
      case 'error': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-surface border border-border shadow-2xl rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 border ${getAccentColor()}`}>
              {getIcon()}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-text leading-tight">{title}</h2>
              <p className="text-sm text-text-muted font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {type === 'question' || type === 'warning' ? (
              <>
                <Button 
                  ref={cancelBtnRef}
                  variant="ghost" 
                  onClick={onCancel} 
                  onKeyDown={handleKeyDown}
                  className="rounded-xl px-6 font-black uppercase text-[10px] tracking-widest"
                >
                  {cancelLabel}
                </Button>
                <Button 
                  ref={confirmBtnRef}
                  autoFocus
                  variant={getButtonVariant() as any} 
                  onClick={onConfirm} 
                  onKeyDown={handleKeyDown}
                  className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10"
                >
                  {confirmLabel}
                </Button>
              </>
            ) : (
              <Button 
                ref={confirmBtnRef}
                autoFocus
                variant="primary" 
                onClick={onConfirm} 
                onKeyDown={handleKeyDown}
                className="rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10"
              >
                OK
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
