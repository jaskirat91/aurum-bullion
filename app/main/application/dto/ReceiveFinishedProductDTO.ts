export interface ReceiveFinishedProductDTO {
  batchId: string;
  partyId: string;       // manufacturer returning the goods
  finishedItemId: string;
  grossWeight: number;
  kundanWeight?: number;
  stoneWeight?: number;
  mottiWeight?: number;
  smallStoneWeight?: number;
  netWeight: number;
  purityPercentage: number;
  labourCost?: number;
  // Raw material return tracking
  grossGoldReturned: number;
  lessWeight?: number;
  tenchPercentage?: number;
  wastePercentage?: number;
  // Tag details
  tagGrossWeight?: number;
  tagKundanWeight?: number;
  tagStoneWeight?: number;
  tagMottiWeight?: number;
  tagNetWeight?: number;
  tagAmount?: number;
}
