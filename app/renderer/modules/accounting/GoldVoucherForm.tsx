import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  History,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Wallet,
  TrendingUp,
  Save,
  ArrowLeft,
  PackageSearch,
  X,
} from 'lucide-react';
import { PreviousTransactionsModal } from '@/components/PreviousTransactionsModal';

interface GoldVoucherFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GoldVoucherForm({ initialData, onSuccess, onCancel }: GoldVoucherFormProps) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Order selection states
  const [partyType, setPartyType] = useState<'CUSTOMER' | 'SUPPLIER' | null>(
    initialData?.customerOrderVoucherId
      ? 'CUSTOMER'
      : initialData?.supplierOrderVoucherId
        ? 'SUPPLIER'
        : null,
  );
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialData?.customerOrderVoucherId || initialData?.supplierOrderVoucherId || '',
  );
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [prevTransactions, setPrevTransactions] = useState<any[]>([]);
  const [isPrevTxModalOpen, setIsPrevTxModalOpen] = useState(false);
  const [balAmount, setBalAmount] = useState<number | undefined>(undefined);
  const [balStk, setBalStk] = useState<number | undefined>(undefined);

  const getCurrentTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours < 10 ? '0' + hours : hours}:${strMinutes} ${ampm}`;
  };

  // Refs for focus navigation
  const typeRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const goldRef = useRef<HTMLInputElement>(null);
  const cashRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const remarksRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const selectOrderRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (selectedOrderId && prevTransactions.length > 0) {
          setIsPrevTxModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrderId, prevTransactions]);

  const [form, setForm] = useState({
    voucherNo: initialData?.voucher?.voucherNo || '',
    entryDate: initialData?.voucher?.entryDate || new Date().toISOString().split('T')[0],
    partyId: initialData?.partyAccount?.party?.id || '', // Track Karigar ID too
    partyAccountId: initialData?.partyAccountId || '',
    partyName: initialData?.partyAccount?.name || '',
    partyCode: initialData?.partyAccount?.code || '',
    receiptGold: initialData?.receiptGold || ('' as string | number),
    issueGold: initialData?.issueGold || ('' as string | number),
    receiptAmount: initialData?.receiptAmount || ('' as string | number),
    issueAmount: initialData?.issueAmount || ('' as string | number),
    type:
      initialData?.issueGold || initialData?.issueAmount
        ? 'ISSUE'
        : ('RECEIPT' as 'ISSUE' | 'RECEIPT'),
    narration: initialData?.voucher?.narration || '',
    remarks: initialData?.remarks || '',
    remarksTime: initialData?.remarksTime || getCurrentTime(),
  });

  useEffect(() => {
    const timer = setTimeout(() => typeRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => confirmButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    let active = true;
    if (form.partyAccountId) {
      // 1. Fetch balances
      window.electronAPI.getAccountBalances(form.partyAccountId).then((res) => {
        if (active && res.success) {
          setBalances(res.data);
        }
      });

      // 2. Fetch party type and open orders
      window.electronAPI.getPartyByAccountId(form.partyAccountId).then((res) => {
        if (active && res.success && res.data) {
          const type = res.data.type;
          setPartyType(type);
          if (type === 'CUSTOMER' || type === 'SUPPLIER') {
            window.electronAPI
              .getOpenOrdersByAccountId(form.partyAccountId, type)
              .then((orderRes) => {
                if (active && orderRes.success) {
                  setOpenOrders(orderRes.data || []);
                }
              });
          } else {
            setOpenOrders([]);
          }
        } else {
          setPartyType(null);
          setOpenOrders([]);
        }
      });
    } else if (form.partyId) {
      // Fallback to party balances if accountId is not yet linked or for some reason not available
      window.electronAPI.getPartyBalances(form.partyId).then((res) => {
        if (active && res.success) {
          setBalances(res.data);
        }
      });
    } else {
      setBalances(null);
      setPartyType(null);
      setOpenOrders([]);
      setSelectedOrderId('');
      setPrevTransactions([]);
    }
    return () => {
      active = false;
    };
  }, [form.partyAccountId]);

  // Fetch previous transactions when order is selected
  useEffect(() => {
    let mounted = true;
    if (selectedOrderId && form.partyAccountId && partyType !== null) {
      window.electronAPI
        .getOrderTransactions(selectedOrderId, form.partyAccountId, partyType === 'CUSTOMER')
        .then((res) => {
          if (mounted && res.success) {
            setPrevTransactions(res.data || []);
          }
        });
    } else if (!selectedOrderId) {
      setPrevTransactions([]);
    }
    return () => {
      mounted = false;
    };
  }, [selectedOrderId, form.partyAccountId, partyType]);

  useEffect(() => {
    if (prevTransactions.length && selectedOrderId && openOrders.length) {
      const selectedOrder = openOrders.find((o) => o.voucherId === selectedOrderId);
      if (!selectedOrder) return;
      const tranxBalAmt = Number(
        prevTransactions.reduce((sum, tx) => sum + Number(tx.debitAmount), 0) -
          prevTransactions.reduce((sum, tx) => sum + Number(tx.creditAmount), 0),
      );
      const tranxBalStk = Number(
        prevTransactions.reduce((sum, tx) => sum + Number(tx.debitGold), 0) -
          prevTransactions.reduce((sum, tx) => sum + Number(tx.creditGold), 0),
      );

      setBalAmount(
        (selectedOrder.orderType === 'BUY' ? 1 * -1 : 1) * Number(selectedOrder.amount) +
          tranxBalAmt,
      );
      setBalStk(
        Number(
          (selectedOrder.orderType === 'BUY' ? 1 : 1 * -1) * Number(selectedOrder.goldWeight) +
            tranxBalStk,
        ),
      );
    } else {
      setBalAmount(undefined);
      setBalStk(undefined);
    }
  }, [prevTransactions, selectedOrderId, openOrders]);

  useEffect(() => {
    const selected = openOrders.find((o) => o.voucherId === selectedOrderId);
    setSelectedOrder(selected || null);
  }, [selectedOrderId, openOrders]);

  const handleReset = (preserveContext = false) => {
    setForm((prev) => ({
      voucherNo: '',
      entryDate: preserveContext ? prev.entryDate : new Date().toISOString().split('T')[0],
      partyId: '',
      partyAccountId: '',
      partyName: '',
      partyCode: '',
      receiptGold: '',
      issueGold: '',
      receiptAmount: '',
      issueAmount: '',
      type: preserveContext ? prev.type : 'RECEIPT',
      narration: '',
      remarks: '',
      remarksTime: getCurrentTime(),
    }));
    setBalances(null);
    setSelectedOrderId('');
    setPrevTransactions([]);
    // setAlert(null); // Allow auto-dismiss
    setShowConfirm(false);
    setTimeout(() => {
      if (preserveContext) {
        partyRef.current?.focus();
      } else {
        typeRef.current?.focus();
      }
    }, 50);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!form.partyAccountId) {
      setAlert({ type: 'error', msg: 'Please select a Party account.' });
      partyRef.current?.focus();
      return;
    }

    if (!form.remarks.trim()) {
      setAlert({ type: 'error', msg: 'Remarks are mandatory.' });
      remarksRef.current?.focus();
      return;
    }

    if (!form.remarksTime.trim()) {
      setAlert({ type: 'error', msg: 'Time is mandatory.' });
      timeRef.current?.focus();
      return;
    }

    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(form.remarksTime)) {
      setAlert({ type: 'error', msg: 'Please enter a valid time in HH:MM AM/PM format.' });
      timeRef.current?.focus();
      return;
    }

    const gold =
      parseFloat((form.type === 'ISSUE' ? form.issueGold : form.receiptGold).toString()) || 0;
    const cash =
      parseFloat((form.type === 'ISSUE' ? form.issueAmount : form.receiptAmount).toString()) || 0;

    if (gold <= 0 && cash <= 0) {
      setAlert({ type: 'error', msg: `Gold weight must be greater than zero.` });
      cashRef.current?.focus();
      return;
    }

    setShowConfirm(true);
  };

  const confirmAction = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const isIssue = form.type === 'ISSUE';
      const dto = {
        partyAccountId: form.partyAccountId,
        entryDate: form.entryDate,
        receiptGold: isIssue ? 0 : parseFloat(form.receiptGold.toString()) || 0,
        issueGold: isIssue ? parseFloat(form.issueGold.toString()) || 0 : 0,
        receiptAmount: isIssue ? 0 : parseFloat(form.receiptAmount.toString()) || 0,
        issueAmount: isIssue ? parseFloat(form.issueAmount.toString()) || 0 : 0,
        narration: form.narration,
        remarks: form.remarks.trim(),
        remarksTime: form.remarksTime.trim(),
        status: 'POSTED', // Default to posted for this form
        customerOrderVoucherId: partyType === 'CUSTOMER' ? selectedOrderId : undefined,
        supplierOrderVoucherId: partyType === 'SUPPLIER' ? selectedOrderId : undefined,
      };

      const isEdit = !!initialData?.voucherId;
      const res = isEdit
        ? await window.electronAPI.updateGoldVoucher(initialData?.voucherId, dto)
        : await window.electronAPI.createGoldVoucher(dto);

      if (res.success) {
        setAlert({
          type: 'success',
          msg: `Voucher ${isEdit ? 'updated' : 'created'} successfully.`,
        });
        setShowConfirm(false);
        if (isEdit) {
          if (onSuccess) setTimeout(() => onSuccess(), 1000);
        } else {
          handleReset(true); // Preserve context for multi-entry
        }
      } else {
        setAlert({ type: 'error', msg: res.error || 'Failed to process.' });
        setShowConfirm(false);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'System error occurred.' });
      setShowConfirm(false);
    }
    setLoading(false);
  };

  const isIssue = form.type === 'ISSUE';

  // const selectedOrder = openOrders.find((o) => o.voucherId === selectedOrderId);

  return (
    <div
      className="flex gap-4 h-full overflow-hidden animate-in fade-in duration-500 pt-2 p-8"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                onClick={onCancel}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter">
                {initialData ? 'Edit Gold Voucher' : 'New Gold Voucher'}
              </h2>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                {form.voucherNo || 'New Voucher Generation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-start shrink-0">
              <span className="text-[9px] font-black uppercase text-text-muted opacity-60">
                Type
              </span>
              <SegmentedControl
                inputRef={typeRef}
                value={form.type}
                onChange={(type) => setForm((f) => ({ ...f, type }))}
                onEnter={() => dateRef.current?.focus()}
                options={[
                  { label: 'Issue', value: 'ISSUE', color: 'bg-primary' },
                  { label: 'Receipt', value: 'RECEIPT', color: 'bg-emerald-600' },
                ]}
              />
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[9px] font-black uppercase text-text-muted opacity-60">
                Entry Date
              </span>
              <div className="relative group">
                <Calendar
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary opacity-60"
                  size={14}
                />
                <input
                  ref={dateRef}
                  type="date"
                  value={form.entryDate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      partyRef.current?.focus();
                    }
                  }}
                  onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                  className="bg-surface border border-border rounded-lg py-1.5 pl-8 pr-2 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {alert && (
          <div className="px-2 shrink-0">
            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="flex-1 space-y-4 overflow-y-auto px-1 custom-scrollbar pr-2">
            {/* Party Selection */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm">
              <div className="flex gap-2">
                <div className="flex-1">
                  <PartySelect
                    inputRef={partyRef}
                    label="Select Account"
                    value={form.partyAccountId}
                    displayValue={form.partyName ? `${form.partyCode} - ${form.partyName}` : ''}
                    onChange={(id, code, name, type, accountId) => {
                      setForm((prev) => ({
                        ...prev,
                        partyId: id,
                        partyAccountId: accountId || '',
                        partyCode: code,
                        partyName: name,
                      }));
                    }}
                    partyTypes={[]}
                    onNext={() => selectOrderRef.current?.focus()}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(true)}
                  className={`mt-6 h-[42px] px-3 rounded-xl border flex items-center gap-2 transition-all ${
                    selectedOrderId
                      ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-sm'
                      : 'bg-background border-border text-text-muted hover:border-primary/30 hover:text-primary'
                  }`}
                  title="Link to Order"
                  ref={selectOrderRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      selectOrderRef.current?.focus();
                      setShowOrderModal(true);
                    }
                  }}
                >
                  <PackageSearch size={18} />
                  {selectedOrder && (
                    <span className="text-[10px] uppercase tracking-tight">
                      {selectedOrder?.voucher?.voucherNo || 'Linked'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Selected Order Details & Transactions */}
            {selectedOrderId && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                {/* Order Summary */}
                {selectedOrder && (
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-primary">
                        Linked Order Details
                      </div>
                      <div className="flex items-center gap-3">
                        {prevTransactions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsPrevTxModalOpen(true);
                            }}
                            className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                          >
                            <History size={10} /> View History (Ctrl+T)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderId('');
                            goldRef.current?.focus();
                          }}
                          className="text-[9px] font-black uppercase text-danger hover:underline"
                        >
                          Unlink
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      <div className="text-[12px]">
                        <span className="text-text-muted">Order Type:</span>
                        <br />
                        <span className="font-bold">{selectedOrder.orderType}</span>
                      </div>
                      {/* <div className="text-[12px] text-text-muted">
                        Item: <br />
                        <span className="font-bold text-black">
                          {selectedOrder.item?.name || 'N/A'}
                        </span>
                      </div> */}
                      <div className="text-[12px]">
                        <span className="text-text-muted">Order Gold:</span> <br />
                        <span className="font-bold">
                          {Number(selectedOrder.goldWeight).toFixed(3) || '0'}g{' '}
                          {selectedOrder.orderType === 'BUY' ? (
                            <span className="text-green-600 font-bold">Dr</span>
                          ) : (
                            <span className="text-red-600 font-bold">Cr</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[12px]">
                        <span className="text-text-muted">Bal. Gold:</span> <br />
                        <span className="font-bold">
                          {balStk !== undefined ? Math.abs(balStk) + 'g' : '-'}{' '}
                          {Number(balStk ?? 0) != 0 ? (
                            Number(balStk) > 0 ? (
                              <span className="text-green-600 font-bold">Dr</span>
                            ) : (
                              <span className="text-red-600 font-bold">Cr</span>
                            )
                          ) : (
                            <></>
                          )}
                        </span>
                      </div>
                      <div className="text-[12px]">
                        <span className="text-text-muted">Order Amount:</span> <br />
                        <span className="font-bold">
                          ₹{Number(selectedOrder.amount).toLocaleString('en-IN') || '0'}{' '}
                          {selectedOrder.orderType === 'BUY' ? (
                            <span className="text-red-600 font-bold">Cr</span>
                          ) : (
                            <span className="text-green-600 font-bold">Dr</span>
                          )}
                        </span>
                      </div>{' '}
                      <div className="text-[12px]">
                        <span className="text-text-muted">Bal. Amount:</span> <br />
                        <span className="font-bold">
                          {balAmount !== undefined
                            ? '₹' + Math.abs(Number(balAmount)).toLocaleString('en-IN')
                            : '-'}{' '}
                          {Number(balAmount ?? 0) != 0 ? (
                            Number(balAmount) > 0 ? (
                              <span className="text-green-600 font-bold">Dr</span>
                            ) : (
                              <span className="text-red-600 font-bold">Cr</span>
                            )
                          ) : (
                            <></>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Previous Transactions Modal */}
                <PreviousTransactionsModal
                  isOpen={isPrevTxModalOpen}
                  onClose={() => {
                    setIsPrevTxModalOpen(false);
                    goldRef.current?.focus();
                  }}
                  transactions={prevTransactions}
                  orderTitle={
                    selectedOrder
                      ? `${selectedOrder.orderType} Order - ${selectedOrder.orderNo || ''}`
                      : ''
                  }
                />
              </div>
            )}

            {/* Inputs */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm relative overflow-visible">
              <div className="grid grid-cols-2 gap-6">
                <FormField label={`Pure Gold (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input
                      ref={goldRef}
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={isIssue ? form.issueGold : form.receiptGold}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          narrationRef.current?.focus();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) =>
                          isIssue ? { ...f, issueGold: val } : { ...f, receiptGold: val },
                        );
                      }}
                      className={`font-black border-2 focus:ring-2 outline-none ${
                        isIssue
                          ? 'focus:border-primary focus:ring-primary/20'
                          : 'focus:border-emerald-600 focus:ring-emerald-600/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 font-black italic">
                      grams
                    </div>
                  </div>
                </FormField>

                {/* <FormField label={`Amount (${isIssue ? 'Issue' : 'Receive'})`} required>
                  <div className="relative">
                    <Input
                      ref={cashRef}
                      type="number"
                      step="1"
                      placeholder="0"
                      value={isIssue ? form.issueAmount : form.receiptAmount}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          narrationRef.current?.focus();
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) =>
                          isIssue ? { ...f, issueAmount: val } : { ...f, receiptAmount: val },
                        );
                      }}
                      className={`text-lg h-14 font-black border-2 focus:ring-2 outline-none ${
                        isIssue
                          ? 'focus:border-primary focus:ring-primary/20'
                          : 'focus:border-emerald-600 focus:ring-emerald-600/20'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/20 font-black italic">
                      INR
                    </div>
                  </div>
                </FormField> */}
                <FormField label="Narration (Optional)">
                  <Input
                    ref={narrationRef}
                    placeholder="Enter narration..."
                    value={form.narration}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), remarksRef.current?.focus())
                    }
                    onChange={(e) => setForm({ ...form, narration: e.target.value })}
                    className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                  />
                </FormField>
              </div>
            </div>

            {/* Narration, Remarks & Time */}
            <div className="bg-surface p-6 rounded-3xl border border-border/50 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Remarks" required>
                  <Input
                    ref={remarksRef}
                    placeholder="Enter remarks..."
                    value={form.remarks}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), timeRef.current?.focus())
                    }
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                  />
                </FormField>

                <FormField label="Time (HH:MM AM/PM)" required>
                  <Input
                    ref={timeRef}
                    placeholder="12:00 PM"
                    value={form.remarksTime}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), submitButtonRef.current?.focus())
                    }
                    onChange={(e) => setForm({ ...form, remarksTime: e.target.value })}
                    className="font-bold border-2 focus:border-primary focus:ring-primary/10"
                  />
                </FormField>
              </div>
            </div>

            {/* Visual Summary */}
            {/* <div className="grid grid-cols-2 gap-4">
              <div
                className={`${isIssue ? 'bg-primary/5 border-primary/20' : 'bg-emerald-500/5 border-emerald-500/20'} p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-colors`}
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isIssue ? 'text-primary' : 'text-emerald-600'}`}
                >
                  Gold to {isIssue ? 'Issue' : 'Receive'}
                </span>
                <span
                  className={`text-3xl font-black ${isIssue ? 'text-primary' : 'text-emerald-600'}`}
                >
                  {(
                    parseFloat((isIssue ? form.issueGold : form.receiptGold).toString()) || 0
                  ).toFixed(3)}
                  g
                </span>
              </div>
              <div className="bg-emerald-500/5 p-6 rounded-3xl border-2 border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                  Amount to {isIssue ? 'Issue' : 'Receive'}
                </span>
                <span className="text-3xl font-black text-emerald-600">
                  ₹{' '}
                  {(
                    parseFloat((isIssue ? form.issueAmount : form.receiptAmount).toString()) || 0
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div> */}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 px-1 shrink-0">
            <Button
              ref={submitButtonRef}
              type="submit"
              disabled={loading}
              className={`flex-[3] h-14 text-lg font-black rounded-3xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-4 outline-none ${
                isIssue
                  ? 'bg-primary hover:bg-primary-hover shadow-primary/10 focus:ring-primary/40'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10 focus:ring-emerald-600/40'
              }`}
            >
              {loading ? (
                <RotateCcw className="animate-spin mr-3" size={24} />
              ) : initialData ? (
                <Save size={24} className="mr-3" />
              ) : (
                <CheckCircle2 size={24} className="mr-3" />
              )}
              {loading
                ? 'Processing...'
                : initialData
                  ? 'Update Voucher (Enter)'
                  : `${isIssue ? 'Issue' : 'Receive'} Gold & Equity (Enter)`}
            </Button>
            {onCancel ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase"
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleReset()}
                className="flex-1 h-14 bg-surface border border-border rounded-3xl text-text-muted hover:text-danger hover:bg-danger/5 transition-all text-lg font-black uppercase"
              >
                <RotateCcw size={18} className="mr-2" /> Reset
              </Button>
            )}
          </div>
        </form>
      </div>
      <aside className="w-72 shrink-0 flex flex-col h-full overflow-hidden pt-2">
        <PureMonitor
          partyId={form.partyId || form.partyAccountId}
          partyName={form.partyName}
          balances={balances}
        />
      </aside>

      {/* Order Selection Modal */}
      {showOrderModal && (
        <div
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowOrderModal(false);
              selectOrderRef.current?.focus();
            }
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={() => setShowOrderModal(false)}
          />
          <div className="relative w-full max-w-lg bg-surface border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-surface/50 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-text uppercase tracking-tight">
                  Select Open Order
                </h3>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                  Linking transactions to {partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'}{' '}
                  Orders
                </p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setShowOrderModal(false);
                  selectOrderRef.current?.focus();
                }}
                className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-danger transition-all"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {openOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-muted/30">
                    <PackageSearch size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-muted">No Open Orders Found</p>
                    <p className="text-[10px] text-text-muted/60 uppercase tracking-widest mt-1">
                      There are no pending orders for this account.
                    </p>
                  </div>
                </div>
              ) : (
                openOrders.map((order) => (
                  <button
                    key={order.voucherId}
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(order.voucherId);
                      setShowOrderModal(false);
                      goldRef.current?.focus();
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      selectedOrderId === order.voucherId
                        ? 'bg-primary/10 border-primary/40 ring-2 ring-primary/10'
                        : 'bg-background border-border hover:border-primary/30 hover:bg-surface/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text uppercase">
                          {order.voucher?.voucherNo}
                        </span>
                        <span className="text-[9px] font-bold text-text-muted/60">
                          {order.voucher?.entryDate}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-tight">
                        Item: <span className="text-text">{order.item?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-xs font-black text-emerald-500">
                        ₹{order.amount?.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-black text-text-muted/60 uppercase">
                        {order.goldWeight}g
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-4 border-t border-border bg-surface/30">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId('');
                  setShowOrderModal(false);
                }}
                className="w-full py-2.5 rounded-xl border border-border text-xs font-black uppercase text-text-muted hover:bg-background transition-all"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-surface border border-border rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-300">
            <div
              className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isIssue ? 'bg-primary/10 text-primary' : 'bg-emerald-600/10 text-emerald-600'}`}
            >
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-black tracking-tight mb-2">
              Confirm {initialData ? 'Update' : isIssue ? 'Issuance' : 'Receipt'}
            </h3>
            <p className="text-text-muted font-bold mb-8 leading-relaxed">
              Are you sure you want to {isIssue ? 'issue' : 'receive'}{' '}
              <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>
                {(
                  parseFloat((isIssue ? form.issueGold : form.receiptGold).toString()) || 0
                ).toFixed(3)}
                g Gold
              </span>{' '}
              and{' '}
              <span className="text-emerald-600 font-black">
                ₹{' '}
                {(
                  parseFloat((isIssue ? form.issueAmount : form.receiptAmount).toString()) || 0
                ).toLocaleString('en-IN')}{' '}
                Cash
              </span>{' '}
              {isIssue ? 'to' : 'from'}{' '}
              <span className={`${isIssue ? 'text-primary' : 'text-emerald-600'} font-black`}>
                {form.partyName}
              </span>
              ?
            </p>
            <div
              className="flex gap-4"
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (document.activeElement === confirmButtonRef.current) {
                    cancelButtonRef.current?.focus();
                  } else {
                    confirmButtonRef.current?.focus();
                  }
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (document.activeElement === cancelButtonRef.current) {
                    confirmButtonRef.current?.focus();
                  } else {
                    cancelButtonRef.current?.focus();
                  }
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  if (document.activeElement === confirmButtonRef.current) {
                    cancelButtonRef.current?.focus();
                  } else {
                    confirmButtonRef.current?.focus();
                  }
                } else if (e.key === 'Escape') {
                  setShowConfirm(false);
                  setTimeout(() => submitButtonRef.current?.focus(), 100);
                }
              }}
            >
              <Button
                ref={confirmButtonRef}
                className={`flex-1 h-14 rounded-2xl font-black text-lg ${isIssue ? 'bg-primary' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={confirmAction}
              >
                Confirm
              </Button>
              <Button
                ref={cancelButtonRef}
                variant="ghost"
                className="flex-1 h-14 bg-background border border-border rounded-2xl font-black text-lg text-text-muted"
                onClick={() => {
                  setShowConfirm(false);
                  setTimeout(() => submitButtonRef.current?.focus(), 100);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
