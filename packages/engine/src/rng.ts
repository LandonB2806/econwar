/**
 * The one pinned PRNG for the entire project: `mulberry32`.
 *
 * Golden rule #3: deterministic RNG, identical in TS and Python, locked by a
 * committed golden vector (golden/rng_vector.json). No Math.random(), no
 * Date.now() — seed in, identical uint32 stream out.
 *
 * We expose the raw uint32 output (an exact integer, never a fractional float)
 * and integer selection helpers, so the engine honors the "no floats" rule.
 */

const FNV_LIKE_SALT = 0x9e3779b1; // golden-ratio constant for phase-seed mixing

export class Rng {
  private a: number;

  constructor(seed: number) {
    this.a = seed | 0;
  }

  /** Next 32-bit unsigned integer in [0, 2^32). Canonical mulberry32. */
  nextU32(): number {
    this.a |= 0;
    this.a = (this.a + 0x6d2b79f5) | 0;
    let t = Math.imul(this.a ^ (this.a >>> 15), 1 | this.a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  /**
   * Unbiased integer in [0, n) via 32-bit multiply-shift, computed in BigInt
   * so it stays exact and float-free. n must be a positive integer.
   */
  nextBelow(n: number): number {
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error(`nextBelow requires a positive integer, got ${n}`);
    }
    const u = BigInt(this.nextU32());
    return Number((u * BigInt(n)) >> 32n);
  }
}

export function makeRng(seed: number): Rng {
  return new Rng(seed);
}

/**
 * Derive a stable per-phase seed from the game seed and phase index, so each
 * phase draws an independent-but-reproducible event stream.
 */
export function phaseSeed(gameSeed: number, phaseIndex: number): number {
  return (gameSeed ^ Math.imul(phaseIndex + 1, FNV_LIKE_SALT)) >>> 0;
}
