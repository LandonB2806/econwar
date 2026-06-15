/**
 * Zustand store: the single source of truth for the placeholder client.
 *
 * It owns a live `SoloGame` instance (from @econwar/solo) and a "Next"-button
 * step driver. The UI submits human intents (vote / controller tilt / allocation
 * / ability) BEFORE stepping past that step; bots auto-play inside `game.step()`.
 *
 * `version` is a render-tick: the SoloGame mutates internally, so we bump a
 * counter on every action to force React to re-read its getters.
 */
import { create } from "zustand";
import { createSoloGame } from "@econwar/solo";
import type { SoloGame, LeaderboardRow } from "@econwar/solo";
import type {
  AbilityActivation,
  ByRegion,
  Candidate,
  DepartmentId,
  GamePhaseStep,
  PlayerState,
  RegionId,
  Satang,
  SettlementResult,
} from "@econwar/shared";

/**
 * The Market Controller's bounded choice. Structurally identical to the
 * engine's `ControllerChoice` (the only shape `submitControllerTilt` accepts),
 * declared locally so the UI never imports engine internals.
 */
export interface ControllerChoice {
  boostRegion: RegionId | null;
  magnitudeBp: number;
}

export type Screen = "lobby" | "game";

interface StartArgs {
  nickname: string;
  department: DepartmentId;
  seed?: number;
}

interface GameStore {
  screen: Screen;
  game: SoloGame | null;
  /** Render-tick — bump to force re-render after the mutable game changes. */
  version: number;

  // ---- lifecycle ----
  start: (args: StartArgs) => void;
  reset: () => void;
  next: () => void;

  // ---- human intents (proxy to SoloGame) ----
  submitVote: (candidateId: string) => void;
  submitControllerTilt: (choice: ControllerChoice) => void;
  submitAllocation: (amounts: ByRegion<Satang>) => void;
  submitAbility: (act: AbilityActivation | null) => void;

  // ---- read-through getters (safe even before a game exists) ----
  getStep: () => GamePhaseStep;
  getPhaseIndex: () => number;
  getHuman: () => PlayerState | null;
  getPlayers: () => readonly PlayerState[];
  getCandidates: () => readonly Candidate[];
  getControllerId: () => string | null;
  isHumanController: () => boolean;
  getLastSettlement: () => SettlementResult | null;
  getLeaderboard: () => LeaderboardRow[];
  isOver: () => boolean;
  getWinner: () => PlayerState | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: "lobby",
  game: null,
  version: 0,

  start: ({ nickname, department, seed }) => {
    const game = createSoloGame({
      seed: seed ?? Math.floor(Math.random() * 1_000_000),
      human: { nickname: nickname.trim() || "You", department },
    });
    // Open phase 0: lobby → indicator_reveal.
    game.step();
    set({ game, screen: "game", version: get().version + 1 });
  },

  reset: () => set({ game: null, screen: "lobby", version: get().version + 1 }),

  next: () => {
    const { game } = get();
    if (!game) return;
    game.step();
    set({ version: get().version + 1 });
  },

  submitVote: (candidateId) => {
    get().game?.submitVote(candidateId);
    set({ version: get().version + 1 });
  },
  submitControllerTilt: (choice) => {
    get().game?.submitControllerTilt(choice);
    set({ version: get().version + 1 });
  },
  submitAllocation: (amounts) => {
    get().game?.submitAllocation(amounts);
    set({ version: get().version + 1 });
  },
  submitAbility: (act) => {
    get().game?.submitAbility(act);
    set({ version: get().version + 1 });
  },

  getStep: () => get().game?.getStep() ?? "lobby",
  getPhaseIndex: () => get().game?.getPhaseIndex() ?? 0,
  getHuman: () => get().game?.getHuman() ?? null,
  getPlayers: () => get().game?.getPlayers() ?? [],
  getCandidates: () => get().game?.getCandidates() ?? [],
  getControllerId: () => get().game?.getControllerId() ?? null,
  isHumanController: () => get().game?.isHumanController() ?? false,
  getLastSettlement: () => get().game?.getLastSettlement() ?? null,
  getLeaderboard: () => get().game?.getLeaderboard() ?? [],
  isOver: () => get().game?.isOver() ?? false,
  getWinner: () => get().game?.getWinner() ?? null,
}));

export const ALL_REGIONS: readonly RegionId[] = [
  "central",
  "north",
  "south",
  "northeast",
];
