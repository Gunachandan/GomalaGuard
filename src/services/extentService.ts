/**
 * Extent Arithmetic Service for Gomala Atlas
 * 
 * Strict integer-only anas arithmetic.
 * 1 Acre = 40 Guntas
 * 1 Gunta = 16 Anas
 * 1 Acre = 640 Anas
 * 
 * Zero floating point in all area calculations. Subtraction below zero throws.
 */

export interface ExtentParts {
  acres: number;
  guntas: number;
  anas: number;
}

export class ExtentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtentError';
  }
}

export class ExtentService {
  public static readonly ANAS_PER_GUNTA = 16;
  public static readonly GUNTAS_PER_ACRE = 40;
  public static readonly ANAS_PER_ACRE = 40 * 16; // 640

  // Uncalibrated defaults as mandated by system architecture
  public static readonly DEFAULT_TOL_ABS_ANAS = 0;
  public static readonly DEFAULT_TOL_REL_BP = 0;

  /**
   * Converts acres, guntas, anas to total integer anas.
   * Validates non-negative integer inputs.
   */
  public static toAnas(acres: number, guntas: number, anas: number): number {
    if (!Number.isInteger(acres) || !Number.isInteger(guntas) || !Number.isInteger(anas)) {
      throw new ExtentError('Extent components must be integers');
    }
    if (acres < 0 || guntas < 0 || anas < 0) {
      throw new ExtentError('Negative extent values are not permitted');
    }
    return acres * this.ANAS_PER_ACRE + guntas * this.ANAS_PER_GUNTA + anas;
  }

  /**
   * Normalizes total integer anas into { acres, guntas, anas }
   */
  public static fromAnas(totalAnas: number): ExtentParts {
    if (!Number.isInteger(totalAnas)) {
      throw new ExtentError('Total anas must be an integer');
    }
    if (totalAnas < 0) {
      throw new ExtentError('Negative total anas is not permitted');
    }

    const acres = Math.floor(totalAnas / this.ANAS_PER_ACRE);
    const remainderAfterAcres = totalAnas % this.ANAS_PER_ACRE;
    const guntas = Math.floor(remainderAfterAcres / this.ANAS_PER_GUNTA);
    const anas = remainderAfterAcres % this.ANAS_PER_GUNTA;

    return { acres, guntas, anas };
  }

  /**
   * Formats into standard Karnataka land record representation: "1A-20G-0A"
   */
  public static format(totalAnas: number): string {
    const { acres, guntas, anas } = this.fromAnas(totalAnas);
    return `${acres}A-${guntas}G-${anas}A`;
  }

  /**
   * Parses string in format "1A-20G-0A" or "1-20-0"
   */
  public static parse(formatted: string): number {
    const trimmed = formatted.trim();
    const regex = /^(\d+)[A-a]?[-:]\s*(\d+)[G-g]?[-:]\s*(\d+)[A-a]?$/;
    const match = trimmed.match(regex);
    if (!match) {
      throw new ExtentError(`Invalid extent string format: ${formatted}. Expected format: 1A-20G-0A`);
    }
    const acres = parseInt(match[1], 10);
    const guntas = parseInt(match[2], 10);
    const anas = parseInt(match[3], 10);
    return this.toAnas(acres, guntas, anas);
  }

  /**
   * Adds two extents. Strictly integer.
   */
  public static add(anasA: number, anasB: number): number {
    if (anasA < 0 || anasB < 0) {
      throw new ExtentError('Extent cannot be negative');
    }
    return anasA + anasB;
  }

  /**
   * Subtracts anasB from anasA. Throws if result would be negative.
   */
  public static subtract(anasA: number, anasB: number): number {
    if (anasA < anasB) {
      throw new ExtentError('Negative extent subtraction refused');
    }
    return anasA - anasB;
  }

  /**
   * Calculates system tolerance in anas:
   * tolerance_anas = max(TOL_ABS_ANAS, ceil(parent_anas * TOL_REL_BP / 10000))
   * Note: uses Math.ceil for ceiling rounding to ensure integer anas.
   */
  public static calculateTolerance(
    parentAnas: number,
    tolAbsAnas: number = ExtentService.DEFAULT_TOL_ABS_ANAS,
    tolRelBp: number = ExtentService.DEFAULT_TOL_REL_BP
  ): number {
    if (parentAnas < 0 || tolAbsAnas < 0 || tolRelBp < 0) {
      throw new ExtentError('Tolerance parameters and parent extent must be non-negative');
    }
    const relTolerance = Math.ceil((parentAnas * tolRelBp) / 10000);
    return Math.max(tolAbsAnas, relTolerance);
  }

  /**
   * Checks whether the current tolerance settings are uncalibrated default.
   */
  public static isToleranceUncalibrated(tolAbsAnas: number, tolRelBp: number): boolean {
    return tolAbsAnas === 0 && tolRelBp === 0;
  }

  /**
   * SQL equivalence representation (matches the PostgreSQL extent arithmetic functions)
   */
  public static getSqlDefinition(): string {
    return `
-- Extent Arithmetic SQL functions for Gomala Atlas
CREATE OR REPLACE FUNCTION extent_to_anas(acres INT, guntas INT, anas INT) RETURNS INT AS $$
BEGIN
  IF acres < 0 OR guntas < 0 OR anas < 0 THEN
    RAISE EXCEPTION 'Negative extent values are not permitted';
  END IF;
  RETURN (acres * 640) + (guntas * 16) + anas;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_from_anas(total_anas INT) RETURNS TEXT AS $$
DECLARE
  v_acres INT;
  v_rem INT;
  v_guntas INT;
  v_anas INT;
BEGIN
  IF total_anas < 0 THEN
    RAISE EXCEPTION 'Negative total anas is not permitted';
  END IF;
  v_acres := total_anas / 640;
  v_rem := total_anas % 640;
  v_guntas := v_rem / 16;
  v_anas := v_rem % 16;
  RETURN v_acres || 'A-' || v_guntas || 'G-' || v_anas || 'A';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_subtract(a INT, b INT) RETURNS INT AS $$
BEGIN
  IF a < b THEN
    RAISE EXCEPTION 'Negative extent subtraction refused';
  END IF;
  RETURN a - b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION extent_tolerance(parent_anas INT, tol_abs INT, tol_rel_bp INT) RETURNS INT AS $$
DECLARE
  v_rel INT;
BEGIN
  IF parent_anas < 0 OR tol_abs < 0 OR tol_rel_bp < 0 THEN
    RAISE EXCEPTION 'Negative parameters refused';
  END IF;
  v_rel := CEIL((parent_anas::NUMERIC * tol_rel_bp::NUMERIC) / 10000.0)::INT;
  RETURN GREATEST(tol_abs, v_rel);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
`;
  }

  /**
   * Self-test against vector suite including deterministic seeded 10,000 round-trips
   */
  public static runVerificationSuite(): {
    passed: boolean;
    vectorTestsRun: number;
    seededRoundTrips: number;
    errorCount: number;
    log: string[];
  } {
    const log: string[] = [];
    let passed = true;
    let errorCount = 0;
    let vectorTestsRun = 0;

    // 1. Basic conversions
    try {
      if (this.toAnas(1, 0, 0) !== 640) throw new Error('1A-0G-0A != 640');
      if (this.format(640) !== '1A-0G-0A') throw new Error('640 formatted != 1A-0G-0A');
      vectorTestsRun++;

      if (this.toAnas(0, 1, 0) !== 16) throw new Error('0A-1G-0A != 16');
      if (this.toAnas(0, 0, 1) !== 1) throw new Error('0A-0G-1A != 1');
      if (this.toAnas(0, 40, 0) !== 640) throw new Error('0A-40G-0A != 640');
      if (this.toAnas(2, 15, 8) !== 1528) throw new Error('2A-15G-8A != 1528');
      vectorTestsRun += 4;

      // 2. Addition
      const a = this.toAnas(1, 10, 0); // 800
      const b = this.toAnas(0, 35, 8); // 568
      const sum = this.add(a, b);
      if (sum !== 1368 || this.format(sum) !== '2A-5G-8A') {
        throw new Error('Addition failed vector check');
      }
      vectorTestsRun++;

      // 3. Subtraction
      const subA = this.toAnas(1, 20, 0); // 960
      const subB = this.toAnas(0, 5, 0);  // 80
      const diff = this.subtract(subA, subB); // 880 (1A-15G-0A)
      if (diff !== 880 || this.format(diff) !== '1A-15G-0A') {
        throw new Error('Subtraction 1A-20G-0A - 0A-5G-0A != 1A-15G-0A');
      }
      vectorTestsRun++;

      // 4. Negative refusal
      let didThrow = false;
      try {
        const small = this.toAnas(0, 10, 0);
        const big = this.toAnas(0, 10, 1);
        this.subtract(small, big);
      } catch (err: any) {
        if (err.message === 'Negative extent subtraction refused') {
          didThrow = true;
        }
      }
      if (!didThrow) throw new Error('Negative subtraction did not throw required message');
      vectorTestsRun++;

      // 5. Tolerance checks
      const tol1 = this.calculateTolerance(640, 0, 0);
      if (tol1 !== 0) throw new Error('Tolerance (640, 0, 0) != 0');
      const tol2 = this.calculateTolerance(1000, 0, 15); // 1000 * 15 / 10000 = 1.5 -> ceil = 2
      if (tol2 !== 2) throw new Error(`Tolerance (1000, 0, 15) got ${tol2}, expected 2`);
      const tol3 = this.calculateTolerance(640, 5, 10);
      if (tol3 !== 5) throw new Error(`Tolerance (640, 5, 10) got ${tol3}, expected 5`);
      vectorTestsRun += 3;

      log.push('Core vector suite passed.');
    } catch (err: any) {
      passed = false;
      errorCount++;
      log.push(`Core vector error: ${err.message}`);
    }

    // 6. 10,000 seeded deterministic round-trips
    let seededRoundTrips = 0;
    let seed = 420420;
    // Linear congruential generator for reproducible pseudo-random numbers
    const lcg = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    try {
      for (let i = 0; i < 10000; i++) {
        const acres = Math.floor(lcg() * 50); // 0 to 49 acres
        const guntas = Math.floor(lcg() * 40); // 0 to 39 guntas
        const anas = Math.floor(lcg() * 16);  // 0 to 15 anas

        const total = this.toAnas(acres, guntas, anas);
        const back = this.fromAnas(total);

        if (back.acres !== acres || back.guntas !== guntas || back.anas !== anas) {
          throw new Error(`Round-trip mismatch at #${i}: (${acres},${guntas},${anas}) => ${total} => (${back.acres},${back.guntas},${back.anas})`);
        }
        seededRoundTrips++;
      }
      log.push(`Successfully verified 10,000 deterministic seeded round-trips.`);
    } catch (err: any) {
      passed = false;
      errorCount++;
      log.push(`Seeded round-trip failure: ${err.message}`);
    }

    return {
      passed,
      vectorTestsRun,
      seededRoundTrips,
      errorCount,
      log,
    };
  }
}
