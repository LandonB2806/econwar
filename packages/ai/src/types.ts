/**
 * Public types for the heuristic AI bots.
 *
 * Bots are PURE: every decision is a function of an explicit `BotContext` plus
 * (where randomness is wanted) an `Rng` drawn from the engine. No globals, no
 * clock, no DOM. The same context + same rng → the same decision, always.
 */
import type {
  AbilityActivation,
  ByRegion,
  Candidate,
  DepartmentId,
  PhaseType,
  PlayerId,
  PlayerState,
  Satang,
} from "@econwar/shared";
import type { ControllerChoice } from "@econwar/engine";

/** Minimal public snapshot of a rival the bot is allowed to reason about. */
export interface PublicPlayerInfo {
  id: PlayerId;
  nickname: string;
  department: DepartmentId;
  /** Net worth in satang (public). */
  money: Satang;
  /** Political Capital (public). */
  pc: number;
}

/**
 * Everything a bot needs to make one decision. Built by the orchestrator from
 * the (non-leaking) public game state — never from hidden truth such as the
 * real phase type or the controller tilt.
 */
export interface BotContext {
  /** The bot's own full player state (it may see its own money + PC). */
  self: PlayerState;
  /** 0-based index of the current phase (0..PHASES_PER_GAME-1). */
  phaseIndex: number;
  /** The candidate slate for the controller election this phase. */
  candidates: readonly Candidate[];
  /** Public info for every player (including, harmlessly, the bot itself). */
  players: readonly PublicPlayerInfo[];
}

/** A bot's belief about which phase is coming, as integer weights (sum > 0). */
export type PhasePrior = Record<PhaseType, number>;

export type { ControllerChoice };
export type { AbilityActivation, ByRegion };
