/**
 * Weight — Value Object representing a gold weight in grams.
 * Immutable; equality based on value, not reference.
 * All operations preserve 3 decimal places (jewellery standard).
 */
export class Weight {
  private readonly _grams: number;

  private constructor(grams: number) {
    if (isNaN(grams) || grams < 0) {
      throw new Error(`Invalid weight value: ${grams}. Weight must be a non-negative number.`);
    }
    this._grams = Math.round(grams * 1000) / 1000; // 3dp precision
  }

  static of(grams: number): Weight {
    return new Weight(grams);
  }

  static zero(): Weight {
    return new Weight(0);
  }

  get grams(): number {
    return this._grams;
  }

  add(other: Weight): Weight {
    return new Weight(this._grams + other._grams);
  }

  subtract(other: Weight): Weight {
    const result = this._grams - other._grams;
    if (result < 0) {
      throw new Error(`Weight subtraction resulted in negative value: ${result}`);
    }
    return new Weight(result);
  }

  multiply(factor: number): Weight {
    return new Weight(this._grams * factor);
  }

  /**
   * Calculate pure gold weight using tench (purity %) and waste %.
   * Formula: netWeight × (tench / 100) × (1 - waste / 100)
   */
  toPureGold(tenchPercentage: number, wastePercentage: number): Weight {
    const pure = this._grams * (tenchPercentage / 100) * (1 - wastePercentage / 100);
    return new Weight(pure);
  }

  equals(other: Weight): boolean {
    return this._grams === other._grams;
  }

  toString(): string {
    return `${this._grams.toFixed(3)}g`;
  }
}
