import React, { useState, useRef, useEffect } from 'react';
import { PartySelect } from '@/components/PartySelect';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { LineItemDialog, LineItem } from './LineItemDialog';
import {
  Receipt, Calendar, FileText, UserCheck, Plus, Trash2, Pencil,
  RotateCcw, Save, SendHorizonal, Tag, Weight, IndianRupee,
  Percent, ArrowLeft, AlertCircle,
} from 'lucide-react';

interface SaleVoucherFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editVoucherId?: string;
  initialData?: {
    entryDate: string;
    narration: string;
    customerId: string;
    customerName: string;
    lineItems: LineItem[];
  };
}

export function SaleVoucherForm({ onCancel, onSuccess, editVoucherId, initialData }: SaleVoucherFormProps) {
  const isEdit = !!editVoucherId;
  const today = new Date().toISOString().split('T')[0];

  const [entryDate, setEntryDate] = useState(initialData?.entryDate ?? today);
  const [narration, setNarration] = useState(initialData?.narration ?? '');
  const [customerId, setCustomerId] = useState(initialData?.customerId ?? '');
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? '');
  const [lineItems, setLineItems] = useState<LineItem[]>(initialData?.lineItems ?? []);
  const [showLineItemDialog, setShowLineItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<'DRAFT' | 'POST' | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);

  const dateRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const customerRef = useRef<any>(null);

  useEffect(() => {
    setTimeout(() => dateRef.current?.focus(), 200);
  }, []);

  // Fetch party balances whenever customer changes
  useEffect(() => {
    let mounted = true;
    if (customerId) {
      window.electronAPI.getPartyBalances(customerId).then(res => {
        if (mounted && res.success) setBalances(res.data);
      });
    } else {
      setBalances(null);
    }
    return () => { mounted = false; };
  }, [customerId]);

  const totalGold = lineItems.reduce((s, i) => s + Number(i.goldWeight), 0);
  const totalAmount = lineItems.reduce((s, i) => s + Number(i.labourAmount), 0);

  const handleAddItem = (item: LineItem) => {
    const duplicate = lineItems.find(li => li.productId === item.productId);
    if (duplicate) {
      setAlert({ type: 'error', msg: `Tag "${item.tag}" is already added to this voucher.` });
      return;
    }
    setLineItems(prev => [...prev, item]);
  };

  const handleUpdateItem = (item: LineItem) => {
    if (editingIndex === null) return;
    setLineItems(prev => {
      const copy = [...prev];
      copy[editingIndex] = item;
      return copy;
    });
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleEditItemClick = (item: LineItem, index: number) => {
    setEditingItem(item);
    setEditingIndex(index);
    setShowLineItemDialog(true);
  };

  const handleRemoveItem = (productId: string) => {
    setLineItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleReset = () => {
    setEntryDate(today);
    setNarration('');
    setCustomerId('');
    setCustomerName('');
    setLineItems([]);
    setAlert(null);
    setBalances(null);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

  const handleSubmit = async (action: 'DRAFT' | 'POST') => {
    setAlert(null);
    if (!entryDate) { setAlert({ type: 'error', msg: 'Entry date is required.' }); return; }
    if (!customerId) { setAlert({ type: 'error', msg: 'Please select a customer.' }); return; }
    if (lineItems.length === 0) { setAlert({ type: 'error', msg: 'Add at least one line item.' }); return; }

    setLoading(action);
    try {
      const dto = {
        entryDate,
        narration: narration.trim() || undefined,
        customerId,
        items: lineItems.map(li => ({
          productId: li.productId,
          purityPercentage: li.purityPercentage,
          goldWeight: li.goldWeight,
          labourPercentage: li.labourPercentage,
          labourAmount: li.labourAmount,
        })),
        action,
      };

      const res = isEdit
        ? await window.electronAPI.updateSaleVoucher(editVoucherId!, dto)
        : await window.electronAPI.createSaleVoucher(dto);
      if (res.success) {
        const voucherNo = (res.data as any)?.voucherNo ?? '';
        const msg = action === 'POST'
          ? `Sale Voucher posted successfully! Voucher No: ${voucherNo}`
          : `Draft saved successfully! Voucher No: ${voucherNo}`;
        setAlert({ type: 'success', msg });
        setTimeout(() => onSuccess(), 2000);
      } else {
        setAlert({ type: 'error', msg: (res as any).error ?? 'Operation failed.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'A system error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      {/* Left Side: Main Form */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border/50">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-text leading-none">
                {isEdit ? 'Edit Sale Voucher' : 'Create Sale Voucher'}
              </h2>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                {isEdit ? 'Update voucher details and optionally re-post' : 'Sell finished stock to customers'}
              </p>
            </div>
          </div>
          {/* Totals summary */}
          {lineItems.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[8px] font-black uppercase text-text-muted tracking-widest">Total Gold</div>
                <div className="text-sm font-black text-primary">{totalGold.toFixed(3)} g</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-right">
                <div className="text-[8px] font-black uppercase text-text-muted tracking-widest">Total Amount</div>
                <div className="text-sm font-black text-emerald-500">₹ {totalAmount.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Alert */}
        {alert && (
          <div className="shrink-0 px-6 pt-3 animate-in slide-in-from-top-2 duration-200">
            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">
          {/* Row 1: Date + Narration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <Calendar size={10} /> Entry Date <span className="text-danger">*</span>
              </label>
              <input
                ref={dateRef}
                type="date"
                value={entryDate}
                max={today}
                onChange={e => setEntryDate(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), narrationRef.current?.focus())}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <FileText size={10} /> Narration
              </label>
              <input
                ref={narrationRef}
                type="text"
                value={narration}
                onChange={e => setNarration(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), customerRef.current?.focus())}
                placeholder="Optional note for this sale voucher..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/40"
              />
            </div>
          </div>

          {/* Row 2: Customer */}
          <div className="max-w-sm">
            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
              <UserCheck size={10} /> Customer <span className="text-danger">*</span>
            </label>
            <PartySelect
              inputRef={customerRef}
              label=""
              value={customerId}
              displayValue={customerName}
              partyTypes={["CUSTOMER"]}
              onChange={(id, code, name) => {
                setCustomerId(id);
                setCustomerName(`${code} — ${name}`);
              }}
              inputHeight="h-10"
              fontSize="text-sm"
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text">Line Items</span>
                {lineItems.length > 0 && (
                  <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {lineItems.length} item{lineItems.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setEditingIndex(null);
                  setShowLineItemDialog(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div
                onClick={() => {
                  setEditingItem(null);
                  setEditingIndex(null);
                  setShowLineItemDialog(true);
                }}
                className="flex flex-col items-center justify-center gap-2 h-32 border-2 border-dashed border-border hover:border-primary/30 rounded-2xl cursor-pointer transition-all group"
              >
                <Tag size={24} className="text-text-muted/30 group-hover:text-primary/50 transition-colors" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-primary transition-colors">
                  Click to add finished stock items
                </p>
              </div>
            ) : (
              <div className="bg-surface/30 border border-border/50 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-background/50 border-b border-border/40">
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted w-8">#</th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted">Tag</th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted">Item Name</th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">
                        <span className="flex items-center justify-end gap-1"><Percent size={9} /> Purity</span>
                      </th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">
                        <span className="flex items-center justify-end gap-1"><Weight size={9} /> Gold Wt (g)</span>
                      </th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">
                        <span className="flex items-center justify-end gap-1"><Percent size={9} /> Labour %</span>
                      </th>
                      <th className="px-4 py-2.5 text-[8px] font-black uppercase tracking-widest text-text-muted text-right">
                        <span className="flex items-center justify-end gap-1"><IndianRupee size={9} /> Amount</span>
                      </th>
                      <th className="px-4 py-2.5 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {lineItems.map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-4 py-3 text-[10px] font-black text-text-muted">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg">
                            {item.tag}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-text">{item.itemName}</td>
                        <td className="px-4 py-3 text-xs font-bold text-text text-right">{item.purityPercentage.toFixed(3)}%</td>
                        <td className="px-4 py-3 text-xs font-black text-primary text-right">{Number(item.goldWeight).toFixed(3)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-text text-right">{item.labourPercentage.toFixed(2)}%</td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-500 text-right">₹ {Number(item.labourAmount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditItemClick(item, idx)}
                              className="h-6 w-6 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20"
                              title="Edit Item"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.productId)}
                              className="h-6 w-6 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                              title="Remove Item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {lineItems.length > 1 && (
                    <tfoot>
                      <tr className="bg-background/40 border-t border-border/60">
                        <td colSpan={4} className="px-4 py-2.5 text-[9px] font-black uppercase text-text-muted tracking-widest">Totals</td>
                        <td className="px-4 py-2.5 text-xs font-black text-primary text-right">{totalGold.toFixed(3)}</td>
                        <td />
                        <td className="px-4 py-2.5 text-xs font-black text-emerald-500 text-right">₹ {totalAmount.toLocaleString()}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-surface/50 flex items-center gap-3">
          {/* <button
            onClick={() => handleSubmit('DRAFT')}
            disabled={loading !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface hover:bg-background text-text text-xs font-black uppercase transition-all disabled:opacity-50"
          >
            {loading === 'DRAFT'
              ? <RotateCcw size={14} className="animate-spin" />
              : <Save size={14} />}
            Save Draft
          </button> */}

          <button
            onClick={() => handleSubmit('POST')}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {loading === 'POST'
              ? <RotateCcw size={14} className="animate-spin" />
              : <SendHorizonal size={14} />}
            Post Voucher
          </button>

          <div className="flex-1" />

          {!isEdit && (
            <button
              onClick={handleReset}
              disabled={loading !== null}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 text-xs font-black uppercase transition-all"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}

          <button
            onClick={onCancel}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-text text-xs font-black uppercase transition-all"
          >
            <AlertCircle size={14} /> Cancel
          </button>
        </div>
      </div>

      {/* Right Side: Real-time Pure Gold Monitor */}
      <aside className="w-80 shrink-0 h-full p-4 flex flex-col bg-surface/20">
        <PureMonitor
          partyId={customerId}
          partyName={customerName}
          balances={balances}
        />
      </aside>

      {showLineItemDialog && (
        <LineItemDialog
          isOpen={showLineItemDialog}
          onClose={() => {
            setShowLineItemDialog(false);
            setEditingItem(null);
            setEditingIndex(null);
          }}
          onSave={editingItem ? handleUpdateItem : handleAddItem}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
