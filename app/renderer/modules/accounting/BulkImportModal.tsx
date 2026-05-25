import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/Button';
import { AccountSelect } from '@/components/AccountSelect';

interface BulkImportModalProps {
  onClose: () => void;
  onImportStarted: (importId: string) => void;
}

export function BulkImportModal({ onClose, onImportStarted }: BulkImportModalProps) {
  const [bankAccountId, setBankAccountId] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accountSelectRef = React.useRef<any>(null);

  useEffect(() => {
    // Focus the account select after a brief delay to ensure modal is rendered
    const timer = setTimeout(() => {
      accountSelectRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (['csv', 'xls', 'xlsx'].includes(ext || '')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid CSV or Excel file.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!bankAccountId || !file) {
      setError('Please select both a bank account and a file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const res = await window.electronAPI.importBankStatement({
          bankLedgerAccountId: bankAccountId,
          filePath: (file as any).path || file.name,
          fileBuffer: arrayBuffer as any,
          fileName: file.name,
          uploadedBy: 'System User'
        });

        if (res.success && res.data) {
          onImportStarted(res.data.importId);
        } else {
          setError(res.error || 'Failed to import bank statement.');
        }
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err.message || 'An error occurred during import.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-text">Bulk Import Bank Statement</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">Import CSV/Excel transactions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors text-text-muted">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Bank Account Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Select Bank Account Ledger</label>
            <AccountSelect
              label=""
              value={bankAccountId}
              displayValue={bankAccountName}
              onChange={(id, name) => {
                setBankAccountId(id);
                setBankAccountName(name);
              }}
              inputRef={accountSelectRef}
              placeholder="Select Bank/Cash Account..."
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Upload Statement File (.csv, .xls, .xlsx)</label>
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${file ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-primary/5'}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const droppedFile = e.dataTransfer.files[0];
                  const ext = droppedFile.name.split('.').pop()?.toLowerCase();
                  if (['csv', 'xls', 'xlsx'].includes(ext || '')) {
                    setFile(droppedFile);
                    setError(null);
                  } else {
                    setError('Please select a valid CSV or Excel file.');
                  }
                }
              }}
            >
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".csv,.xls,.xlsx" 
                onChange={handleFileChange}
              />
              
              {file ? (
                <>
                  <div className="p-3 bg-primary/20 text-primary rounded-2xl">
                    <FileText size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[10px] text-text-muted font-medium">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-text-muted/10 text-text-muted rounded-2xl">
                    <Upload size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text">Click to browse or drag & drop</p>
                    <p className="text-[10px] text-text-muted font-medium">Supported: .csv, .xls, .xlsx</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-background/50 border-t border-border/40 flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={handleSubmit} 
            loading={loading}
            disabled={!file || !bankAccountId}
            icon={<CheckCircle2 size={16} />}
            className="rounded-xl shadow-lg shadow-primary/10 px-6 font-bold uppercase tracking-widest text-[10px]"
          >
            {loading ? 'Processing...' : 'Parse Statement'}
          </Button>
        </div>
      </div>
    </div>
  );
}
