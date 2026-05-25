import { create } from 'zustand';

export interface Batch {
  id: string;
  batchNo: string;
  itemId: string;
  sourcePartyId: string;
  status: 'RECEIVED' | 'WIP' | 'COMPLETED';
  createdAt: string;
}

export interface Party {
  id: string;
  name: string;
  code: string;
  phone?: string;
  is_active: boolean;
}

export interface Item {
  id: string;
  name: string;
  category: 'GOLD_KHOLE' | 'FINISHED_GOOD';
  is_active: boolean;
}

export interface FinishedProduct {
  id: string;
  batchId: string;
  finishedItemId: string;
  grossWeight: number;
  netWeight: number;
  purityPercentage: number;
  pureGoldWeight: number;
  status: 'IN_STOCK' | 'SOLD';
  createdAt: string;
}

interface InventoryState {
  batches: Batch[];
  parties: Party[];
  items: Item[];
  finishedProducts: FinishedProduct[];
  isLoading: boolean;
  lastError: string | null;
  // Actions
  loadBatches: () => Promise<void>;
  loadParties: () => Promise<void>;
  loadItems: () => Promise<void>;
  clearError: () => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  batches: [],
  parties: [],
  items: [],
  finishedProducts: [],
  isLoading: false,
  lastError: null,

  loadBatches: async () => {
    set({ isLoading: true });
    try {
      const result = await window.electronAPI.listBatches();
      if (result.success) {
        set({ batches: (result.data ?? []) as Batch[], isLoading: false });
      } else {
        set({ lastError: result.error, isLoading: false });
      }
    } catch (e) {
      set({ lastError: String(e), isLoading: false });
    }
  },

  loadParties: async () => {
    set({ isLoading: true });
    try {
      const result = await window.electronAPI.listParties({});
      if (result.success) {
        set({ parties: (result.data ?? []) as Party[], isLoading: false });
      } else {
        set({ lastError: result.error, isLoading: false });
      }
    } catch (e) {
      set({ lastError: String(e), isLoading: false });
    }
  },

  loadItems: async () => {
    set({ isLoading: true });
    try {
      const result = await window.electronAPI.listItems();
      if (result.success) {
        set({ items: (result.data ?? []) as Item[], isLoading: false });
      } else {
        set({ lastError: result.error, isLoading: false });
      }
    } catch (e) {
      set({ lastError: String(e), isLoading: false });
    }
  },

  clearError: () => set({ lastError: null }),
}));
