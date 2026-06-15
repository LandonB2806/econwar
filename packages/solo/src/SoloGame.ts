/**
 * SoloGame — the single-player orchestrator (the heart of Milestone 1).
 *
 * Runs one full 4-phase solo game: 1 human seat + AI bots filling the remaining
 * departments (always 5 departments total). It drives the engine's pure FSM
 * through the five-step round loop per phase (core/01 §3):
 *
 *   indicator_reveal → vote → controller_action → allocation → settlement
 *
 * then advances to the next phase, or to game_over after phase 4.
 *
 * Determinism: every random choice flows from the engine `Rng`, seeded from the
 * game seed + phase index via `phaseSeed`. The same seed and the same sequence
 * of human intents always produce the same final leaderboard. No globals, no
 * clock, no DOM, no network — just the mutable GameState held in this instance.
 *
 * ### Usage (for the UI agent)
 * ```ts
 * const game = createSoloGame({
 *   seed: 1234,
 *   human: { nickname: "You", department: "politics_global" },
 * });
 * while (!game.isOver()) {
 *   const step = game.getStep();
 *   if (step === "vote") game.submitVote(myCandidateId);
 *   if (step === "controller_action" && game.isHumanController())
 *     game.submitControllerTilt({ boostRegion: "central", magnitudeBp: 2000 });
 *   if (step === "allocation") {
 *     game.submitAllocation(myAmounts);
 *     game.submitAbility(myAbilityOrNull);
 *   }
 *   game.step(); // runs bots for this step + advances the FSM one step
 * }
 * const winner = game.getWinner();
 * ```
 * Submitting an intent is optional: if the human leaves a step's intent unset,
 * the orchestrator falls back to a safe default (abstain-equivalent vote for the
 * human's own/first candidate, neutral tilt, all-cash allocation, no ability),
 * so the loop can always make progress.
 */
import {
  PHASES_PER_GAME,
  REGION_IDS,
  getAbility,
} from "@econwar/shared";
import type {
  AbilityActivation,
  ByRegion,
  Candidate,
  DepartmentId,
  GamePhaseStep,
  GameState,
  PlayerId,
  PlayerState,
  Satang,
  SettlementResult,
  Vote,
} from "@econwar/shared";
import {
  advance,
  createGame,
  currentPhaseType,
  deriveControllerTilt,
  makeRng,
  neutralTilt,
  phaseSeed,
  settlePhase,
  tallyVotes,
  type ControllerChoice,
  type NewPlayerSpec,
} from "@econwar/engine";
import {
  decideAbility,
  decideAllocation,
  decideControllerTilt,
  decideVote,
  type BotContext,
  type PublicPlayerInfo,
} from "@econwar/ai";
import type { LeaderboardRow, SoloGameOptions } from "./types.js";

const ALL_DEPARTMENTS: readonly DepartmentId[] = [
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
];

const HUMAN_ID = "p_human";

/** Per-phase intents collected before settlement. */
interface PhaseIntents {
  votes: Map<PlayerId, PlayerId>; // voter → candidate
  tilt: ByRegion<bigint> | null; // resolved controller tilt (null = neutral)
  allocations: Map<PlayerId, ByRegion<Satang>>;
  abilities: AbilityActivation[];
}

function freshIntents(): PhaseIntents {
  return {
    votes: new Map(),
    tilt: null,
    allocations: new Map(),
    abilities: [],
  };
}

export class SoloGame {
  private state: GameState;
  private readonly humanId: PlayerId;
  private intents: PhaseIntents = freshIntents();
  private lastSettlement: SettlementResult | null = null;
  private readonly candidatesByPhase = new Map<number, Candidate[]>();

  constructor(opts: SoloGameOptions) {
    const humanDept = opts.human.department;
    const botDepts = (
      opts.botDepartments ?? ALL_DEPARTMENTS.filter((d) => d !== humanDept)
    ).filter((d) => d !== humanDept);

    const specs: NewPlayerSpec[] = [
      { id: HUMAN_ID, nickname: opts.human.nickname, department: humanDept },
      ...botDepts.map((d) => ({
        id: `p_bot_${d}`,
        nickname: `${d} bot`,
        department: d,
      })),
    ];

    this.humanId = HUMAN_ID;
    this.state = createGame(
      `solo_${opts.seed}`,
      "solo",
      opts.seed,
      specs,
    );
    // Leave the FSM in `lobby`; the first step() opens phase 0.
  }

  /* ----------------------------- getters ----------------------------- */

  /** The full mutable game state (read-only by convention for the UI). */
  getState(): GameState {
    return this.state;
  }

  /** The current round-loop step. */
  getStep(): GamePhaseStep {
    return this.state.step;
  }

  /** 0-based current phase index (0..PHASES_PER_GAME-1). */
  getPhaseIndex(): number {
    return this.state.phaseIndex;
  }

  /** All player states (human + bots). */
  getPlayers(): readonly PlayerState[] {
    return this.state.players;
  }

  /** The human player's state. */
  getHuman(): PlayerState {
    return this.player(this.humanId);
  }

  /** The controller-election candidate slate for the current phase. */
  getCandidates(): readonly Candidate[] {
    return this.candidatesForCurrentPhase();
  }

  /** The most recent settlement result, or null before any phase settles. */
  getLastSettlement(): SettlementResult | null {
    return this.lastSettlement;
  }

  /** The live leaderboard (money desc, id asc), with ranks. */
  getLeaderboard(): LeaderboardRow[] {
    const rows = [...this.state.players].sort((a, b) => {
      if (a.money !== b.money) return a.money > b.money ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    });
    return rows.map((p, i) => ({
      playerId: p.id,
      nickname: p.nickname,
      department: p.department,
      money: p.money,
      pc: p.pc,
      rank: i + 1,
    }));
  }

  /** True once the game has ended (after phase 4 settlement). */
  isOver(): boolean {
    return this.state.step === "game_over";
  }

  /** The winning player (top of the leaderboard), or null until the game ends. */
  getWinner(): PlayerState | null {
    if (!this.isOver()) return null;
    const top = this.getLeaderboard()[0];
    return top ? this.player(top.playerId) : null;
  }

  /** The elected controller for the current phase, or null before the vote. */
  getControllerId(): PlayerId | null {
    return this.state.controllerId;
  }

  /** Is the human the elected controller this phase? */
  isHumanController(): boolean {
    return this.state.controllerId === this.humanId;
  }

  /* --------------------------- human intents --------------------------- */

  /** Record the human's controller vote (only meaningful during `vote`). */
  submitVote(candidateId: PlayerId): void {
    this.intents.votes.set(this.humanId, candidateId);
  }

  /**
   * Record the human's controller tilt. Only valid when the human is the
   * elected controller during `controller_action`; throws otherwise so UI bugs
   * surface loudly.
   */
  submitControllerTilt(choice: ControllerChoice): void {
    if (!this.isHumanController()) {
      throw new Error("submitControllerTilt: the human is not the controller");
    }
    this.intents.tilt = deriveControllerTilt(choice);
  }

  /**
   * Record the human's per-region allocation. The amounts must each be >= 0 and
   * sum to at most the human's available money; throws otherwise.
   */
  submitAllocation(amounts: ByRegion<Satang>): void {
    const money = this.getHuman().money;
    let sum = 0n;
    for (const r of REGION_IDS) {
      const v = amounts[r];
      if (v < 0n) throw new Error(`allocation for ${r} is negative`);
      sum += v;
    }
    if (sum > money) {
      throw new Error(
        `allocation total ${sum} exceeds available money ${money}`,
      );
    }
    this.intents.allocations.set(this.humanId, { ...amounts });
  }

  /**
   * Record the human's ability for this phase (or clear it with null). Throws
   * if the activation is malformed or the human cannot afford it.
   */
  submitAbility(act: AbilityActivation | null): void {
    // Drop any prior human ability for this phase.
    this.intents.abilities = this.intents.abilities.filter(
      (a) => a.actorId !== this.humanId,
    );
    if (!act) return;
    if (act.actorId !== this.humanId) {
      throw new Error("submitAbility: actorId must be the human player");
    }
    const def = getAbility(act.abilityId);
    if (def.department !== this.getHuman().department) {
      throw new Error("submitAbility: ability does not belong to your dept");
    }
    if (this.getHuman().pc < def.pcCost) {
      throw new Error("submitAbility: not enough PC");
    }
    this.intents.abilities.push(act);
  }

  /* --------------------------- the step driver --------------------------- */

  /** Alias for {@link step}. */
  advanceStep(): GamePhaseStep {
    return this.step();
  }

  /**
   * Run the bots for the current step, apply the human's intents (or defaults),
   * advance the FSM one step, and return the new step. Calling this repeatedly
   * runs the whole game to completion.
   */
  step(): GamePhaseStep {
    switch (this.state.step) {
      case "lobby":
        this.state = advance(this.state); // → indicator_reveal
        break;

      case "indicator_reveal":
        // Nothing to collect; indicators are derived/displayed by the UI.
        this.state = advance(this.state); // → vote
        break;

      case "vote":
        this.runVote();
        this.state = advance(this.state); // → controller_action
        break;

      case "controller_action":
        this.runControllerAction();
        this.state = advance(this.state); // → allocation
        break;

      case "allocation":
        this.runAllocation();
        this.state = advance(this.state); // → settlement
        // Settle immediately on ENTERING settlement so the UI's settlement
        // screen (step === "settlement") can read getLastSettlement(). The
        // result + revaluation are applied here; stepping out of settlement
        // only advances the phase.
        this.runSettlement();
        break;

      case "settlement":
        // Results were computed on entry (in the allocation case). advance()
        // rolls into the next phase's indicator_reveal or game_over, clearing
        // controllerId + settled for us.
        this.state = advance(this.state);
        this.intents = freshIntents();
        break;

      case "game_over":
        break;
    }
    return this.state.step;
  }

  /* ------------------------------ internals ------------------------------ */

  private player(id: PlayerId): PlayerState {
    const p = this.state.players.find((pl) => pl.id === id);
    if (!p) throw new Error(`unknown player ${id}`);
    return p;
  }

  private bots(): PlayerState[] {
    return this.state.players.filter((p) => p.id !== this.humanId);
  }

  private publicInfo(): PublicPlayerInfo[] {
    return this.state.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      department: p.department,
      money: p.money,
      pc: p.pc,
    }));
  }

  private botContext(self: PlayerState): BotContext {
    return {
      self,
      phaseIndex: this.state.phaseIndex,
      candidates: this.candidatesForCurrentPhase(),
      players: this.publicInfo(),
    };
  }

  /** One candidate per department: the (sole) seat holder of that department. */
  private candidatesForCurrentPhase(): Candidate[] {
    const cached = this.candidatesByPhase.get(this.state.phaseIndex);
    if (cached) return cached;
    const candidates: Candidate[] = this.state.players
      .map((p) => ({ playerId: p.id, department: p.department }))
      .sort((a, b) => (a.playerId < b.playerId ? -1 : 1));
    this.candidatesByPhase.set(this.state.phaseIndex, candidates);
    return candidates;
  }

  private phaseRng() {
    return makeRng(phaseSeed(this.state.seed, this.state.phaseIndex));
  }

  private runVote(): void {
    // Bots decide their votes deterministically from public info.
    for (const bot of this.bots()) {
      const v = decideVote(this.botContext(bot));
      this.intents.votes.set(bot.id, v);
    }
    // Human default: vote for own-dept candidate (self), else first candidate.
    const candidates = this.candidatesForCurrentPhase();
    if (!this.intents.votes.has(this.humanId)) {
      const fallback =
        candidates.find((c) => c.playerId === this.humanId)?.playerId ??
        candidates[0]?.playerId ??
        this.humanId;
      this.intents.votes.set(this.humanId, fallback);
    }

    const votes: Vote[] = [];
    for (const [voterId, candidateId] of this.intents.votes) {
      votes.push({ voterId, candidateId, voterPc: this.player(voterId).pc });
    }
    const seed = phaseSeed(this.state.seed, this.state.phaseIndex);
    const result = tallyVotes(votes, candidates, seed);
    this.state = { ...this.state, controllerId: result.winnerId };
  }

  private runControllerAction(): void {
    const controllerId = this.state.controllerId;
    if (!controllerId) {
      this.intents.tilt = neutralTilt();
      return;
    }
    if (controllerId === this.humanId) {
      // Use the human's submitted tilt, or neutral if they didn't act.
      if (!this.intents.tilt) this.intents.tilt = neutralTilt();
      return;
    }
    // A bot controls the market: derive its tilt from its personality.
    const bot = this.player(controllerId);
    const choice = decideControllerTilt(this.botContext(bot));
    this.intents.tilt = deriveControllerTilt(choice);
  }

  private runAllocation(): void {
    const rng = this.phaseRng();
    // Bots allocate + (optionally) fire abilities.
    for (const bot of this.bots()) {
      const ctx = this.botContext(bot);
      this.intents.allocations.set(bot.id, decideAllocation(ctx, rng));
      const ability = decideAbility(ctx, rng);
      if (ability) this.intents.abilities.push(ability);
    }
    // Human default: keep everything in cash (all-zero allocation) if unset.
    if (!this.intents.allocations.has(this.humanId)) {
      const zero = {} as ByRegion<Satang>;
      for (const r of REGION_IDS) zero[r] = 0n;
      this.intents.allocations.set(this.humanId, zero);
    }
  }

  private runSettlement(): void {
    const allocations: Record<PlayerId, ByRegion<Satang>> = {};
    for (const [id, alloc] of this.intents.allocations) {
      allocations[id] = alloc;
    }
    const result = settlePhase(
      this.state,
      {
        phaseType: currentPhaseType(this.state),
        allocations,
        controllerTilt: this.intents.tilt ?? neutralTilt(),
        controllerId: this.state.controllerId,
        abilities: this.intents.abilities,
      },
      phaseSeed(this.state.seed, this.state.phaseIndex),
    );

    // Write results back into the players (money = endMoney, pc = pcEnd).
    const byId = new Map(result.players.map((ps) => [ps.playerId, ps]));
    const players = this.state.players.map((p) => {
      const ps = byId.get(p.id);
      if (!ps) return p;
      return { ...p, money: ps.endMoney, pc: ps.pcEnd };
    });
    this.state = { ...this.state, players, settled: true };
    this.lastSettlement = result;
  }
}

export const PHASES = PHASES_PER_GAME;
