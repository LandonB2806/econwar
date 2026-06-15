/**
 * Factor 4 of the settlement chain: the random event.
 *
 * Exactly one event is drawn per phase from the weighted deck using the pinned
 * RNG. The draw is a single nextBelow over the summed weight, so it's
 * reproducible in TS and Python.
 */
import { EVENT_DECK } from "@econwar/shared";
import type { BasisPoints, DrawnEvent, RegionId } from "@econwar/shared";
import { BP_ONE } from "@econwar/shared";
import { Rng } from "../rng.js";

export function drawEvent(rng: Rng): DrawnEvent {
  const total = EVENT_DECK.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng.nextBelow(total);
  for (const e of EVENT_DECK) {
    if (roll < e.weight) {
      return {
        id: e.id,
        name: e.name,
        target: e.target,
        multiplierBp: e.multiplierBp,
      };
    }
    roll -= e.weight;
  }
  // Unreachable if weights sum correctly; fall back to the last entry.
  const last = EVENT_DECK[EVENT_DECK.length - 1]!;
  return {
    id: last.id,
    name: last.name,
    target: last.target,
    multiplierBp: last.multiplierBp,
  };
}

/** The event's basis-point multiplier as it applies to a specific region. */
export function eventMultiplierFor(
  event: DrawnEvent,
  region: RegionId,
): BasisPoints {
  if (event.target === "none") return BP_ONE;
  if (event.target === "all") return BigInt(event.multiplierBp);
  return event.target === region ? BigInt(event.multiplierBp) : BP_ONE;
}
