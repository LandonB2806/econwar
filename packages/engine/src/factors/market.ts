/**
 * Factors 1 & 2 of the settlement chain:
 *   1. basePhaseEffect(phase, region)   — from phases.json
 *   2. regionalModifier(region, phase)  — from regions.json
 * Both returned as basis-point bigints.
 */
import { getPhase, getRegion } from "@econwar/shared";
import type { BasisPoints, PhaseType, RegionId } from "@econwar/shared";

export function basePhaseEffect(
  phase: PhaseType,
  region: RegionId,
): BasisPoints {
  return BigInt(getPhase(phase).baseEffect[region]);
}

export function regionalModifier(
  region: RegionId,
  phase: PhaseType,
): BasisPoints {
  return BigInt(getRegion(region).modifier[phase]);
}
