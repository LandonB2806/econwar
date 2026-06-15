/**
 * Factor 5 of the settlement chain: ability effects.
 *
 * Abilities resolve in two places:
 *  - Multiplicative effects (GLOBAL_REGION_MULT, REGION_MULT) fold into the
 *    per-region factor product *before* rounding.
 *  - TAX is a post-revaluation transfer of a slice of the target's gain, so it
 *    is returned as a directive and applied by settlePhase after rounding.
 *
 * INFO / REBALANCE abilities have no settlement multiplier — they act earlier
 * in the round loop (peek at indicators / rebalance allocation) and are no-ops
 * here.
 */
import { BP_ONE, getAbility } from "@econwar/shared";
import type {
  AbilityActivation,
  BasisPoints,
  ByRegion,
  PlayerId,
  RegionId,
} from "@econwar/shared";
import { neutralTilt } from "./controller.js";

export interface TaxDirective {
  actorId: PlayerId;
  targetId: PlayerId;
  /** Fraction of the target's market gain to transfer, in basis points. */
  bp: BasisPoints;
}

export interface ResolvedAbilities {
  /** Region multipliers that apply to *every* player (GLOBAL_REGION_MULT). */
  globalRegionMult: ByRegion<BasisPoints>;
  /** Region multipliers that apply only to the acting player (REGION_MULT). */
  selfRegionMult: Map<PlayerId, ByRegion<BasisPoints>>;
  /** Post-settlement tax transfers. */
  taxes: TaxDirective[];
}

function ensureSelf(
  map: Map<PlayerId, ByRegion<BasisPoints>>,
  id: PlayerId,
): ByRegion<BasisPoints> {
  let v = map.get(id);
  if (!v) {
    v = neutralTilt();
    map.set(id, v);
  }
  return v;
}

export function resolveAbilities(
  activations: readonly AbilityActivation[],
): ResolvedAbilities {
  const globalRegionMult = neutralTilt();
  const selfRegionMult = new Map<PlayerId, ByRegion<BasisPoints>>();
  const taxes: TaxDirective[] = [];

  for (const act of activations) {
    const def = getAbility(act.abilityId);
    switch (def.kind) {
      case "GLOBAL_REGION_MULT": {
        const region = act.targetRegion;
        if (!region) break;
        globalRegionMult[region] =
          (globalRegionMult[region] * BigInt(def.magnitudeBp)) / BP_ONE;
        break;
      }
      case "REGION_MULT": {
        const region = act.targetRegion;
        if (!region) break;
        const self = ensureSelf(selfRegionMult, act.actorId);
        self[region] = (self[region] * BigInt(def.magnitudeBp)) / BP_ONE;
        break;
      }
      case "TAX": {
        if (!act.targetPlayerId) break;
        taxes.push({
          actorId: act.actorId,
          targetId: act.targetPlayerId,
          bp: BigInt(def.magnitudeBp),
        });
        break;
      }
      case "INFO":
      case "REBALANCE":
        // No settlement-time effect.
        break;
    }
  }

  return { globalRegionMult, selfRegionMult, taxes };
}

/** The ability multiplier for one (player, region) pair: global × self. */
export function abilityMultiplier(
  resolved: ResolvedAbilities,
  playerId: PlayerId,
  region: RegionId,
): BasisPoints {
  const self = resolved.selfRegionMult.get(playerId);
  const selfBp = self ? self[region] : BP_ONE;
  return (resolved.globalRegionMult[region] * selfBp) / BP_ONE;
}
