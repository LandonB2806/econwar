/**
 * Factor 3 of the settlement chain: the Market Controller's tilt.
 *
 * The controller picks one region to boost and (optionally) a magnitude. This
 * helper turns that bounded *choice* into a per-region basis-point vector that
 * settlePhase consumes. The bounds (MAX_TILT_BP, dampening) are config, so the
 * controller can never zero-out other regions (anti-abuse guardrail).
 */
import {
  BP_ONE,
  MARKET_TILT_DAMPEN_BP,
  MAX_TILT_BP,
  REGION_IDS,
} from "@econwar/shared";
import type { BasisPoints, ByRegion, RegionId } from "@econwar/shared";

export interface ControllerChoice {
  /** Region to boost, or null for a neutral term. */
  boostRegion: RegionId | null;
  /** Requested boost in basis points; clamped to [0, MAX_TILT_BP]. */
  magnitudeBp: number;
}

function clampMagnitude(mag: number): bigint {
  if (mag <= 0) return 0n;
  const m = BigInt(Math.floor(mag));
  return m > MAX_TILT_BP ? MAX_TILT_BP : m;
}

/** Neutral tilt: every region at x1.0. */
export function neutralTilt(): ByRegion<BasisPoints> {
  return {
    central: BP_ONE,
    north: BP_ONE,
    south: BP_ONE,
    northeast: BP_ONE,
  };
}

/**
 * Build the bounded tilt vector. The chosen region gets +magnitude; the others
 * are dampened by MARKET_TILT_DAMPEN_BP (never below it — they can't be zeroed).
 */
export function deriveControllerTilt(
  choice: ControllerChoice,
): ByRegion<BasisPoints> {
  const tilt = neutralTilt();
  if (!choice.boostRegion) return tilt;

  const mag = clampMagnitude(choice.magnitudeBp);
  for (const r of REGION_IDS) {
    if (r === choice.boostRegion) {
      tilt[r] = BP_ONE + mag;
    } else {
      tilt[r] = BP_ONE - MARKET_TILT_DAMPEN_BP;
    }
  }
  return tilt;
}
