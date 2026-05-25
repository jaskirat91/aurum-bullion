import React from 'react';
import { PartyLedgerReport } from './PartyLedgerReport';
import { AccountLedgerReport } from './AccountLedgerReport';
import { BatchTrackingReport } from './BatchTrackingReport';
import { KarigarConsumablesReport } from './KarigarConsumablesReport';
import { CustomerPurchaseLedger } from './CustomerPurchaseLedger';
import { AccountStatement } from './AccountStatement';
import { LenaDenaReport } from './LenaDenaReport';
import { useNavigationStore } from '@/store/navigationStore';

export function ReportsLayout() {
  const { activeSubModules } = useNavigationStore();
  const activeTab = activeSubModules['REPORTS'];

  return (
    <div className="flex w-full h-full text-sm bg-background">
      <section className="flex-1 overflow-auto relative">          
        {activeTab === 'PARTY_LEDGER' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <PartyLedgerReport active={true} />
          </div>
        )}
        {activeTab === 'ACCOUNT_LEDGER' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <AccountLedgerReport active={true} />
          </div>
        )}
        {activeTab === 'ACCOUNT_STATEMENT' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <AccountStatement active={true} />
          </div>
        )}
        {activeTab === 'CUSTOMER_PURCHASE_LEDGER' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <CustomerPurchaseLedger active={true} />
          </div>
        )}
        {activeTab === 'BATCH_TRACKING' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <BatchTrackingReport active={true} />
          </div>
        )}
        {activeTab === 'KARIGAR_CONSUMABLES' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <KarigarConsumablesReport active={true} />
          </div>
        )}
        {activeTab === 'LENA_DENA' && (
          <div className="absolute h-full overflow-y-auto w-full animate-in fade-in duration-300">
            <LenaDenaReport active={true} />
          </div>
        )}
      </section>
    </div>
  );
}
