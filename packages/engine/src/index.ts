/**
 * Public surface of @econwar/engine — the PURE game core.
 * No React, no Phaser, no Node, no DB, no network, no clock.
 * One engine, two callers (apps/client solo + apps/server multiplayer).
 */
export { settlePhase } from "./settlePhase.js";
export { tallyVotes } from "./voteTally.js";
export { pcEarned, applyPcDelta, canAfford } from "./pcLedger.js";
export {
  createGame,
  advance,
  shufflePhaseOrder,
  isFinalPhase,
  currentPhaseType,
} from "./stateMachine.js";
export type { NewPlayerSpec } from "./stateMachine.js";

export { Rng, makeRng, phaseSeed } from "./rng.js";

export { basePhaseEffect, regionalModifier } from "./factors/market.js";
export { drawEvent, eventMultiplierFor } from "./factors/event.js";
export {
  deriveControllerTilt,
  neutralTilt,
  type ControllerChoice,
} from "./factors/controller.js";
export {
  resolveAbilities,
  abilityMultiplier,
  type ResolvedAbilities,
  type TaxDirective,
} from "./factors/ability.js";
