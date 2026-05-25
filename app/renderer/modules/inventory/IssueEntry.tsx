import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input, ReadonlyField } from '@/components/FormField';
import { PartySelect } from '@/components/PartySelect';
import { Button } from '@/components/Button';
import { Alert } from '@/components/StatusChip';

export function IssueEntry({ active }: { active?: boolean }) {
  const batchRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => batchRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const [form, setForm] = useState({
    batchId: '',
    manufacturerPartyId: '',
    manufacturerPartyDisplay: '',
    grossGoldWeight: '' as string | number,
    lessWeight: '' as string | number,
    kundanWeight: '' as string | number,
    totalStones: '' as string | number,
    labourPerStone: '' as string | number,
    stoneWeight: '' as string | number,
    taarPattiWeight: '' as string | number,
    colorStoneWeight: '' as string | number,
  });

  const num = (v: string | number) => (typeof v === 'string' ? parseFloat(v) || 0 : v);
  const netWeight = Math.max(0, num(form.grossGoldWeight) - num(form.lessWeight));
  const totalStoneLabour = num(form.totalStones) * num(form.labourPerStone);

  const set = (key: string, val: unknown) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batchId.trim()) { setAlert({ type: 'error', msg: 'Batch ID is required.' }); return; }
    if (!form.manufacturerPartyId.trim()) { setAlert({ type: 'error', msg: 'Manufacturer Party ID is required.' }); return; }

    setLoading(true);
    setAlert(null);
    try {
      const result = await window.electronAPI.issueRawMaterial({
        batchId: form.batchId,
        manufacturerPartyId: form.manufacturerPartyId,
        grossGoldWeight: num(form.grossGoldWeight),
        lessWeight: num(form.lessWeight),
        kundanWeight: num(form.kundanWeight),
        totalStones: num(form.totalStones),
        labourPerStone: num(form.labourPerStone),
        stoneWeight: num(form.stoneWeight),
        taarPattiWeight: num(form.taarPattiWeight),
        colorStoneWeight: num(form.colorStoneWeight),
      });

      if (result.success) {
        setAlert({ type: 'success', msg: `Material issued to manufacturer. Transaction: ${(result as { data?: { transactionId: string } }).data?.transactionId ?? '—'}` });
        setForm((p) => ({ ...p, batchId: '', manufacturerPartyId: '', grossGoldWeight: '', lessWeight: '' }));
      } else {
        setAlert({ type: 'error', msg: (result as { error?: string }).error || 'Unknown error' });
      }
    } catch {
      setAlert({ type: 'error', msg: 'Backend connection error.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-text tracking-tight">Issue to Manufacturer</h2>
        <p className="text-text-muted text-sm mt-1">Record outgoing raw gold to a karigar/manufacturer.</p>
      </div>

      {alert && (
        <div className="mb-6">
          <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reference */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Reference</p>
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Batch ID" required>
              <Input
                ref={batchRef}
                value={form.batchId}
                onChange={(e) => set('batchId', e.target.value)}
                placeholder="Existing batch UUID or No."
                required
              />
            </FormField>
            <PartySelect
              label="Manufacturer"
              value={form.manufacturerPartyId}
              displayValue={form.manufacturerPartyDisplay}
              partyTypes={['MANUFACTURER']}
              onChange={(id, code, name) => {
                setForm(p => ({ ...p, manufacturerPartyId: id, manufacturerPartyDisplay: `${code} - ${name}` }));
              }}
              required
            />
          </div>
        </div>

        {/* Gold Weights */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Gold Weights</p>
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Gross Gold Weight (g)" accentColor="primary" required>
              <Input type="number" step="0.001" min="0" value={form.grossGoldWeight}
                onChange={(e) => set('grossGoldWeight', e.target.value)} accentColor="primary" mono required />
            </FormField>
            <FormField label="Less Weight (g)" accentColor="danger">
              <Input type="number" step="0.001" min="0" value={form.lessWeight}
                onChange={(e) => set('lessWeight', e.target.value)} accentColor="danger" mono />
            </FormField>
            <FormField label="Net Weight (Computed)" className="col-span-2">
              <ReadonlyField value={`${netWeight.toFixed(3)} g`} mono highlight />
            </FormField>
          </div>
        </div>

        {/* Stones & Labour */}
        <div className="p-5 rounded-2xl bg-surface border border-border space-y-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Stones & Labour</p>
          <div className="grid grid-cols-2 gap-5">
            <FormField label="Kundan Weight (g)">
              <Input type="number" step="0.001" min="0" value={form.kundanWeight}
                onChange={(e) => set('kundanWeight', e.target.value)} mono />
            </FormField>
            <FormField label="Stone Weight (g)">
              <Input type="number" step="0.001" min="0" value={form.stoneWeight}
                onChange={(e) => set('stoneWeight', e.target.value)} mono />
            </FormField>
            <FormField label="Taar / Patti Weight (g)">
              <Input type="number" step="0.001" min="0" value={form.taarPattiWeight}
                onChange={(e) => set('taarPattiWeight', e.target.value)} mono />
            </FormField>
            <FormField label="Colour Stone Weight (g)">
              <Input type="number" step="0.001" min="0" value={form.colorStoneWeight}
                onChange={(e) => set('colorStoneWeight', e.target.value)} mono />
            </FormField>
            <FormField label="Total Stones">
              <Input type="number" step="1" min="0" value={form.totalStones}
                onChange={(e) => set('totalStones', e.target.value)} mono />
            </FormField>
            <FormField label="Labour / Stone (₹)">
              <Input type="number" step="0.01" min="0" value={form.labourPerStone}
                onChange={(e) => set('labourPerStone', e.target.value)} mono />
            </FormField>
            <FormField label="Total Stone Labour (₹)" className="col-span-2">
              <ReadonlyField value={`₹ ${totalStoneLabour.toFixed(2)}`} mono highlight />
            </FormField>
          </div>
        </div>

        <Button type="submit" loading={loading} size="lg" className="w-full" variant="primary">
          Issue to Manufacturer
        </Button>
      </form>
    </div>
  );
}
