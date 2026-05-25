import React from 'react';
import { JournalManager } from './JournalManager';
import { AccountsManager } from './AccountsManager';
import { SaleVoucherManager } from './SaleVoucherManager';
import { SaleReturnVoucherManager } from './SaleReturnVoucherManager';
import { CashVoucherManager } from './CashVoucherManager';
import { GoldVoucherManager } from './GoldVoucherManager';
import { CustomerOrderManager } from './CustomerOrderManager';
import { SupplierOrderManager } from './SupplierOrderManager';
import { useNavigationStore } from '@/store/navigationStore';

export function AccountingLayout() {
  const { activeSubModules } = useNavigationStore();
  const activeTab = activeSubModules['ACCOUNTING'];

  return (
    <div className="flex w-full h-full text-sm">
      <section className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'JOURNAL'       && <JournalManager />}
        {activeTab === 'ACCOUNTS'      && <AccountsManager />}
        {activeTab === 'SALE_VOUCHER'         && <SaleVoucherManager />}
        {activeTab === 'SALE_RETURN_VOUCHER'  && <SaleReturnVoucherManager />}
        {activeTab === 'CASH_VOUCHER'         && <CashVoucherManager />}
        {activeTab === 'GOLD_VOUCHER'  && <GoldVoucherManager />}
        {activeTab === 'CUSTOMER_ORDERS' && <CustomerOrderManager />}
        {activeTab === 'SUPPLIER_ORDERS' && <SupplierOrderManager />}
      </section>
    </div>
  );
}
