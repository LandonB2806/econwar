/**
 * The client⇄server wire protocol for multiplayer EconWar.
 *
 * Clients send INTENTS only (join / vote / tilt / allocate / ability). The
 * server is the sole authority: it validates, buffers, settles via the pure
 * engine, and broadcasts a per-client projected view. Clients never send or
 * decide outcomes (golden rule #4).
 *
 * Satang are sent as JS numbers on the wire (max starting capital = 1e8 satang,
 * well within Number.MAX_SAFE_INTEGER) and converted to bigint at the boundary.
 */
import type {
  AbilityId,
  ByRegion,
  Candidate,
  ClientView,
  DepartmentId,
  GamePhaseStep,
  PlayerId,
  RegionId,
  SettlementResult,
} from "@econwar/shared";

/* ----------------------------- client → server ----------------------------- */

export interface JoinMsg {
  t: "join";
  joinCode: string;
  nickname: string;
  department: DepartmentId;
}
export interface VoteMsg {
  t: "vote";
  candidatePlayerId: PlayerId;
}
export interface TiltMsg {
  t: "tilt";
  boostRegion: RegionId | null;
  magnitudeBp: number;
}
export interface AllocateMsg {
  t: "allocate";
  /** satang per region, as numbers. */
  amounts: Record<RegionId, number>;
}
export interface AbilityMsg {
  t: "ability";
  /** null clears any previously submitted ability for this phase. */
  abilityId: AbilityId | null;
  targetPlayerId?: PlayerId;
  targetRegion?: RegionId;
}

export type ClientMsg = JoinMsg | VoteMsg | TiltMsg | AllocateMsg | AbilityMsg;

/* ----------------------------- server → client ----------------------------- */

export interface JoinedMsg {
  t: "joined";
  playerId: PlayerId;
  gameId: string;
  joinCode: string;
}

/** Lobby snapshot before the game starts. */
export interface LobbyMsg {
  t: "lobby";
  joinCode: string;
  players: Array<{ playerId: PlayerId; nickname: string; department: DepartmentId }>;
  started: boolean;
}

/**
 * The authoritative per-client view. `view` is the engine's leak-safe
 * projection (hidden phase type / controller tilt / rivals' allocations are
 * null until settled). The extra fields are non-secret coordination data.
 */
export interface ViewMsg {
  t: "view";
  view: ClientView;
  candidates: Candidate[];
  controllerId: PlayerId | null;
  youAreController: boolean;
  /** Unix ms when the current step auto-closes, or null if untimed. */
  deadline: number | null;
  /** Only present once the phase is settled (else null). */
  settlement: SettlementResult | null;
  leaderboard: Array<{
    playerId: PlayerId;
    nickname: string;
    department: DepartmentId;
    money: number;
    rank: number;
  }>;
  step: GamePhaseStep;
  phaseIndex: number;
  over: boolean;
}

export interface ErrorMsg {
  t: "error";
  message: string;
}

export type ServerMsg = JoinedMsg | LobbyMsg | ViewMsg | ErrorMsg;

/** Convert a wire allocation (numbers) to engine satang (bigint). */
export function amountsToSatang(a: Record<RegionId, number>): ByRegion<bigint> {
  return {
    central: BigInt(Math.trunc(a.central ?? 0)),
    north: BigInt(Math.trunc(a.north ?? 0)),
    south: BigInt(Math.trunc(a.south ?? 0)),
    northeast: BigInt(Math.trunc(a.northeast ?? 0)),
  };
}
