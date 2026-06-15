/**
 * Per-department "personality" — the distinct play styles from the design spec
 * (core/01 §6), expressed as pure, tunable numbers:
 *
 *  - Government        → defensive / control: leans into Recession, hoards PC,
 *                        taxes the front-runner.
 *  - IR               → information & alliances: balanced prior, spreads risk,
 *                        votes with allies (its own department slate).
 *  - Sociology        → mass movement: concentrates, willing to swing a whole
 *                        region with its ability.
 *  - Public Admin     → efficiency / low-risk: most diversified, keeps a cash
 *                        buffer, never gambles PC.
 *  - Politics & Global → strategist / front-runner: most concentrated, chases
 *                        the highest-upside region, weakest in Slowdown.
 *
 * All values are integers / basis-point-free knobs consumed by score.ts and the
 * bot decision functions. Nothing here reads hidden game truth.
 */
import type { DepartmentId } from "@econwar/shared";
import type { PhasePrior } from "./types.js";

export interface Personality {
  /** Belief over the upcoming phase type (integer weights). */
  prior: PhasePrior;
  /**
   * Fraction of capital (in basis points, 10000 = 100%) the bot is willing to
   * deploy into regions; the remainder is kept as a cash buffer. Lower = safer.
   */
  deployBp: number;
  /**
   * Concentration exponent applied to region scores when turning them into
   * weights. 1 = proportional; higher = greedier (piles into the top region).
   */
  concentration: number;
  /** Minimum PC the bot keeps in reserve before it will spend an ability. */
  pcReserve: number;
  /** Whether the bot prefers to spend its ability aggressively when affordable. */
  aggressiveAbility: boolean;
}

const FLAT_PRIOR: PhasePrior = {
  boom: 1,
  recession: 1,
  recovery: 1,
  slowdown: 1,
};

const PERSONALITIES: Record<DepartmentId, Personality> = {
  // Defensive controller: expects contraction, keeps a big cash buffer + PC.
  government: {
    prior: { boom: 1, recession: 3, recovery: 2, slowdown: 2 },
    deployBp: 7500,
    concentration: 1,
    pcReserve: 10, // enough to fire gov_tax (cost 10)
    aggressiveAbility: true,
  },
  // Information broker: balanced read, well diversified.
  ir: {
    prior: { boom: 2, recession: 2, recovery: 2, slowdown: 2 },
    deployBp: 8500,
    concentration: 1,
    pcReserve: 4,
    aggressiveAbility: false,
  },
  // Mass movement: leans growth/recovery, concentrates to make its swing count.
  sociology: {
    prior: { boom: 3, recession: 1, recovery: 3, slowdown: 1 },
    deployBp: 9000,
    concentration: 2,
    pcReserve: 0,
    aggressiveAbility: true,
  },
  // Efficiency: lowest risk, most diversified, always keeps a buffer.
  public_admin: {
    prior: { boom: 2, recession: 2, recovery: 2, slowdown: 2 },
    deployBp: 7000,
    concentration: 1,
    pcReserve: 99, // effectively never spends PC on settlement abilities
    aggressiveAbility: false,
  },
  // Strategist front-runner: bullish, most concentrated, swings for upside.
  politics_global: {
    prior: { boom: 4, recession: 1, recovery: 3, slowdown: 1 },
    deployBp: 9700,
    concentration: 3,
    pcReserve: 0,
    aggressiveAbility: true,
  },
};

export function personalityFor(department: DepartmentId): Personality {
  return PERSONALITIES[department] ?? {
    prior: { ...FLAT_PRIOR },
    deployBp: 8000,
    concentration: 1,
    pcReserve: 0,
    aggressiveAbility: false,
  };
}
