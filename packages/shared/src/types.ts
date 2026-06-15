/**
 * EconWar shared types. These are the data contracts crossing the engine
 * boundary. Money is integer satang carried as `bigint`. Basis points are
 * carried as `bigint` too, so the engine never touches a float.
 */

export type Satang = bigint;
export type BasisPoints = bigint;

export type RegionId = "central" | "north" | "south" | "northeast";
export type PhaseType = "boom" | "recession" | "recovery" | "slowdown";
export type DepartmentId =
  | "government"
  | "ir"
  | "sociology"
  | "public_admin"
  | "politics_global";

export type AbilityId =
  | "gov_tax"
  | "ir_peek"
  | "soc_marketmove"
  | "pa_rebalance"
  | "pg_foresight";

export type AbilityKind =
  | "TAX"
  | "GLOBAL_REGION_MULT"
  | "REGION_MULT"
  | "INFO"
  | "REBALANCE";

export type EventTarget = RegionId | "all" | "none";

export const REGION_IDS: readonly RegionId[] = [
  "central",
  "north",
  "south",
  "northeast",
];

export const PHASE_TYPES: readonly PhaseType[] = [
  "boom",
  "recession",
  "recovery",
  "slowdown",
];

export type PlayerId = string;

/** A per-region map. Helper alias to keep signatures readable. */
export type ByRegion<T> = Record<RegionId, T>;

/* ---------- Content (data-driven, validated by Zod) ---------- */

export interface RegionDef {
  id: RegionId;
  name: string;
  nameTh: string;
  character: string;
  /** regionalModifier(region, phase) in basis points. */
  modifier: Record<PhaseType, number>;
}

export interface PhaseDef {
  type: PhaseType;
  theme: string;
  /** basePhaseEffect(phase, region) in basis points. */
  baseEffect: ByRegion<number>;
}

export interface DepartmentDef {
  id: DepartmentId;
  name: string;
  nameTh: string;
  color: string;
  playStyle: string;
  abilityId: AbilityId;
  /** PC earned at end of each phase. */
  pcRate: Record<PhaseType, number>;
}

export interface AbilityDef {
  id: AbilityId;
  department: DepartmentId;
  name: string;
  kind: AbilityKind;
  pcCost: number;
  magnitudeBp: number;
  needsTargetPlayer: boolean;
  needsTargetRegion: boolean;
  description: string;
}

export interface EventDef {
  id: string;
  name: string;
  target: EventTarget;
  multiplierBp: number;
  weight: number;
}

export interface Content {
  regions: RegionDef[];
  phases: PhaseDef[];
  departments: DepartmentDef[];
  abilities: AbilityDef[];
  events: EventDef[];
}

/* ---------- Runtime game state ---------- */

export interface PlayerState {
  id: PlayerId;
  nickname: string;
  department: DepartmentId;
  /** Net worth in satang. */
  money: Satang;
  /** Political Capital (integer). */
  pc: number;
}

export type GamePhaseStep =
  | "lobby"
  | "indicator_reveal"
  | "vote"
  | "controller_action"
  | "allocation"
  | "settlement"
  | "game_over";

export interface GameState {
  id: string;
  mode: "solo" | "multi";
  seed: number;
  /** 0-based index of the current phase (0..PHASES_PER_GAME-1). */
  phaseIndex: number;
  /** The shuffled, hidden phase order for this game. */
  phaseOrder: PhaseType[];
  step: GamePhaseStep;
  players: PlayerState[];
  /** Player id of the elected Market Controller for the current phase, if any. */
  controllerId: PlayerId | null;
  /** True once the current phase has been settled (gates what project() reveals). */
  settled: boolean;
}

/* ---------- Inputs to settlePhase ---------- */

export interface AbilityActivation {
  actorId: PlayerId;
  abilityId: AbilityId;
  targetPlayerId?: PlayerId;
  targetRegion?: RegionId;
}

/**
 * Everything settlePhase needs for one phase. The server/FSM builds this from
 * collected player intents; the engine treats it as already-validated data.
 */
export interface PhaseInputs {
  /** The true (hidden until SETTLE) phase type. */
  phaseType: PhaseType;
  /** Per-player capital placed into each region (satang). */
  allocations: Record<PlayerId, ByRegion<Satang>>;
  /** Controller tilt per region in basis points (10000 = neutral). */
  controllerTilt: ByRegion<BasisPoints>;
  /** Who the controller is (for the transparency penalty). */
  controllerId: PlayerId | null;
  /** Abilities activated this phase. */
  abilities: AbilityActivation[];
}

/* ---------- Output of settlePhase ---------- */

export interface RegionResult {
  allocated: Satang;
  finalValue: Satang;
}

export interface PlayerSettlement {
  playerId: PlayerId;
  startMoney: Satang;
  regionResults: ByRegion<RegionResult>;
  /** Capital left in cash (not allocated to any region). */
  unallocated: Satang;
  /** Sum of region final values + unallocated, before tax transfers. */
  grossAfterMarket: Satang;
  taxPaid: Satang;
  taxReceived: Satang;
  endMoney: Satang;
  pcStart: number;
  pcSpent: number;
  pcEarned: number;
  pcEnd: number;
}

export interface DrawnEvent {
  id: string;
  name: string;
  target: EventTarget;
  multiplierBp: number;
}

export interface SettlementResult {
  seed: number;
  phaseType: PhaseType;
  event: DrawnEvent;
  players: PlayerSettlement[];
  /** Player ids sorted by endMoney desc, tie-broken by id asc. */
  leaderboard: PlayerId[];
}

/* ---------- Voting ---------- */

export interface Vote {
  voterId: PlayerId;
  candidateId: PlayerId;
  /** PC of the voter at the moment of voting (drives bonus weight). */
  voterPc: number;
}

export interface Candidate {
  playerId: PlayerId;
  department: DepartmentId;
}

export interface VoteResult {
  winnerId: PlayerId;
  tally: Record<PlayerId, number>;
  /** Audit trail of how the winner was chosen (for transparency). */
  tieBreak: "none" | "fewer_bonus" | "underdog_dept" | "seeded_rng";
}

/* ---------- Per-client projection (anti-leak boundary) ---------- */

/**
 * What a single client is allowed to see. Hidden truth (phase type, controller
 * tilt, rivals' allocations) is `null` until `settled === true`.
 */
export interface ClientView {
  gameId: string;
  viewerId: PlayerId;
  phaseIndex: number;
  step: GamePhaseStep;
  settled: boolean;
  /** Hidden until settled. */
  phaseType: PhaseType | null;
  /** Hidden until settled. */
  controllerTilt: ByRegion<BasisPoints> | null;
  /** Public player info (money + dept). */
  players: Array<{
    id: PlayerId;
    nickname: string;
    department: DepartmentId;
    money: Satang;
    pc: number;
  }>;
  /** Only the viewer's own allocation; rivals' are null until settled. */
  ownAllocation: ByRegion<Satang> | null;
  /** Everyone's allocation, only after settlement. */
  allAllocations: Record<PlayerId, ByRegion<Satang>> | null;
}
