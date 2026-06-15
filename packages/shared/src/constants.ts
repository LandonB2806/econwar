/**
 * EconWar shared constants.
 *
 * Golden rules in play:
 *  - Money is integer **satang** (1 baht = 100 satang). Never floats.
 *  - Multipliers are **basis points** (BP_ONE = 10000 = x1.0).
 *  - The settlement chain multiplies 5 basis-point factors, divides by 10000^5,
 *    and rounds half-up exactly once at the end.
 */

/** 1 baht = 100 satang. All internal money is integer satang. */
export const SATANG_PER_BAHT = 100n;

/** Basis-point scale. 10000 bp = x1.0. */
export const BP_ONE = 10000n;

/** Number of basis-point factors in the settlement chain. */
export const SETTLEMENT_FACTOR_COUNT = 5;

/** Denominator for the whole settlement chain: 10000^5. */
export const SETTLEMENT_DENOM = BP_ONE ** BigInt(SETTLEMENT_FACTOR_COUNT);

/** Equal starting capital for every player: ฿1,000,000 = 100,000,000 satang. */
export const STARTING_CAPITAL_SATANG = 100_000_000n;

/** A game runs through exactly 4 hidden phases. */
export const PHASES_PER_GAME = 4;

/* ---- Controller (voted Market Controller) ---- */

/** Max magnitude the controller may tilt a single region, in basis points (+/-). */
export const MAX_TILT_BP = 2000n; // +/-20%

/** The dampening applied to non-chosen regions when the controller boosts one. */
export const MARKET_TILT_DAMPEN_BP = 300n; // -3% to the others

/**
 * Transparency penalty: a controller who tilts a region they are invested in
 * loses this slice of their gain *in that region* (so they can't trivially rig
 * the market for themselves).
 */
export const CONTROLLER_TRANSPARENCY_PENALTY_BP = 1000n; // -10% of own chosen-region gain

/* ---- Department-slate voting (260-player scale) ---- */

/** Political Capital needed per bonus vote weight. */
export const PC_PER_BONUS_VOTE = 20;

/** Cap on bonus vote weight from PC, so the rich can't fully buy elections. */
export const MAX_BONUS_VOTES = 3;

/**
 * voteWeight(pc) = 1 + min(floor(pc / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES).
 * Shared by client (display) and engine (tally) so they never disagree.
 */
export function voteWeight(pc: number): number {
  const bonus = Math.min(Math.floor(pc / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES);
  return 1 + Math.max(0, bonus);
}
