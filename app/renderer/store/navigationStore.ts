import { create } from 'zustand';

type Module = 'INVENTORY' | 'MANUFACTURING' | 'ACCOUNTING' | 'PARTIES' | 'REPORTS';

interface NavigationState {
  activeModule: Module;
  activeSubModules: Record<Module, string>;
  pendingAction: string | null;
  setActiveModule: (module: Module) => void;
  setActiveSubModule: (module: Module, subModule: string) => void;
  navigateWithAction: (module: Module, action: string) => void;
  clearPendingAction: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeModule: 'INVENTORY',
  activeSubModules: {
    INVENTORY: 'ITEMS',
    MANUFACTURING: 'RAW_RECEIPT',
    ACCOUNTING: 'ACCOUNTS',
    PARTIES: 'LIST',
    REPORTS: 'PARTY_LEDGER',
  },
  pendingAction: null,
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveSubModule: (module, subModule) => 
    set((state) => ({ 
      activeModule: module,
      activeSubModules: { ...state.activeSubModules, [module]: subModule } 
    })),
  navigateWithAction: (module, action) => set({ activeModule: module, pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}));
