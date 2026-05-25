import React, { useState } from 'react';
import { Button } from '@/components/Button';
import { FormField, Input } from '@/components/FormField';
import { Alert } from '@/components/StatusChip';
import { useSetupStore } from '@/store/setupStore';
import { KeyRound, ShieldCheck } from 'lucide-react';

export function LicenseWizard() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setLicenseValid, companyInfo } = useSetupStore();

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a valid license key.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.activateLicense(licenseKey.trim());
      if (result.success) {
        setLicenseValid(true);
      } else {
        setError(result.error || 'Invalid License Key.');
      }
    } catch (err: any) {
      setError('Activation failed.');
    } finally {
      setLoading(false);
    }
  };

  const isKeyValid = licenseKey.trim().length > 5;

  return (
    <div className="min-h-screen bg-background text-text flex items-center justify-center p-6">
      <div className="w-full animate-fade-in max-w-xl">
        <div className="bg-surface border border-border rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-8 relative z-10">
            <div className="space-y-3 flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-inner">
                <ShieldCheck size={40} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Software Activation</h1>
              <p className="text-text-muted leading-relaxed max-w-sm">
                Aurum Bullion requires an active subscription. Please enter your license key to continue using the software for {companyInfo?.name || 'your company'}.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <FormField label="License / Activation Key" required>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <KeyRound size={18} />
                  </div>
                  <Input 
                    value={licenseKey} 
                    onChange={e => setLicenseKey(e.target.value)} 
                    placeholder="Enter License Key"
                    autoFocus 
                    className="pl-10 text-left font-mono uppercase tracking-widest text-lg"
                  />
                </div>
              </FormField>
              
              {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

              <div className="pt-2">
                <Button 
                  size="lg" 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={handleActivate} 
                  loading={loading}
                  disabled={!isKeyValid}
                >
                  <ShieldCheck size={20} />
                  Activate License
                </Button>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-black opacity-50">
                Contact Support to Renew Subscription
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
