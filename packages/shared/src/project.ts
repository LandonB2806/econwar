/**
 * project(state, viewerId, ...) — the ONLY way state should reach a client.
 *
 * Golden rule #5: never broadcast raw state. Hidden truth (phase type,
 * controller tilt, rivals' allocations) stays `null` until `settled === true`.
 * A leak test in @econwar/engine must fail the build if a pre-SETTLE payload
 * exposes any of these.
 */
import type {
  ByRegion,
  ClientView,
  GameState,
  PlayerId,
  Satang,
} from "./types.js";

export interface ProjectionData {
  /** Per-player allocation for the current phase (server-held truth). */
  allocations: Record<PlayerId, ByRegion<Satang>>;
  /** Controller tilt for the current phase (server-held truth). */
  controllerTilt: ByRegion<Satang> | null;
}

export function project(
  state: GameState,
  viewerId: PlayerId,
  data: ProjectionData,
): ClientView {
  const settled = state.settled;

  const players = state.players.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    department: p.department,
    money: p.money,
    pc: p.pc,
  }));

  const ownAllocation = data.allocations[viewerId] ?? null;

  return {
    gameId: state.id,
    viewerId,
    phaseIndex: state.phaseIndex,
    step: state.step,
    settled,
    // Hidden until settled:
    phaseType: settled ? (state.phaseOrder[state.phaseIndex] ?? null) : null,
    controllerTilt: settled
      ? (data.controllerTilt as ByRegion<bigint> | null)
      : null,
    players,
    // A viewer may always see their own allocation; rivals' only after settle.
    ownAllocation,
    allAllocations: settled ? data.allocations : null,
  };
}
