/**
 * Region scoring under a hidden phase.
 *
 * The true phase is hidden, so a bot scores each region as the prior-weighted
 * expected basis-point return: for every candidate phase, multiply the region's
 * basePhaseEffect × regionalModifier (both bigint bp), weight by the bot's prior
 * over that phase, and sum. All integer/BigInt — no floats.
 *
 * The result is a per-region bigint "expected return in scaled basis points"
 * used only to *rank/weight* regions; it never touches money settlement.
 */
import { BP_ONE, REGION_IDS, PHASE_TYPES } from "@econwar/shared";
import type { ByRegion, RegionId } from "@econwar/shared";
import { basePhaseEffect, regionalModifier } from "@econwar/engine";
import type { PhasePrior } from "./types.js";

/**
 * Expected return per region (scaled bigint). For region r:
 *   score(r) = Σ_phase prior[phase] * base(phase,r) * modifier(r,phase) / BP_ONE
 * Higher = more attractive under this prior. Values stay positive.
 */
export function scoreRegions(prior: PhasePrior): ByRegion<bigint> {
  const out = {} as ByRegion<bigint>;
  for (const region of REGION_IDS) {
    let acc = 0n;
    for (const phase of PHASE_TYPES) {
      const w = BigInt(Math.max(0, prior[phase] | 0));
      if (w === 0n) continue;
      const base = basePhaseEffect(phase, region);
      const modifier = regionalModifier(region, phase);
      acc += (w * base * modifier) / BP_ONE;
    }
    out[region] = acc;
  }
  return out;
}

/**
 * Turn region scores into integer allocation weights, applying a concentration
 * exponent (>=1) so greedy bots pile into top regions. We subtract a floor (the
 * weakest region's score) before exponentiating so differences are amplified,
 * but keep every weight >= 1 so no region is ever fully abandoned (matches the
 * engine's "can't zero a region" spirit and keeps allocations well-defined).
 */
export function scoresToWeights(
  scores: ByRegion<bigint>,
  concentration: number,
): ByRegion<bigint> {
  const exp = Math.max(1, Math.floor(concentration));
  const values = REGION_IDS.map((r) => scores[r]);
  const min = values.reduce((m, v) => (v < m ? v : m), values[0] ?? 0n);

  const out = {} as ByRegion<bigint>;
  for (const region of REGION_IDS) {
    // Shift down by (min - 1) so the weakest region keeps weight 1, others grow.
    const shifted = scores[region] - min + 1n;
    let w = 1n;
    for (let i = 0; i < exp; i++) w *= shifted;
    out[region] = w < 1n ? 1n : w;
  }
  return out;
}

/**
 * Split `total` satang across regions in proportion to integer `weights`,
 * exactly (the parts sum to `total`, never more, never less). Largest-remainder
 * apportionment over a stable region order keeps it deterministic.
 */
export function apportion(
  total: bigint,
  weights: ByRegion<bigint>,
): ByRegion<bigint> {
  const out = {} as ByRegion<bigint>;
  if (total <= 0n) {
    for (const r of REGION_IDS) out[r] = 0n;
    return out;
  }

  let weightSum = 0n;
  for (const r of REGION_IDS) weightSum += weights[r] > 0n ? weights[r] : 0n;
  if (weightSum <= 0n) {
    // Degenerate: dump everything into the first region deterministically.
    for (const r of REGION_IDS) out[r] = 0n;
    out[REGION_IDS[0]!] = total;
    return out;
  }

  // Floor share + remainder, then hand out leftover satang by largest remainder.
  const remainders: Array<{ region: RegionId; rem: bigint }> = [];
  let assigned = 0n;
  for (const r of REGION_IDS) {
    const w = weights[r] > 0n ? weights[r] : 0n;
    const exact = total * w; // /weightSum pending
    const floorShare = exact / weightSum;
    const rem = exact - floorShare * weightSum;
    out[r] = floorShare;
    assigned += floorShare;
    remainders.push({ region: r, rem });
  }

  let leftover = total - assigned;
  // Sort by remainder desc, tie-break by region order (stable, deterministic).
  const order = REGION_IDS.reduce<Record<RegionId, number>>(
    (acc, r, i) => {
      acc[r] = i;
      return acc;
    },
    {} as Record<RegionId, number>,
  );
  remainders.sort((a, b) => {
    if (a.rem !== b.rem) return a.rem > b.rem ? -1 : 1;
    return order[a.region] - order[b.region];
  });
  let idx = 0;
  while (leftover > 0n) {
    const pick = remainders[idx % remainders.length]!;
    out[pick.region] += 1n;
    leftover -= 1n;
    idx++;
  }
  return out;
}
