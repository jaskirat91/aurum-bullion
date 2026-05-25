export interface ReceiveRawMaterialDTO {
  batchNo: string;
  itemId: string;
  partyId: string;
  weights: {
    grossGoldWeight: number;
    lessWeight: number;
    netWeight: number;
    tenchPercentage: number;
    wastePercentage: number;
    netPureGoldWeight: number;
  };
}
