import { create } from 'zustand';

interface CompanyInfo {
  name: string;
  financialYear: string;
}

interface SetupState {
  initialized: boolean | null;
  licenseValid: boolean | null;
  companyInfo: CompanyInfo | null;
  checkInitialization: () => Promise<void>;
  setCompanyInfo: (info: CompanyInfo) => void;
  setLicenseValid: (valid: boolean) => void;
  getAutoFY: () => string;
}

export const useSetupStore = create<SetupState>((set, get) => ({
  initialized: null,
  licenseValid: null,
  companyInfo: null,

  getAutoFY: () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  },

  checkInitialization: async () => {
    try {
      const isInit = await window.electronAPI.isInitialized();
      if (isInit) {
        const isValid = await window.electronAPI.checkLicense();
        const result = await window.electronAPI.getCompanyInfo();
        const info = result.success ? result.data : null;
        
        set({ 
          initialized: true,
          licenseValid: isValid,
          companyInfo: info || { 
            name: 'Aurum User', 
            financialYear: get().getAutoFY() 
          } 
        });
      } else {
        set({ initialized: false, licenseValid: null, companyInfo: null });
      }
    } catch (err) {
      set({ initialized: false, licenseValid: null });
    }
  },

  setCompanyInfo: (info) => set({ companyInfo: info, initialized: true, licenseValid: false }),
  setLicenseValid: (valid) => set({ licenseValid: valid }),
}));
