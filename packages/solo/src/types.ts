/**
 * Public types for the single-player orchestrator.
 */
import type {
  AbilityActivation,
  ByRegion,
  Candidate,
  DepartmentId,
  GamePhaseStep,
  GameState,
  PhaseType,
  PlayerId,
  PlayerState,
  Satang,
  SettlementResult,
} from "@econwar/shared";
import type { ControllerChoice } from "@econwar/engine";

/** Options for creating a solo game. */
export interface SoloGameOptions {
  /** Deterministic game seed. Same seed + same human intents → same game. */
  seed: number;
  /** The single human seat. */
  human: { nickname: string; department: DepartmentId };
  /**
   * Which departments the AI fills. Defaults to all 4 departments the human did
   * not pick (so the game always seats all 5 departments). If provided, the
   * human's department is removed from the list automatically.
   */
  botDepartments?: DepartmentId[];
}

/** A single row of the live leaderboard. */
export interface LeaderboardRow {
  playerId: PlayerId;
  nickname: string;
  department: DepartmentId;
  money: Satang;
  pc: number;
  rank: number;
}

export type {
  AbilityActivation,
  ByRegion,
  Candidate,
  ControllerChoice,
  GamePhaseStep,
  GameState,
  PhaseType,
  PlayerId,
  PlayerState,
  Satang,
  SettlementResult,
};
