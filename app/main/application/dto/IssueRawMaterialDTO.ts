export interface IssueRawMaterialDTO {
  batchId: string;
  manufacturerPartyId: string;
  grossGoldWeight: number;
  lessWeight: number;
  kundanWeight?: number;
  totalStones?: number;
  labourPerStone?: number;
  piroiWeight?: number;
  stoneWeight?: number;
  taarPattiWeight?: number;
  colorStoneWeight?: number;
}
