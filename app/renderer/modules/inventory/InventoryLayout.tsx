import React from 'react';
import { IssueGoldEquity } from './IssueGoldEquity';
import { ItemManager } from './ItemManager';
import { FinishedStock } from './FinishedStock';
import { SellStock } from './SellStock';
import { useNavigationStore } from '@/store/navigationStore';

export function InventoryLayout() {
  const { activeSubModules, setActiveSubModule } = useNavigationStore();
  const activeTab = activeSubModules['INVENTORY'];

  return (
    <div className="flex w-full h-full text-sm bg-background">
      <section className="flex-1 overflow-hidden relative">
        {activeTab === 'ITEMS' && (
          <div className="absolute inset-0 animate-in fade-in duration-300">
            <ItemManager />
          </div>
        )}
        {activeTab === 'GOLD_EQUITY' && (
          <div className="absolute inset-0 p-8 overflow-y-auto animate-in fade-in duration-300">
            <IssueGoldEquity active={true} />
          </div>
        )}
        {activeTab === 'STOCKS' && (
          <div className="absolute inset-0 p-8 overflow-y-auto animate-in fade-in duration-300">
            <FinishedStock active={true} />
          </div>
        )}
        {activeTab === 'SELL_STOCK' && (
          <div className="absolute inset-0 p-8 overflow-y-auto animate-in fade-in duration-300">
            <SellStock active={true} />
          </div>
        )}
      </section>
    </div>
  );
}

