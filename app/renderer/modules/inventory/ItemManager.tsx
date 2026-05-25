import React, { useState, useEffect, useRef } from 'react';
import { FormField, Input, Select } from '@/components/FormField';
import { Button } from '@/components/Button';
import { Alert, StatusChip } from '@/components/StatusChip';
import { 
  Search, 
  Package, 
  Plus, 
  X, 
  Edit2, 
  MoreVertical, 
  Tag, 
  Scale, 
  ShieldCheck, 
  LayoutGrid,
  Info
} from 'lucide-react';

export enum ItemCategory {
  RAW_MATERIAL = 'RAW_MATERIAL',
  FINISHED_GOOD = 'FINISHED_GOOD',
  FINDINGS = 'FINDINGS',
  SERVICES = 'SERVICES',
}

interface Item {
  id: string;
  name: string;
  code: string;
  category: ItemCategory;
  purity?: number;
  uom: 'GRAM' | 'PCS' | 'CARAT';
  hsn_code?: string;
  description?: string;
  is_active: boolean;
}

export function ItemManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    category: ItemCategory.FINISHED_GOOD,
    purity: '' as string | number,
    uom: 'GRAM' as 'GRAM' | 'PCS' | 'CARAT',
    hsnCode: '',
    description: '',
  });

  // Refs for keyboard navigation
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const uomRef = useRef<HTMLSelectElement>(null);
  const purityRef = useRef<HTMLInputElement>(null);
  const hsnRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const focusNext = (e: React.KeyboardEvent, nextRef: React.RefObject<{ focus: () => void } | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  const fetchData = async () => {
    const result = await window.electronAPI.listItems();
    if (result.success) setItems(result.data as Item[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = async () => {
    setLoading(true);
    const codeResult = await window.electronAPI.getNextItemCode();
    setForm({
      name: '',
      code: codeResult.success ? (codeResult.data as string) : 'ITM-ERR',
      category: ItemCategory.FINISHED_GOOD,
      purity: '',
      uom: 'GRAM',
      hsnCode: '',
      description: '',
    });
    setEditingItem(null);
    setShowForm(true);
    setLoading(false);
    // Focus first field after animation
    setTimeout(() => nameRef.current?.focus(), 150);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      code: item.code,
      category: item.category,
      purity: item.purity || '',
      uom: item.uom,
      hsnCode: item.hsn_code || '',
      description: item.description || '',
    });
    setShowForm(true);
    // Focus first field after animation
    setTimeout(() => nameRef.current?.focus(), 150);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        purity: form.purity ? parseInt(form.purity.toString()) : undefined,
      };

      const result = editingItem 
        ? await window.electronAPI.updateItem({ ...payload, id: editingItem.id } as any)
        : await window.electronAPI.createItem(payload as any);

      if (result.success) {
        setShowForm(false);
        fetchData();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return form.name.trim().length >= 2 && form.code.length > 0;
  };

  const filtered = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background p-8 overflow-hidden">
      {/* Search & Actions */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Package className="text-primary" size={32} />
            Item Master
          </h1>
          <p className="text-text-muted font-bold text-xs uppercase tracking-[0.2em] px-1">Define Products, Raw Materials & Services</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-12 pr-6 py-3 bg-surface border border-border rounded-2xl w-80 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/20">
            <Plus size={20} className="mr-2" /> Create Item
          </Button>
        </div>
      </div>

      {/* Tabular View */}
      <div className="flex-1 overflow-hidden flex flex-col bg-surface border border-border rounded-[2rem] shadow-sm">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-border">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Code</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Item Name</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Category</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Purity</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Unit</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">HSN</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-text-muted text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(item => (
                <tr key={item.id} className="group hover:bg-primary/[0.02] transition-colors cursor-default">
                  <td className="p-5 py-6">
                    <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center text-primary font-black text-sm">
                        <Tag size={18} />
                      </div>
                      <span className="font-bold text-base">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-background/50 px-2 py-1 rounded-md border border-border">
                      {item.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-bold text-text-muted">
                    {item.purity ? `${item.purity}K` : '--'}
                  </td>
                  <td className="p-5">
                     <span className="text-[10px] font-black text-secondary bg-secondary/10 px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm">
                      {item.uom}
                    </span>
                  </td>
                  <td className="p-5 text-xs font-mono font-bold text-text-muted/60">
                    {item.hsn_code || '--'}
                  </td>
                  <td className="p-5">
                    <StatusChip status={item.is_active ? 'COMPLETED' : 'VOID'} />
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 hover:bg-primary/10 text-text-muted hover:text-primary rounded-xl transition-all"
                        title="Edit Item"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-white/5 text-text-muted rounded-xl transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <Package size={48} className="text-border mb-4 opacity-20" />
              <p className="font-bold text-text-muted">No items found in master directory.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Form */}
      {showForm && (
        <div className="absolute inset-0 z-50 flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={handleCloseForm} />
          
          <div className="relative w-full max-w-xl bg-surface border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-8 border-b border-border flex items-center justify-between bg-background/20 sticky top-0 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  {editingItem ? <Edit2 size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{editingItem ? 'Update Item' : 'Create New Item'}</h2>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{form.code}</p>
                </div>
              </div>
              <button onClick={handleCloseForm} className="p-3 hover:bg-white/[0.05] rounded-2xl transition-colors">
                <X size={24} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 flex-1">
              {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutGrid size={16} className="text-primary" />
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted">Specifications</span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Item Code" required>
                    <Input value={form.code} readOnly className="bg-background/40 font-mono opacity-80 cursor-not-allowed" />
                  </FormField>
                  <FormField label="Item Name" required>
                    <Input 
                      ref={nameRef}
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      onKeyDown={e => focusNext(e, categoryRef)}
                      placeholder="e.g. 22K Gold Ring" 
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Category" required>
                    <Select 
                      ref={categoryRef}
                      value={form.category} 
                      onChange={e => setForm({...form, category: e.target.value as ItemCategory})}
                      onKeyDown={e => focusNext(e, uomRef)}
                      options={[
                        { value: ItemCategory.RAW_MATERIAL, label: 'Raw Material / Bullion' },
                        { value: ItemCategory.FINISHED_GOOD, label: 'Finished Jewellery' },
                        { value: ItemCategory.FINDINGS, label: 'Findings / Parts' },
                        { value: ItemCategory.SERVICES, label: 'Service / Labour' }
                      ]}
                      className="h-12 font-bold"
                    />
                  </FormField>
                  <FormField label="Unit of Measure" required icon={<Scale size={14} />}>
                    <Select 
                      ref={uomRef}
                      value={form.uom} 
                      onChange={e => setForm({...form, uom: e.target.value as 'GRAM' | 'PCS' | 'CARAT'})}
                      onKeyDown={e => focusNext(e, purityRef)}
                      options={[
                        { value: 'GRAM', label: 'Gram (g)' },
                        { value: 'PCS', label: 'Pieces (pcs)' },
                        { value: 'CARAT', label: 'Carat (ct)' }
                      ]}
                      className="h-12 font-bold"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <FormField label="Purity (Karat)" icon={<ShieldCheck size={14} />}>
                    <Input 
                      ref={purityRef}
                      type="number" 
                      value={form.purity} 
                      onChange={e => setForm({...form, purity: e.target.value})} 
                      onKeyDown={e => focusNext(e, hsnRef)}
                      placeholder="e.g. 22" 
                    />
                  </FormField>
                  <FormField label="HSN Code (GST)">
                    <Input 
                      ref={hsnRef}
                      value={form.hsnCode} 
                      onChange={e => setForm({...form, hsnCode: e.target.value})} 
                      onKeyDown={e => focusNext(e, descRef)}
                      placeholder="7113..." 
                    />
                  </FormField>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={16} className="text-violet-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted">Descriptive Details</span>
                </div>
                <FormField label="Item Description">
                  <textarea 
                    ref={descRef}
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitRef.current?.focus();
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                    placeholder="Add details about style, weight range, or specifications..."
                  />
                </FormField>
              </section>
            </form>

            <div className="p-8 border-t border-border bg-background/20 sticky bottom-0 backdrop-blur-md">
              <Button 
                ref={submitRef}
                onClick={handleSubmit} 
                className="w-full h-14 text-lg font-black shadow-primary/20" 
                loading={loading}
                disabled={!isFormValid()}
              >
                {editingItem ? 'Update Master' : 'Create Item'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
