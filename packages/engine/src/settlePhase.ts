/**
 * settlePhase — the deterministic core of EconWar.
 *
 * Golden rules honored here:
 *  #1 pure: data in → data out, no React/Node/DB/clock/network.
 *  #2 integer money (satang) + basis-point factors; the whole chain is computed
 *     in BigInt, divided by 10000^5, rounded HALF-UP exactly once per region.
 *  #3 deterministic: the only randomness is one event drawn from the pinned RNG.
 *
 * Fixed factor order per (player, region):
 *   basePhaseEffect → regionalModifier → controllerTilt → randomEvent → abilityEffects
 */
import {
  BP_ONE,
  CONTROLLER_TRANSPARENCY_PENALTY_BP,
  getDepartment,
  getAbility,
  REGION_IDS,
  SETTLEMENT_DENOM,
} from "@econwar/shared";
import type {
  ByRegion,
  GameState,
  PhaseInputs,
  PlayerId,
  PlayerSettlement,
  RegionResult,
  Satang,
  SettlementResult,
} from "@econwar/shared";
import { makeRng } from "./rng.js";
import { basePhaseEffect, regionalModifier } from "./factors/market.js";
import { drawEvent, eventMultiplierFor } from "./factors/event.js";
import { abilityMultiplier, resolveAbilities } from "./factors/ability.js";

/** Round half-up once: (num + den/2) / den, all BigInt. den is positive. */
function roundHalfUp(num: bigint, den: bigint): bigint {
  return (num + den / 2n) / den;
}

function emptyRegionMap<T>(fill: T): ByRegion<T> {
  return { central: fill, north: fill, south: fill, northeast: fill };
}

export function settlePhase(
  state: GameState,
  inputs: PhaseInputs,
  seed: number,
): SettlementResult {
  const phase = inputs.phaseType;
  const rng = makeRng(seed);
  const event = drawEvent(rng);
  const resolved = resolveAbilities(inputs.abilities);

  // PC spent per actor this phase (sum of ability costs).
  const pcSpentByPlayer = new Map<PlayerId, number>();
  for (const act of inputs.abilities) {
    const cost = getAbility(act.abilityId).pcCost;
    pcSpentByPlayer.set(
      act.actorId,
      (pcSpentByPlayer.get(act.actorId) ?? 0) + cost,
    );
  }

  // Process players in a deterministic order (id ascending).
  const players = [...state.players].sort((a, b) => (a.id < b.id ? -1 : 1));

  // First pass: market revaluation (no taxes yet).
  const settlements = new Map<PlayerId, PlayerSettlement>();
  const marketGain = new Map<PlayerId, Satang>();

  for (const p of players) {
    const alloc = inputs.allocations[p.id] ?? emptyRegionMap(0n);
    const regionResults = {} as ByRegion<RegionResult>;
    let allocSum = 0n;
    let regionTotal = 0n;

    for (const region of REGION_IDS) {
      const allocated = alloc[region] ?? 0n;
      allocSum += allocated;

      const base = basePhaseEffect(phase, region);
      const regional = regionalModifier(region, phase);

      // controllerTilt factor — with the transparency penalty folded in for the
      // controller's own boosted region (anti-self-rigging guardrail).
      let tilt = inputs.controllerTilt[region] ?? BP_ONE;
      if (p.id === inputs.controllerId && tilt > BP_ONE) {
        tilt = (tilt * (BP_ONE - CONTROLLER_TRANSPARENCY_PENALTY_BP)) / BP_ONE;
      }

      const ev = eventMultiplierFor(event, region);
      const ability = abilityMultiplier(resolved, p.id, region);

      const num = allocated * base * regional * tilt * ev * ability;
      const finalValue = roundHalfUp(num, SETTLEMENT_DENOM);

      regionResults[region] = { allocated, finalValue };
      regionTotal += finalValue;
    }

    const unallocated = p.money - allocSum;
    const grossAfterMarket = regionTotal + unallocated;
    marketGain.set(p.id, grossAfterMarket - p.money);

    const pcSpent = pcSpentByPlayer.get(p.id) ?? 0;
    const pcEarned = getDepartment(p.department).pcRate[phase];

    settlements.set(p.id, {
      playerId: p.id,
      startMoney: p.money,
      regionResults,
      unallocated,
      grossAfterMarket,
      taxPaid: 0n,
      taxReceived: 0n,
      endMoney: grossAfterMarket,
      pcStart: p.pc,
      pcSpent,
      pcEarned,
      pcEnd: p.pc - pcSpent + pcEarned,
    });
  }

  // Second pass: apply TAX transfers on positive market gain.
  for (const tax of resolved.taxes) {
    const target = settlements.get(tax.targetId);
    const actor = settlements.get(tax.actorId);
    if (!target || !actor) continue;
    const gain = marketGain.get(tax.targetId) ?? 0n;
    if (gain <= 0n) continue;
    const amount = roundHalfUp(gain * tax.bp, BP_ONE);
    if (amount <= 0n) continue;
    target.taxPaid += amount;
    target.endMoney -= amount;
    actor.taxReceived += amount;
    actor.endMoney += amount;
  }

  // Stable output order (id ascending) + leaderboard (money desc, id asc).
  const playerResults = players.map((p) => settlements.get(p.id)!);
  const leaderboard = [...playerResults]
    .sort((a, b) => {
      if (a.endMoney !== b.endMoney) return a.endMoney > b.endMoney ? -1 : 1;
      return a.playerId < b.playerId ? -1 : 1;
    })
    .map((s) => s.playerId);

  return {
    seed,
    phaseType: phase,
    event,
    players: playerResults,
    leaderboard,
  };
}
