/**
 * Money — Value Object representing an INR monetary amount.
 * Immutable; equality based on value.
 * Uses integer paise internally to avoid floating point issues.
 */
export class Money {
  private readonly _paise: number; // stored in paise (1 INR = 100 paise)

  private constructor(paise: number) {
    if (!Number.isInteger(paise) || paise < 0) {
      throw new Error(`Invalid money value: ${paise} paise. Must be a non-negative integer.`);
    }
    this._paise = paise;
  }

  static fromINR(inr: number): Money {
    if (inr < 0) throw new Error(`Money cannot be negative: ${inr}`);
    return new Money(Math.round(inr * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  get inr(): number {
    return this._paise / 100;
  }

  get paise(): number {
    return this._paise;
  }

  add(other: Money): Money {
    return new Money(this._paise + other._paise);
  }

  subtract(other: Money): Money {
    const result = this._paise - other._paise;
    if (result < 0) {
      throw new Error(`Money subtraction resulted in negative value.`);
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this._paise * factor));
  }

  equals(other: Money): boolean {
    return this._paise === other._paise;
  }

  greaterThan(other: Money): boolean {
    return this._paise > other._paise;
  }

  toString(): string {
    return `₹${this.inr.toFixed(2)}`;
  }
}
