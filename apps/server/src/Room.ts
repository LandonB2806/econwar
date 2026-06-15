/**
 * Room — the server-authoritative multiplayer game (one game = one room).
 *
 * The Room owns the GameState and the round-loop FSM. Clients send INTENTS; the
 * Room validates, buffers, and at each step close computes the single truth via
 * the pure engine, then broadcasts a per-client projected view through
 * `project()` so hidden info (phase type, controller tilt, rivals' allocations)
 * never leaks before settlement (golden rules #4 + #5).
 *
 * Many players share the 5 departments (department-slate voting): each phase one
 * representative per department is the controller candidate. Empty departments
 * can be filled by AI bots so the slate always has 5 candidates.
 *
 * The Room has NO timer of its own — `closeStep()` is called by the phase clock
 * (live) or directly by tests (deterministic). This keeps the engine boundary
 * pure and the Room fully testable without wall-clock time.
 */
import {
  CONTENT,
  REGION_IDS,
  getAbility,
  project,
} from "@econwar/shared";
import type {
  AbilityActivation,
  ByRegion,
  Candidate,
  DepartmentId,
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
import type { Transport, ClientId } from "./transport/Transport.js";
import {
  amountsToSatang,
  type ServerMsg,
  type ViewMsg,
} from "./protocol.js";
import type { ClientMsg } from "./protocol.js";
import { parseClientMessage } from "./intake.js";

const ALL_DEPARTMENTS: readonly DepartmentId[] = [
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
];

export interface RoomConfig {
  joinCode: string;
  seed: number;
  /** ms windows per timed step (used by the live clock; tests ignore). */
  windowMs?: { vote: number; controller: number; allocation: number };
  /** Fill departments that have no human with an AI bot. Default true. */
  aiFillEmptyDepartments?: boolean;
}

interface Intents {
  votes: Map<PlayerId, PlayerId>;
  tilt: ByRegion<bigint> | null;
  allocations: Map<PlayerId, ByRegion<Satang>>;
  abilities: AbilityActivation[];
}

const freshIntents = (): Intents => ({
  votes: new Map(),
  tilt: null,
  allocations: new Map(),
  abilities: [],
});

interface Seat {
  playerId: PlayerId;
  clientId: ClientId | null; // null for bots
  nickname: string;
  department: DepartmentId;
  isBot: boolean;
}

export class Room {
  readonly joinCode: string;
  private readonly seed: number;
  private readonly aiFill: boolean;

  private state: GameState | null = null;
  private readonly seats = new Map<PlayerId, Seat>();
  private readonly clientToPlayer = new Map<ClientId, PlayerId>();
  private intents = freshIntents();
  private lastSettlement: SettlementResult | null = null;
  private candidateCache = new Map<number, Candidate[]>();
  private deadline: number | null = null;
  private nextPlayerNum = 1;

  constructor(
    private readonly transport: Transport,
    config: RoomConfig,
  ) {
    this.joinCode = config.joinCode;
    this.seed = config.seed;
    this.aiFill = config.aiFillEmptyDepartments ?? true;

    transport.onMessage((c, raw) => this.onRaw(c, raw));
    transport.onDisconnect((c) => this.onDisconnect(c));
  }

  /* ------------------------------ inbound ------------------------------ */

  private onRaw(clientId: ClientId, raw: unknown): void {
    const parsed = parseClientMessage(raw);
    if (!parsed.ok) {
      this.transport.send(clientId, { t: "error", message: parsed.error });
      return;
    }
    try {
      this.handle(clientId, parsed.msg);
    } catch (err) {
      this.transport.send(clientId, {
        t: "error",
        message: err instanceof Error ? err.message : "internal error",
      });
    }
  }

  private handle(clientId: ClientId, msg: ClientMsg): void {
    switch (msg.t) {
      case "join":
        this.handleJoin(clientId, msg.nickname, msg.department);
        return;
      case "vote":
        this.recordVote(clientId, msg.candidatePlayerId);
        return;
      case "tilt":
        this.recordTilt(clientId, {
          boostRegion: msg.boostRegion,
          magnitudeBp: msg.magnitudeBp,
        });
        return;
      case "allocate":
        this.recordAllocation(clientId, amountsToSatang(msg.amounts));
        return;
      case "ability":
        this.recordAbility(clientId, msg);
        return;
    }
  }

  /* ------------------------------- lobby ------------------------------- */

  /** A human joins during the lobby. Returns the assigned playerId. */
  handleJoin(
    clientId: ClientId,
    nickname: string,
    department: DepartmentId,
  ): PlayerId {
    if (this.state) {
      this.transport.send(clientId, {
        t: "error",
        message: "game already started",
      });
      return "";
    }
    const playerId = `p${this.nextPlayerNum++}`;
    this.seats.set(playerId, {
      playerId,
      clientId,
      nickname: nickname.trim() || playerId,
      department,
      isBot: false,
    });
    this.clientToPlayer.set(clientId, playerId);
    this.transport.send(clientId, {
      t: "joined",
      playerId,
      gameId: `solo_${this.seed}`,
      joinCode: this.joinCode,
    });
    this.broadcastLobby();
    return playerId;
  }

  private broadcastLobby(): void {
    const players = [...this.seats.values()].map((s) => ({
      playerId: s.playerId,
      nickname: s.nickname,
      department: s.department,
    }));
    this.transport.broadcast({
      t: "lobby",
      joinCode: this.joinCode,
      players,
      started: this.state !== null,
    });
  }

  /** Begin the game: seat AI bots for empty departments, then open phase 0. */
  start(): void {
    if (this.state) return;
    if (this.aiFill) {
      const present = new Set([...this.seats.values()].map((s) => s.department));
      for (const dept of ALL_DEPARTMENTS) {
        if (!present.has(dept)) {
          const playerId = `p${this.nextPlayerNum++}`;
          this.seats.set(playerId, {
            playerId,
            clientId: null,
            nickname: `${dept} bot`,
            department: dept,
            isBot: true,
          });
        }
      }
    }

    const specs: NewPlayerSpec[] = [...this.seats.values()].map((s) => ({
      id: s.playerId,
      nickname: s.nickname,
      department: s.department,
    }));
    this.state = createGame(`game_${this.seed}`, "multi", this.seed, specs);
    // lobby → indicator_reveal
    this.state = advance(this.state);
    this.openStepWindow();
    this.broadcastViews();
  }

  /* --------------------------- intent recording --------------------------- */

  private requireRunningPlayer(clientId: ClientId): PlayerState {
    if (!this.state) throw new Error("game not started");
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId) throw new Error("not joined");
    const p = this.state.players.find((pl) => pl.id === playerId);
    if (!p) throw new Error("unknown player");
    return p;
  }

  private recordVote(clientId: ClientId, candidatePlayerId: PlayerId): void {
    const p = this.requireRunningPlayer(clientId);
    if (this.state!.step !== "vote") throw new Error("not the voting step");
    const candidates = this.candidatesForPhase();
    if (!candidates.some((c) => c.playerId === candidatePlayerId)) {
      throw new Error("not a valid candidate");
    }
    this.intents.votes.set(p.id, candidatePlayerId);
    this.sendView(clientId);
    this.maybeAutoClose();
  }

  private recordTilt(clientId: ClientId, choice: ControllerChoice): void {
    const p = this.requireRunningPlayer(clientId);
    if (this.state!.step !== "controller_action")
      throw new Error("not the controller step");
    if (this.state!.controllerId !== p.id)
      throw new Error("you are not the controller");
    this.intents.tilt = deriveControllerTilt(choice);
    this.sendView(clientId);
    this.maybeAutoClose();
  }

  private recordAllocation(
    clientId: ClientId,
    amounts: ByRegion<Satang>,
  ): void {
    const p = this.requireRunningPlayer(clientId);
    if (this.state!.step !== "allocation")
      throw new Error("not the allocation step");
    let sum = 0n;
    for (const r of REGION_IDS) {
      const v = amounts[r];
      if (v < 0n) throw new Error(`allocation for ${r} is negative`);
      sum += v;
    }
    if (sum > p.money) throw new Error("allocation exceeds available money");
    this.intents.allocations.set(p.id, { ...amounts });
    this.sendView(clientId);
    this.maybeAutoClose();
  }

  private recordAbility(
    clientId: ClientId,
    msg: Extract<ClientMsg, { t: "ability" }>,
  ): void {
    const p = this.requireRunningPlayer(clientId);
    if (this.state!.step !== "allocation")
      throw new Error("abilities are chosen during allocation");
    // remove any prior ability from this actor
    this.intents.abilities = this.intents.abilities.filter(
      (a) => a.actorId !== p.id,
    );
    if (msg.abilityId === null) {
      this.sendView(clientId);
      return;
    }
    const def = getAbility(msg.abilityId);
    if (def.department !== p.department)
      throw new Error("ability does not belong to your department");
    if (p.pc < def.pcCost) throw new Error("not enough PC");
    const act: AbilityActivation = { actorId: p.id, abilityId: msg.abilityId };
    if (msg.targetPlayerId !== undefined) act.targetPlayerId = msg.targetPlayerId;
    if (msg.targetRegion !== undefined) act.targetRegion = msg.targetRegion;
    this.intents.abilities.push(act);
    this.sendView(clientId);
  }

  /* ------------------------------ the FSM ------------------------------ */

  /** True once every connected human has submitted what this step needs. */
  private allHumansReady(): boolean {
    if (!this.state) return false;
    const humans = [...this.seats.values()].filter((s) => !s.isBot);
    switch (this.state.step) {
      case "vote":
        return humans.every((s) => this.intents.votes.has(s.playerId));
      case "allocation":
        return humans.every((s) => this.intents.allocations.has(s.playerId));
      case "controller_action": {
        const cid = this.state.controllerId;
        // Only the human controller needs to act; others wait on the clock.
        const controllerSeat = cid ? this.seats.get(cid) : undefined;
        if (!controllerSeat || controllerSeat.isBot) return true;
        return this.intents.tilt !== null;
      }
      default:
        return false;
    }
  }

  private maybeAutoClose(): void {
    if (this.allHumansReady()) this.closeStep();
  }

  /**
   * Close the current step: run bots + fill defaults, advance the FSM, settle on
   * entering settlement, then broadcast. Called by the clock at the deadline or
   * early when all humans are ready.
   */
  closeStep(): void {
    if (!this.state) return;
    switch (this.state.step) {
      case "indicator_reveal":
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
        this.runSettlement(); // settle on ENTER so views can reveal results
        break;
      case "settlement":
        this.state = advance(this.state); // → next reveal or game_over
        this.intents = freshIntents();
        this.candidateCache.clear();
        break;
      case "game_over":
        return;
    }
    this.openStepWindow();
    this.broadcastViews();
  }

  /** Set the auto-close deadline for the new step (live clock reads this). */
  private openStepWindow(): void {
    if (!this.state) {
      this.deadline = null;
      return;
    }
    const ms = this.windowMs[this.state.step] ?? 0;
    this.deadline = ms > 0 ? Date.now() + ms : null;
  }

  /** Deadline for the current step (Unix ms), or null if untimed. */
  getDeadline(): number | null {
    return this.deadline;
  }

  /** Per-step auto-close windows in ms (0 = no auto-close). */
  private readonly windowMs: Record<string, number> = {
    indicator_reveal: 8000,
    vote: 30000,
    controller_action: 20000,
    allocation: 60000,
    settlement: 12000,
    game_over: 0,
    lobby: 0,
  };

  /* ------------------------------ internals ------------------------------ */

  private get s(): GameState {
    if (!this.state) throw new Error("no game state");
    return this.state;
  }

  private bots(): PlayerState[] {
    return this.s.players.filter((p) => this.seats.get(p.id)?.isBot);
  }

  private publicInfo(): PublicPlayerInfo[] {
    return this.s.players.map((p) => ({
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
      phaseIndex: this.s.phaseIndex,
      candidates: this.candidatesForPhase(),
      players: this.publicInfo(),
    };
  }

  /** One controller candidate per department: the dept's richest seat (id tie-break). */
  private candidatesForPhase(): Candidate[] {
    const cached = this.candidateCache.get(this.s.phaseIndex);
    if (cached) return cached;
    const byDept = new Map<DepartmentId, PlayerState>();
    for (const p of this.s.players) {
      const cur = byDept.get(p.department);
      if (
        !cur ||
        p.money > cur.money ||
        (p.money === cur.money && p.id < cur.id)
      ) {
        byDept.set(p.department, p);
      }
    }
    const candidates = [...byDept.values()]
      .map((p) => ({ playerId: p.id, department: p.department }))
      .sort((a, b) => (a.playerId < b.playerId ? -1 : 1));
    this.candidateCache.set(this.s.phaseIndex, candidates);
    return candidates;
  }

  private runVote(): void {
    const candidates = this.candidatesForPhase();
    for (const bot of this.bots()) {
      if (!this.intents.votes.has(bot.id)) {
        this.intents.votes.set(bot.id, decideVote(this.botContext(bot)));
      }
    }
    // Humans who didn't vote default to their own department's candidate.
    for (const seat of this.seats.values()) {
      if (seat.isBot || this.intents.votes.has(seat.playerId)) continue;
      const own = candidates.find((c) => c.department === seat.department);
      this.intents.votes.set(
        seat.playerId,
        own?.playerId ?? candidates[0]?.playerId ?? seat.playerId,
      );
    }
    const votes: Vote[] = [];
    for (const [voterId, candidateId] of this.intents.votes) {
      const voter = this.s.players.find((p) => p.id === voterId);
      if (!voter) continue;
      votes.push({ voterId, candidateId, voterPc: voter.pc });
    }
    const result = tallyVotes(
      votes,
      candidates,
      phaseSeed(this.seed, this.s.phaseIndex),
    );
    this.state = { ...this.s, controllerId: result.winnerId };
  }

  private runControllerAction(): void {
    const controllerId = this.s.controllerId;
    if (!controllerId) {
      this.intents.tilt = neutralTilt();
      return;
    }
    const seat = this.seats.get(controllerId);
    if (seat?.isBot) {
      const bot = this.s.players.find((p) => p.id === controllerId)!;
      this.intents.tilt = deriveControllerTilt(
        decideControllerTilt(this.botContext(bot)),
      );
      return;
    }
    // Human controller: use submitted tilt or neutral if they didn't act in time.
    if (!this.intents.tilt) this.intents.tilt = neutralTilt();
  }

  private runAllocation(): void {
    const rng = makeRng(phaseSeed(this.seed, this.s.phaseIndex));
    for (const bot of this.bots()) {
      const ctx = this.botContext(bot);
      if (!this.intents.allocations.has(bot.id)) {
        this.intents.allocations.set(bot.id, decideAllocation(ctx, rng));
      }
      const ability = decideAbility(ctx, rng);
      if (ability && !this.intents.abilities.some((a) => a.actorId === bot.id)) {
        this.intents.abilities.push(ability);
      }
    }
    // Humans who didn't allocate keep everything in cash.
    for (const seat of this.seats.values()) {
      if (seat.isBot || this.intents.allocations.has(seat.playerId)) continue;
      const zero = {} as ByRegion<Satang>;
      for (const r of REGION_IDS) zero[r] = 0n;
      this.intents.allocations.set(seat.playerId, zero);
    }
  }

  private runSettlement(): void {
    const allocations: Record<PlayerId, ByRegion<Satang>> = {};
    for (const [id, alloc] of this.intents.allocations) allocations[id] = alloc;
    const result = settlePhase(
      this.s,
      {
        phaseType: currentPhaseType(this.s),
        allocations,
        controllerTilt: this.intents.tilt ?? neutralTilt(),
        controllerId: this.s.controllerId,
        abilities: this.intents.abilities,
      },
      phaseSeed(this.seed, this.s.phaseIndex),
    );
    const byId = new Map(result.players.map((ps) => [ps.playerId, ps]));
    const players = this.s.players.map((p) => {
      const ps = byId.get(p.id);
      return ps ? { ...p, money: ps.endMoney, pc: ps.pcEnd } : p;
    });
    this.state = { ...this.s, players, settled: true };
    this.lastSettlement = result;
  }

  /* ----------------------------- projection ----------------------------- */

  private projectionData() {
    const allocations: Record<PlayerId, ByRegion<Satang>> = {};
    for (const [id, alloc] of this.intents.allocations) allocations[id] = alloc;
    return { allocations, controllerTilt: this.intents.tilt };
  }

  private viewFor(playerId: PlayerId): ViewMsg {
    const state = this.s;
    const view = project(state, playerId, this.projectionData());
    const leaderboard = [...state.players]
      .sort((a, b) =>
        a.money !== b.money
          ? a.money > b.money
            ? -1
            : 1
          : a.id < b.id
            ? -1
            : 1,
      )
      .map((p, i) => ({
        playerId: p.id,
        nickname: p.nickname,
        department: p.department,
        money: Number(p.money),
        rank: i + 1,
      }));
    return {
      t: "view",
      view,
      candidates: this.candidatesForPhase(),
      controllerId: state.controllerId,
      youAreController: state.controllerId === playerId,
      deadline: this.deadline,
      settlement: state.settled ? this.lastSettlement : null,
      leaderboard,
      step: state.step,
      phaseIndex: state.phaseIndex,
      over: state.step === "game_over",
    };
  }

  private sendView(clientId: ClientId): void {
    const playerId = this.clientToPlayer.get(clientId);
    if (!playerId || !this.state) return;
    this.transport.send(clientId, this.viewFor(playerId));
  }

  private broadcastViews(): void {
    if (!this.state) return;
    for (const [clientId, playerId] of this.clientToPlayer) {
      this.transport.send(clientId, this.viewFor(playerId));
    }
  }

  private onDisconnect(clientId: ClientId): void {
    // Keep the seat (intents/holdings persist) so the player can reconnect;
    // just drop the live mapping. Reconnect support is a M4 concern.
    this.clientToPlayer.delete(clientId);
  }

  /* ------------------------------ accessors ------------------------------ */

  getState(): GameState | null {
    return this.state;
  }
  /** Number of human (non-bot) seats currently joined. */
  humanCount(): number {
    return [...this.seats.values()].filter((s) => !s.isBot).length;
  }
  /** Has the game started (GameState created)? */
  started(): boolean {
    return this.state !== null;
  }
  getStep(): string {
    return this.state?.step ?? "lobby";
  }
  isOver(): boolean {
    return this.state?.step === "game_over";
  }
  getLastSettlement(): SettlementResult | null {
    return this.lastSettlement;
  }
  /** Build the projected view for a player (used by tests). */
  debugViewFor(playerId: PlayerId): ViewMsg {
    return this.viewFor(playerId);
  }
}
