import React, { useState, useRef, useEffect } from 'react';
import { AccountSelect } from '@/components/AccountSelect';
import { Alert } from '@/components/StatusChip';
import { PureMonitor } from '@/components/PureMonitor';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  Wallet,
  Calendar,
  FileText,
  UserCheck,
  RotateCcw,
  SendHorizonal,
  ArrowLeft,
  AlertCircle,
  IndianRupee,
  Weight,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  PackageSearch,
  History,
  X,
} from 'lucide-react';
import { PreviousTransactionsModal } from '@/components/PreviousTransactionsModal';

interface CashVoucherFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  editVoucherId?: string;
  initialData?: {
    voucherId: string;
    type: 'Receipt' | 'Payment';
    accountId: string;
    accountName: string;
    entryDate: string;
    narration: string;
    partyAccountId: string;
    partyAccountName: string;
    receiptAmount?: number;
    paymentAmount?: number;
    goldRate?: number;
    goldWeight?: number;
    remarks?: string;
    remarksTime?: string;
    customerOrderVoucherId?: string;
    supplierOrderVoucherId?: string;
  };
}

export function CashVoucherForm({
  onCancel,
  onSuccess,
  editVoucherId,
  initialData,
}: CashVoucherFormProps) {
  const isEdit = !!editVoucherId;
  const today = new Date().toISOString().split('T')[0];

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

  // Persistence for Account
  const savedAccId = localStorage.getItem('lastCashAccountId') || '';
  const savedAccName = localStorage.getItem('lastCashAccountName') || '';

  const [accountId, setAccountId] = useState(initialData?.accountId ?? savedAccId);
  const [accountName, setAccountName] = useState(initialData?.accountName ?? savedAccName);
  const [type, setType] = useState<'Receipt' | 'Payment'>(initialData?.type ?? 'Receipt');
  const [entryDate, setEntryDate] = useState(initialData?.entryDate ?? today);
  const [narration, setNarration] = useState(initialData?.narration ?? '');
  const [remarks, setRemarks] = useState(initialData?.remarks ?? '');
  const [remarksTime, setRemarksTime] = useState(initialData?.remarksTime ?? getCurrentTime());
  const [partyAccountId, setPartyAccountId] = useState(initialData?.partyAccountId ?? '');
  const [partyAccountName, setPartyAccountName] = useState(initialData?.partyAccountName ?? '');
  const [cashAmount, setCashAmount] = useState<string>(
    (type === 'Receipt' ? initialData?.receiptAmount : initialData?.paymentAmount)?.toString() ??
      '',
  );
  const [goldRate, setGoldRate] = useState<string>(initialData?.goldRate?.toString() ?? '');
  const [goldWeight, setGoldWeight] = useState<string>(initialData?.goldWeight?.toString() ?? '');

  const [loading, setLoading] = useState<'POST' | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [balances, setBalances] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState<'POST' | null>(null);

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

  const accRef = useRef<any>(null);
  const typeRef = useRef<any>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const remarksRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const postBtnRef = useRef<HTMLButtonElement>(null);
  const confirmYesRef = useRef<HTMLButtonElement>(null);
  const confirmNoRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    setTimeout(() => {
      if (!accountId) accRef.current?.focus();
      else typeRef.current?.focus();
    }, 200);
  }, []);

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => confirmYesRef.current?.focus(), 100);
    }
  }, [showConfirm]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Persistence Logic
  useEffect(() => {
    if (accountId) localStorage.setItem('lastCashAccountId', accountId);
    if (accountName) localStorage.setItem('lastCashAccountName', accountName);
  }, [accountId, accountName]);

  // Automatic Gold Weight Calculation
  useEffect(() => {
    const amt = parseFloat(cashAmount) || 0;
    const rate = parseFloat(goldRate) || 0;
    if (amt > 0 && rate > 0) {
      setGoldWeight((amt / rate).toFixed(3));
    } else if (!isEdit) {
      setGoldWeight('');
    }
  }, [cashAmount, goldRate]);

  // Fetch party details and open orders
  useEffect(() => {
    let mounted = true;
    if (partyAccountId) {
      // 1. Fetch balances
      window.electronAPI.getAccountBalances(partyAccountId).then((res) => {
        if (mounted && res.success) setBalances(res.data);
      });

      // 2. Fetch party type and open orders
      window.electronAPI.getPartyByAccountId(partyAccountId).then((res) => {
        if (mounted && res.success && res.data) {
          const type = res.data.type;
          setPartyType(type);
          if (type === 'CUSTOMER' || type === 'SUPPLIER') {
            window.electronAPI.getOpenOrdersByAccountId(partyAccountId, type).then((orderRes) => {
              if (mounted && orderRes.success) {
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
    } else {
      setBalances(null);
      setPartyType(null);
      setOpenOrders([]);
      setSelectedOrderId('');
      setPrevTransactions([]);
    }
    return () => {
      mounted = false;
    };
  }, [partyAccountId]);

  // Fetch previous transactions when order is selected
  useEffect(() => {
    let mounted = true;
    if (selectedOrderId && partyAccountId && partyType !== null) {
      window.electronAPI
        .getOrderTransactions(selectedOrderId, partyAccountId, partyType === 'CUSTOMER')
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
  }, [selectedOrderId, partyAccountId, partyType]);

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

  const handleResetGoldFields = () => {
    // setCashAmount('');
    setGoldRate('');
    setGoldWeight('');
    // Focus back to amount field for quick re-entry
    amountRef.current?.focus();
  };

  const handleReset = (preserveContext = false) => {
    // Account persists, everything else clears
    if (!preserveContext) {
      setType('Receipt');
      setEntryDate(today);
    }
    setNarration('');
    setRemarks('');
    setRemarksTime(getCurrentTime());
    setPartyAccountId('');
    setPartyAccountName('');
    setCashAmount('');
    setGoldRate('');
    setGoldWeight('');
    setSelectedOrderId('');
    setPrevTransactions([]);
    // setAlert(null); // Allow auto-dismiss
    setBalances(null);
    setTimeout(() => {
      if (preserveContext) {
        partyRef.current?.focus(); // Focus on party if context preserved
      } else {
        typeRef.current?.focus();
      }
    }, 50);
  };

  const handleSubmit = async (action: 'POST') => {
    setShowConfirm(null);
    setAlert(null);
    if (!accountId) {
      setAlert({ type: 'error', msg: 'Please select a Cash/Bank account.' });
      accRef.current?.focus();
      return;
    }
    if (!entryDate) {
      setAlert({ type: 'error', msg: 'Entry date is required.' });
      dateRef.current?.focus();
      return;
    }
    if (!partyAccountId) {
      setAlert({ type: 'error', msg: 'Please select an account.' });
      partyRef.current?.focus();
      return;
    }
    if (!remarks.trim()) {
      setAlert({ type: 'error', msg: 'Remarks are mandatory.' });
      remarksRef.current?.focus();
      return;
    }
    if (!remarksTime.trim()) {
      setAlert({ type: 'error', msg: 'Time is mandatory.' });
      timeRef.current?.focus();
      return;
    }

    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(remarksTime)) {
      setAlert({ type: 'error', msg: 'Please enter a valid time in HH:MM AM/PM format.' });
      timeRef.current?.focus();
      return;
    }

    const amountNum = parseFloat(cashAmount) || 0;
    const goldWeightNum = parseFloat(goldWeight) || 0;
    const goldRateNum = parseFloat(goldRate) || 0;

    if (amountNum <= 0 && goldWeightNum <= 0) {
      setAlert({ type: 'error', msg: 'Please enter Amount.' });
      if (amountNum <= 0) {
        amountRef.current?.focus();
      }
      return;
    }

    setLoading(action);
    try {
      const dto = {
        type,
        partyAccountId,
        accountId,
        entryDate,
        narration: narration.trim() || undefined,
        remarks: remarks.trim(),
        remarksTime: remarksTime.trim(),
        receiptAmount: type === 'Receipt' ? amountNum : 0,
        paymentAmount: type === 'Payment' ? amountNum : 0,
        goldRate: goldRateNum,
        goldWeight: goldWeightNum,
        customerOrderVoucherId: partyType === 'CUSTOMER' ? selectedOrderId : undefined,
        supplierOrderVoucherId: partyType === 'SUPPLIER' ? selectedOrderId : undefined,
        action,
      };

      const res = isEdit
        ? await window.electronAPI.updateCashVoucher(editVoucherId!, dto)
        : await window.electronAPI.createCashVoucher(dto);

      if (res.success) {
        const voucherNo = (res.data as any)?.voucherNo ?? '';
        const msg =
          action === 'POST'
            ? `Cash Voucher posted successfully! Voucher No: ${voucherNo}`
            : `Draft saved successfully! Voucher No: ${voucherNo}`;
        setAlert({ type: 'success', msg });
        if (isEdit) {
          setTimeout(() => onSuccess(), 1500);
        } else {
          handleReset(true); // Preserve context for rapid entry
        }
      } else {
        setAlert({ type: 'error', msg: (res as any).error ?? 'Operation failed.' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'A system error occurred. Please try again.' });
    } finally {
      setLoading(null);
    }
  };

  // const selectedOrder = openOrders.find((o) => o.voucherId === selectedOrderId);

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
              <Wallet size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-text leading-none">
                {isEdit ? 'Edit Cash Voucher (Draft)' : 'Create Cash Voucher'}
              </h2>
              <p className="text-[9px] font-black uppercase text-text-muted tracking-widest leading-none mt-0.5">
                {isEdit ? 'Update draft and optionally post' : 'Record cash or metal transactions'}
              </p>
            </div>
          </div>
        </div>

        {/* Alert */}
        {alert && (
          <div className="shrink-0 px-6 pt-3 animate-in slide-in-from-top-2 duration-200">
            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">
          {/* Row 1: Account & Type */}
          <div className="grid grid-cols-3 gap-6 items-end">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                Cash/Bank Account <span className="text-danger">*</span>
              </label>
              <AccountSelect
                inputRef={accRef}
                label=""
                value={accountId}
                displayValue={accountName}
                allowedTypes={['ASSET']}
                allowedSubtypes={['CASH', 'BANK']}
                onChange={(id, name) => {
                  setAccountId(id);
                  setAccountName(name);
                }}
                onNext={() => dateRef.current?.focus()}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <Calendar size={10} /> Entry Date <span className="text-danger">*</span>
              </label>
              <input
                ref={dateRef}
                type="date"
                value={entryDate}
                max={today}
                onChange={(e) => setEntryDate(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), typeRef.current?.focus())
                }
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2 flex items-center gap-1">
                Voucher Type
              </label>
              <SegmentedControl
                inputRef={typeRef}
                options={[
                  { label: 'Receipt', value: 'Receipt' },
                  { label: 'Payment', value: 'Payment' },
                ]}
                value={type}
                onChange={(val: any) => setType(val)}
                onEnter={() => partyRef.current?.focus()}
              />
            </div>
          </div>

          <div className="h-px bg-border/40 my-2" />

          {/* Row 2 & 3: Date/Party and Narration */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Date + Party */}
            <div className="space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                  <UserCheck size={10} /> To Account <span className="text-danger">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <AccountSelect
                      inputRef={partyRef}
                      label=""
                      value={partyAccountId}
                      displayValue={partyAccountName}
                      onChange={(id, name) => {
                        setPartyAccountId(id);
                        setPartyAccountName(name);
                      }}
                      onNext={() => selectOrderRef.current?.focus()}
                      allowedTypes={['ASSET', 'EXPENSE', 'LIABILITY', 'CAPITAL', 'REVENUE']}
                      allowedSubtypes={['PAYABLE', 'RECEIVABLE', 'LABOUR']}
                    />
                  </div>

                  <button
                    ref={selectOrderRef}
                    type="button"
                    onClick={() => setShowOrderModal(true)}
                    className={`h-[42px] px-3 rounded-xl border flex items-center gap-2 transition-all ${
                      selectedOrderId
                        ? 'bg-primary/10 border-primary/30 text-primary font-bold shadow-sm'
                        : 'bg-background border-border text-text-muted hover:border-primary/30 hover:text-primary'
                    }`}
                    title="Link to Order"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        selectOrderRef.current?.focus();
                        setShowOrderModal(true);
                      }
                      if (e.key === 'Esc') {
                        e.preventDefault();
                        setShowOrderModal(false);
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
            </div>

            {/* Right Column: Narration */}
            <div className="flex flex-col">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <FileText size={10} /> Narration
              </label>
              <input
                ref={narrationRef}
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), amountRef.current?.focus())
                }
                placeholder="Optional note..."
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/40"
              />
            </div>
          </div>
          {/* Selected Order Preview */}
          {selectedOrder && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl animate-in slide-in-from-top-2">
              <div className="flex justify-between items-start mb-2">
                <div className="text-[9px] font-black uppercase tracking-widest text-primary">
                  Linked Order Details
                </div>
                <div className="flex items-center gap-3">
                  {prevTransactions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsPrevTxModalOpen(true)}
                      className="text-[9px] font-black uppercase text-primary hover:underline flex items-center gap-1"
                    >
                      <History size={10} /> View History (Ctrl+T)
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedOrderId('')}
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
                  <span className="text-text-muted">Order Gold:</span>
                  <br />
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
                  <span className="text-text-muted">Bal. Gold:</span>
                  <br />
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
                  <span className="text-text-muted">Order Amount:</span>
                  <br />
                  <span className="font-bold">
                    ₹{Number(selectedOrder.amount).toLocaleString('en-IN') || '0'}{' '}
                    {selectedOrder.orderType === 'BUY' ? (
                      <span className="text-red-600 font-bold">Cr</span>
                    ) : (
                      <span className="text-green-600 font-bold">Dr</span>
                    )}
                  </span>
                </div>
                <div className="text-[12px]">
                  <span className="text-text-muted">Bal Amount:</span>
                  <br />
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
              amountRef.current?.focus();
            }}
            transactions={prevTransactions}
            orderTitle={
              selectedOrder
                ? `${selectedOrder.orderType} Order - ${selectedOrder.orderNo || ''}`
                : ''
            }
          />

          {/* Row 4: Amounts Section */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 bg-surface/30 p-6 rounded-2xl border border-border/40 items-end">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <IndianRupee size={10} /> {type} Amount
              </label>
              <div className="relative">
                <input
                  ref={amountRef}
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), rateRef.current?.focus())
                  }
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-emerald-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40">
                  ₹
                </span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <TrendingUp size={10} /> Gold Rate in grams
              </label>
              <div className="relative">
                <input
                  ref={rateRef}
                  type="number"
                  step="0.01"
                  value={goldRate}
                  onChange={(e) => setGoldRate(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), remarksRef.current?.focus())
                  }
                  placeholder="0.00"
                  className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-3 text-base font-black text-text/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/40">
                  ₹
                </span>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                <Weight size={10} /> Gold Weight (Auto)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={goldWeight}
                  readOnly
                  placeholder="0.000"
                  className="w-full bg-background/50 border border-border rounded-xl pl-3 pr-8 py-3 text-base font-black text-emerald-500/50 cursor-not-allowed outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/40 font-bold text-[10px] uppercase">
                  g
                </span>
              </div>
            </div>

            <div className="pb-0.5">
              <button
                type="button"
                onClick={handleResetGoldFields}
                className="h-[50px] w-12 rounded-xl border border-border bg-background text-danger/60 hover:text-danger hover:bg-danger/5 hover:border-danger/20 transition-all flex items-center justify-center shadow-sm group"
                title="Reset Amount, Rate & Weight"
              >
                <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
              </button>
            </div>
          </div>

          {/* Row 5: Remarks & Time */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                Remarks <span className="text-danger">*</span>
              </label>
              <input
                ref={remarksRef}
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), timeRef.current?.focus())
                }
                placeholder="Mandatory remarks"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5 flex items-center gap-1">
                Time <span className="text-danger">*</span>
              </label>
              <input
                ref={timeRef}
                type="text"
                value={remarksTime}
                onChange={(e) => setRemarksTime(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), postBtnRef.current?.focus())
                }
                placeholder="HH:MM AM/PM"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm font-bold text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-surface/50 flex items-center gap-3">
          <button
            ref={postBtnRef}
            onClick={() => setShowConfirm('POST')}
            disabled={loading !== null}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50"
          >
            {loading === 'POST' ? (
              <RotateCcw size={14} className="animate-spin" />
            ) : (
              <SendHorizonal size={14} />
            )}
            Post Voucher
          </button>

          <div className="flex-1" />

          <button
            onClick={() => handleReset()}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/5 text-xs font-black uppercase transition-all"
          >
            <RotateCcw size={14} /> Reset
          </button>

          <button
            onClick={onCancel}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-text-muted hover:text-text text-xs font-black uppercase transition-all"
          >
            <AlertCircle size={14} /> Cancel
          </button>
        </div>
      </div>

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
                    onClick={() => {
                      setSelectedOrderId(order.voucherId);
                      setShowOrderModal(false);
                      narrationRef.current?.focus();
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={() => {
              setShowConfirm(null);
              setTimeout(() => postBtnRef.current?.focus(), 50);
            }}
          />
          <div className="relative w-full max-w-sm bg-surface border border-border shadow-2xl rounded-3xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-text uppercase tracking-tight">
                  Confirm Submission
                </h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed font-medium">
                  Are you sure you want to post this voucher to the ledger?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-2">
                <button
                  ref={confirmYesRef}
                  onClick={() => handleSubmit(showConfirm)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      confirmNoRef.current?.focus();
                    }
                    if (e.key === 'Tab' && e.shiftKey) {
                      e.preventDefault();
                      confirmNoRef.current?.focus();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white font-black uppercase text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <CheckCircle2 size={16} /> Yes, Proceed
                </button>
                <button
                  ref={confirmNoRef}
                  onClick={() => {
                    setShowConfirm(null);
                    setTimeout(() => postBtnRef.current?.focus(), 50);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      confirmYesRef.current?.focus();
                    }
                    if (e.key === 'Tab' && !e.shiftKey) {
                      e.preventDefault();
                      confirmYesRef.current?.focus();
                    }
                  }}
                  className="px-4 py-3 rounded-2xl border border-border text-text-muted font-black uppercase text-xs hover:bg-background transition-all outline-none focus:ring-2 focus:ring-primary/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Side: Real-time Pure Gold Monitor */}
      <aside className="w-80 shrink-0 h-full p-4 flex flex-col bg-surface/20">
        <PureMonitor partyId={partyAccountId} partyName={partyAccountName} balances={balances} />
      </aside>
    </div>
  );
}
