/**
 * @econwar/ai — heuristic department bots for single-player EconWar.
 *
 * Five distinct personalities (one per department, core/01 §6) reason from a
 * simple prior over the hidden phase type to allocate capital, vote for a
 * Market Controller, tilt the market if elected, and spend their ability. Every
 * function is PURE: a decision is a function of an explicit `BotContext` (and an
 * engine `Rng` where randomness is wanted). No globals, no clock, no DOM.
 */
export type {
  BotContext,
  PublicPlayerInfo,
  PhasePrior,
  ControllerChoice,
} from "./types.js";

export { personalityFor, type Personality } from "./personality.js";
export { scoreRegions, scoresToWeights, apportion } from "./score.js";
export {
  decideAllocation,
  decideVote,
  decideControllerTilt,
  decideAbility,
  favouriteRegion,
} from "./bot.js";
