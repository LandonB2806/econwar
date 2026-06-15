/**
 * The phase finite-state machine. Pure transitions only — the long-lived clock
 * that *drives* these transitions lives in the Node worker (apps/server), never
 * in the engine. These functions just compute the next valid state.
 *
 * Round loop per phase:
 *   indicator_reveal → vote → controller_action → allocation → settlement
 * then advance to the next phase, or game_over after PHASES_PER_GAME.
 */
import { PHASES_PER_GAME, STARTING_CAPITAL_SATANG } from "@econwar/shared";
import type {
  DepartmentId,
  GamePhaseStep,
  GameState,
  PhaseType,
  PlayerState,
} from "@econwar/shared";
import { PHASE_TYPES } from "@econwar/shared";
import { makeRng } from "./rng.js";

/** Deterministic Fisher-Yates shuffle of the 4 phase types from a seed. */
export function shufflePhaseOrder(seed: number): PhaseType[] {
  const order = [...PHASE_TYPES];
  const rng = makeRng(seed);
  for (let i = order.length - 1; i > 0; i--) {
    const j = rng.nextBelow(i + 1);
    const tmp = order[i]!;
    order[i] = order[j]!;
    order[j] = tmp;
  }
  return order;
}

export interface NewPlayerSpec {
  id: string;
  nickname: string;
  department: DepartmentId;
}

export function createGame(
  id: string,
  mode: "solo" | "multi",
  seed: number,
  playerSpecs: readonly NewPlayerSpec[],
): GameState {
  const players: PlayerState[] = playerSpecs.map((spec) => ({
    id: spec.id,
    nickname: spec.nickname,
    department: spec.department,
    money: STARTING_CAPITAL_SATANG,
    pc: 0,
  }));

  return {
    id,
    mode,
    seed,
    phaseIndex: 0,
    phaseOrder: shufflePhaseOrder(seed),
    step: "lobby",
    players,
    controllerId: null,
    settled: false,
  };
}

const STEP_FLOW: Record<GamePhaseStep, GamePhaseStep> = {
  lobby: "indicator_reveal",
  indicator_reveal: "vote",
  vote: "controller_action",
  controller_action: "allocation",
  allocation: "settlement",
  // settlement is handled specially (advance phase or end); see advance().
  settlement: "settlement",
  game_over: "game_over",
};

/** Is this the final phase of the game? */
export function isFinalPhase(state: GameState): boolean {
  return state.phaseIndex >= PHASES_PER_GAME - 1;
}

/**
 * Advance the state machine one step. From `settlement`, either roll into the
 * next phase's `indicator_reveal` (clearing controller + settled flag) or end
 * the game.
 */
export function advance(state: GameState): GameState {
  if (state.step === "settlement") {
    if (isFinalPhase(state)) {
      return { ...state, step: "game_over" };
    }
    return {
      ...state,
      phaseIndex: state.phaseIndex + 1,
      step: "indicator_reveal",
      controllerId: null,
      settled: false,
    };
  }
  return { ...state, step: STEP_FLOW[state.step] };
}

/** The true (hidden) phase type for the current phase index. */
export function currentPhaseType(state: GameState): PhaseType {
  return state.phaseOrder[state.phaseIndex]!;
}
