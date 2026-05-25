import React from 'react';
import { ReceiveRawMaterial } from './ReceiveRawMaterial';
import { IssueMaterial } from './IssueMaterial';
import { ReceiveFinishedGoods } from './ReceiveFinishedGoods';
import { useNavigationStore } from '@/store/navigationStore';

export function ManufacturingLayout() {
  const { activeSubModules } = useNavigationStore();
  const activeTab = activeSubModules['MANUFACTURING'];

  return (
      <div className="flex w-full h-full text-sm bg-background">
        <section className="flex-1 overflow-auto relative">          
          {activeTab === 'RAW_RECEIPT' && (
            <div className="absolute h-full w-full overflow-y-auto animate-in fade-in duration-300">
              <ReceiveRawMaterial active={true} />
            </div>
          )}
          {activeTab === 'ISSUE_MATERIAL' && (
            <div className="absolute h-full w-full overflow-y-auto animate-in fade-in duration-300">
              <IssueMaterial active={true} />
            </div>
          )}
          {activeTab === 'FINISHED_RECEIPT' && (
            <div className="absolute h-full w-full overflow-y-auto animate-in fade-in duration-300">
              <ReceiveFinishedGoods active={true} />
            </div>
          )}
        </section>
      </div>
    );
  }
  