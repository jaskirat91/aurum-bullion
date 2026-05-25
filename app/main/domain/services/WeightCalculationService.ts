import { Weight } from '../value-objects/Weight';

/**
 * WeightCalculationService — Domain Service for jewellery weight computations.
 * Stateless; operates only on domain value objects.
 */
export class WeightCalculationService {
  /**
   * Calculate net weight: grossWeight − lessWeight
   */
  calculateNetWeight(grossWeight: Weight, lessWeight: Weight): Weight {
    return grossWeight.subtract(lessWeight);
  }

  /**
   * Calculate net pure gold weight from net weight, tench %, and waste %.
   * Formula: netWeight × (tench / 100) × (1 - waste / 100)
   */
  calculateNetPureGold(
    netWeight: Weight,
    tenchPercentage: number,
    wastePercentage: number,
  ): Weight {
    if (tenchPercentage < 0 || tenchPercentage > 100) {
      throw new Error(`Tench percentage out of range: ${tenchPercentage}`);
    }
    if (wastePercentage < 0 || wastePercentage > 100) {
      throw new Error(`Waste percentage out of range: ${wastePercentage}`);
    }
    return netWeight.toPureGold(tenchPercentage, wastePercentage);
  }

  /**
   * Validate that weights are internally consistent:
   * lessWeight <= grossWeight, and netWeight == grossWeight - lessWeight
   */
  validateWeightConsistency(
    grossWeight: Weight,
    lessWeight: Weight,
    netWeight: Weight,
  ): boolean {
    try {
      const calculated = grossWeight.subtract(lessWeight);
      return calculated.equals(netWeight);
    } catch {
      return false;
    }
  }
}
