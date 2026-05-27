import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';
import { TagSearchModal } from '@/components/TagSearchModal';
import { PureMonitor } from '@/components/PureMonitor';
import { 
  Calendar, 
  ShoppingCart, 
  Search, 
  RotateCcw, 
  CheckCircle2, 
  Calculator,
  Percent,
  ArrowRightCircle
} from 'lucide-react';

export function SellStock({ active }: { active?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [balances, setBalances] = useState<any>(null);

  const dateRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  const partyRef = useRef<any>(null);
  const goldPercentRef = useRef<HTMLInputElement>(null);
  const inrPercentRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialForm = {
    entryDate: new Date().toISOString().split('T')[0],
    productId: '',
    tagNo: '',
    customerId: '',
    customerCode: '',
    customerName: '',
    grossWeight: 0,
    kundanWeight: 0,
    stoneWeight: 0,
    mottiWeight: 0,
    netWeight: 0,
    tagAmount: 0,
    goldPercent: 100,
    inrPercent: 100,
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (active) {
      setTimeout(() => dateRef.current?.focus(), 350);
    }
  }, [active]);

  useEffect(() => {
    let mounted = true;
    if (form.customerId) {
        window.electronAPI.getPartyBalances(form.customerId).then(res => {
            if (mounted && res.success) {
                setBalances(res.data);
            }
        });
    } else {
        setBalances(null);
    }
    return () => { mounted = false; };
  }, [form.customerId]);

  const handleReset = () => {
    setForm(initialForm);
    setAlert(null);
    setBalances(null);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

  const goldToCharge = +((form.netWeight * form.goldPercent) / 100).toFixed(3);
  const inrToCharge = +((form.tagAmount * form.inrPercent) / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId) { setAlert({ type: 'error', msg: 'Please select a tag.' }); return; }
    if (!form.customerId) { setAlert({ type: 'error', msg: 'Please select a customer.' }); return; }

    setLoading(true);
    setAlert(null);
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const result = await window.electronAPI.sellStock({
        entryDate: form.entryDate,
        productId: form.productId,
        customerId: form.customerId,
        goldToCharge,
        inrToCharge,
        goldPercent: form.goldPercent,
        inrPercent: form.inrPercent,
      });

      if (result.success) {
        setAlert({ type: 'success', msg: `Stock sold successfully! Voucher: ${(result.data as any).voucherNo}` });
        setLoading(false);
        setTimeout(() => handleReset(), 2500);
      } else {
        setAlert({ type: 'error', msg: result.error || 'Sale failed' });
        setLoading(false);
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'System error.' });
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-full overflow-hidden animate-in fade-in duration-500 pt-2">
      <div ref={containerRef} className="flex-1 space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar relative">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tighter uppercase text-text leading-none">Sell Stock</h2>
              <p className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mt-1">Customer Billing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[8px] font-black uppercase text-text-muted opacity-60">Entry Date</span>
              <div className="relative group">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 text-primary opacity-60" size={12} />
                <input 
                  ref={dateRef}
                  type="date"
                  value={form.entryDate}
                  max={new Date().toISOString().split('T')[0]}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tagRef.current?.focus())}
                  onChange={e => setForm({...form, entryDate: e.target.value})}
                  className="bg-surface border border-border rounded-lg py-1 pl-7 pr-1 w-[140px] font-mono text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-sm text-text"
                />
              </div>
            </div>
          </div>
        </div>

        {alert && (
          <div className="sticky top-0 z-50 px-2 py-1 animate-in slide-in-from-top-4 duration-300">
            <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Section 1: Stock & Customer */}
            <div className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm space-y-3">
              <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                 <Search size={12} /> Selection
              </h3>
              
              <FormField label="Select Tag" required labelSize="text-[9px]">
                <div className="relative">
                  <Input 
                    ref={tagRef}
                    value={form.tagNo}
                    readOnly
                    onClick={() => setShowTagModal(true)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setShowTagModal(true))}
                    placeholder="Tap to search tags..."
                    className="font-mono font-black text-primary bg-primary/5 border-primary/20 h-9 text-sm cursor-pointer outline-none"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/30" size={14} />
                </div>
              </FormField>

              <PartySelect 
                inputRef={partyRef}
                label="Select Customer"
                value={form.customerId}
                displayValue={form.customerName}
                partyTypes={['CUSTOMER']}
                onChange={(id, code, name) => setForm({...form, customerId: id, customerCode: code, customerName: `${code} - ${name}`})}
                onNext={() => goldPercentRef.current?.focus()}
                required
                labelSize="text-[9px]"
                inputHeight="h-9"
                fontSize="text-sm"
              />
            </div>

            {/* Section 2: Prepopulated Info */}
            <div className="bg-surface p-4 rounded-2xl border border-border/50 shadow-sm space-y-3">
              <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                 <Calculator size={12} /> SPECIFICATION
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-2 bg-background/50 rounded-xl border border-border/50">
                    <span className="text-[8px] font-black text-text-muted uppercase block">Gross WT</span>
                    <span className="text-sm font-black text-text">{form.grossWeight.toFixed(3)}g</span>
                 </div>
                 <div className="p-2 bg-background/50 rounded-xl border border-border/50">
                    <span className="text-[8px] font-black text-text-muted uppercase block">Net WT</span>
                    <span className="text-sm font-black text-primary">{form.netWeight.toFixed(3)}g</span>
                 </div>
                 <div className="col-span-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase block leading-none">Tag Amount</span>
                      <span className="text-lg font-black text-emerald-600 leading-tight">₹ {form.tagAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-right text-[10px] font-bold text-text-muted uppercase leading-tight">
                      K: {form.kundanWeight}g | S: {form.stoneWeight}g | M: {form.mottiWeight}g
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Section 3: Billing Logic */}
          <div className="bg-surface p-5 rounded-3xl border border-primary/20 shadow-lg shadow-primary/5">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2 leading-none">
                 <Percent size={14} /> Billing Logic
               </h3>
               <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-[7px] font-extrabold text-primary uppercase">
                  ADJUST PERCENTAGES
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <FormField label="Gold Charge %" labelSize="text-[9px]">
                  <div className="flex gap-3 items-center">
                    <Input 
                      ref={goldPercentRef}
                      type="number" 
                      value={form.goldPercent}
                      onChange={e => setForm({...form, goldPercent: parseFloat(e.target.value) || 0})}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), inrPercentRef.current?.focus())}
                      className="w-20 h-10 text-lg font-black text-center text-text"
                    />
                    <div className="flex-1 space-y-1">
                       <input 
                         type="range" min="0" max="150" 
                         value={form.goldPercent} 
                         onChange={e => setForm({...form, goldPercent: parseInt(e.target.value)})}
                         className="w-full accent-primary h-1 bg-border rounded-lg cursor-pointer"
                       />
                       <div className="flex justify-between text-[7px] font-black text-text-muted uppercase">
                          <span>0%</span>
                          <span>100%</span>
                          <span>150%</span>
                       </div>
                    </div>
                  </div>
                </FormField>

                <FormField label="INR Charge %" labelSize="text-[9px]">
                  <div className="flex gap-3 items-center">
                    <Input 
                      ref={inrPercentRef}
                      type="number" 
                      value={form.inrPercent}
                      onChange={e => setForm({...form, inrPercent: parseFloat(e.target.value) || 0})}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), saveRef.current?.focus())}
                      className="w-20 h-10 text-lg font-black text-center text-text"
                    />
                    <div className="flex-1 space-y-1">
                       <input 
                         type="range" min="0" max="150" 
                         value={form.inrPercent} 
                         onChange={e => setForm({...form, inrPercent: parseInt(e.target.value)})}
                         className="w-full accent-emerald-500 h-1 bg-border rounded-lg cursor-pointer"
                       />
                       <div className="flex justify-between text-[7px] font-black text-text-muted uppercase">
                          <span>0%</span>
                          <span>100%</span>
                          <span>150%</span>
                       </div>
                    </div>
                  </div>
                </FormField>
              </div>

              <div className="flex flex-col justify-center gap-3 bg-background/40 p-5 rounded-2xl border border-border">
                <div className="flex justify-between items-center group">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Charge Gold</span>
                      <span className="text-xl font-black text-primary tracking-tighter leading-none">{goldToCharge.toFixed(3)}g</span>
                   </div>
                   <ArrowRightCircle className="text-primary/20" size={20} />
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center group">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none mb-1">Charge INR</span>
                      <span className="text-xl font-black text-emerald-500 tracking-tighter leading-none">₹ {inrToCharge.toLocaleString('en-IN')}</span>
                   </div>
                   <ArrowRightCircle className="text-emerald-500/20" size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              ref={saveRef}
              type="submit"
              disabled={loading}
              className="flex-1 h-12 text-sm font-black rounded-2xl shadow-lg shadow-primary/10"
            >
              {loading ? <RotateCcw className="animate-spin mr-2" size={16} /> : <CheckCircle2 className="mr-2" size={16} />}
              {loading ? 'POSTING...' : 'FINALIZE SALE (Enter)'}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset} className="px-6 h-12 bg-surface border border-border rounded-2xl text-text-muted hover:text-danger text-xs font-black uppercase">
              Reset
            </Button>
          </div>
        </form>

        {showTagModal && (
          <TagSearchModal 
            isOpen={showTagModal}
            onClose={() => setShowTagModal(false)}
            onSelect={(tag) => {
              setForm({
                ...form,
                productId: tag.id,
                tagNo: tag.tag,
                grossWeight: tag.tagGrossWeight || 0,
                kundanWeight: tag.tagKundanWeight || 0,
                stoneWeight: tag.tagStoneWeight || 0,
                mottiWeight: tag.tagMottiWeight || 0,
                netWeight: tag.tagNetWeight || 0,
                tagAmount: tag.tagAmount || 0,
              });
              setShowTagModal(false);
              setTimeout(() => partyRef.current?.focus(), 100);
            }}
          />
        )}
      </div>

      <aside className="w-72 shrink-0 flex flex-col h-full overflow-hidden pt-2 pr-2">
        <PureMonitor 
          partyId={form.customerId}
          partyName={form.customerName}
          balances={balances}
        />
      </aside>
    </div>
  );
}
