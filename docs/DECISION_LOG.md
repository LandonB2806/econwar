# EconWar — Decision Log (ADRs)

> Owner: **Producer (role 13)**. ADR-style record of resolved decisions.
> Source of truth: `../CLAUDE.md` ("Resolved decisions" table) and `../docs/EconWar_Problem_Resolutions.md` §9.
> Related: [`ROADMAP.md`](./ROADMAP.md) · [`M1_BACKLOG.md`](./M1_BACKLOG.md) · [`RISK_REGISTER.md`](./RISK_REGISTER.md)
>
> Each entry: **Context / Decision / Status / Consequences.**

---

## ADR-0001 — Committed stack: TypeScript / React / Phaser / Node / Supabase
- **Context:** EconWar is web-first for political-science students, single-architect-directing-AI
  workflow, with a single economy engine that must run identically in the browser (solo) and on a
  server (multiplayer). Multiple older agent files proposed a Godot/C# game stack.
- **Decision:** TypeScript everywhere (engine, client, server); React + HTML/CSS for UI; **Phaser 3**
  for the pixel world; **Node.js** for the authoritative server/clock; **Supabase** for Postgres +
  Auth + Realtime; **Zod** for validation; **Zustand** for client state; **Python** (pandas/numpy)
  for the offline balance lab only (never shipped); **Vitest** + **pytest** for tests; Git (+LFS).
- **Status:** ✅ Accepted (CLAUDE.md). Proven viable — M0 engine built on it and green.
- **Consequences:** One engine, two callers (`apps/client` solo, `apps/server` multiplayer) both
  `import { settlePhase } from "@econwar/engine"` — zero duplication. The engine must stay **pure**
  (no React/Phaser/Node/DB/network/clock). Money is integer satang in `bigint`; basis-point
  multipliers; deterministic mulberry32 RNG. The earlier Godot tech is retired (see ADR-0002).

## ADR-0002 — The 13 Godot/C# agent briefs are superseded for tech (roles retained)
- **Context:** `../politics/AI_Agent_Studio_Framework.md` and the `../agents/*.md` briefs specify a
  Godot 4 + C# + GDScript + Ink + FMOD + SQLite stack for a generic Stardew-scale sim.
- **Decision:** The **roles** (the 13-role studio structure) remain the org model, but their
  **technology** is superseded by ADR-0001's web stack. Use the web stack and the ownership table in
  `../docs/EconWar_Problem_Resolutions.md` §9, not the Godot stack in the briefs.
- **Status:** ✅ Accepted (CLAUDE.md "Resolved decisions" + Golden-rules note to ignore Godot/C#/Unity/Ink/FMOD references).
- **Consequences:** Producer docs map each role to its web-stack equivalent (e.g. UI/UX builds React
  not Godot Control nodes; Gameplay Programmer writes TS/Phaser not C#). The `/agents` briefs are
  kept for role responsibilities only; their "Essential Languages & Tech" sections are obsolete.

## ADR-0003 — Player identity: ephemeral join-code + nickname
- **Context:** A live event with ~260 students; email signups are heavyweight and slow for a
  classroom session.
- **Decision:** **Ephemeral join-code + nickname.** No email signups; anonymous / room-token
  sessions. The lobby and `players` table are built for this model.
- **Status:** ✅ Accepted (CLAUDE.md).
- **Consequences:** Lobby + `players` schema (M3) assumes room-token sessions; no auth-email flows.
  Reconnection (M4) keys off the join-code/room token.

## ADR-0004 — Hosting & cost: Supabase Free for dev, **Pro** for the 260 event
- **Context:** Supabase free tier caps at **200 concurrent connections** (below 260), pauses after
  1 week idle, and has no backups.
- **Decision:** Use Supabase **free** for dev + small multiplayer (≤16). The **260-player event runs
  on Pro (~$25/mo, ~500 realtime connections)**.
- **Status:** ✅ Accepted (CLAUDE.md). Owner: Technical Director owns DevOps/hosting; **Producer
  tracks cost**.
- **Consequences:** M4 must provision Pro ahead of the event; Producer budgets ~$25/mo. The idle
  pause is a risk for the dev/free environment (see [`RISK_REGISTER.md`](./RISK_REGISTER.md)). The
  200-connection cap is the reason the event cannot run on free.

## ADR-0005 — Voting at 260: department-slate voting
- **Context:** A free-form 260-candidate Controller election is intractable to tally and to debate.
- **Decision:** **Department-slate voting** — each of the 5 departments fields 1 candidate → a
  ≤5-card ballot. `voteWeight = 1 + min(floor(PC / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES)`.
  Tie-break: fewer bonus weight → underdog dept → seeded RNG. Constants are config (data-driven).
- **Status:** ✅ Accepted (CLAUDE.md).
- **Consequences:** Ballot is always ≤5 cards regardless of player count. `voteTally` (already in the
  engine) implements the weighting + deterministic tie-break. Voting constants live in content JSON.

## ADR-0006 — Phase clock + authority live in a small always-on Node worker
- **Context:** Multiplayer needs a single source of truth for the phase FSM, the countdown timer,
  and settlement timing. Supabase provides Postgres/Auth/Realtime but not a long-lived timer owner.
- **Decision:** A **small always-on Node worker** owns the FSM + countdown timer, calls
  `settlePhase()` at window close, and writes results to Postgres. Supabase supplies Postgres + Auth
  + Realtime broadcast. (Edge Functions/Deno are a viable alternative for one-shot settlement, but
  the long-lived timer lives in Node.)
- **Status:** ✅ Accepted (CLAUDE.md).
- **Consequences:** M3/M4 stand up this worker. Clients send **intents** only; the server alone
  computes outcomes (server-authoritative). It broadcasts per-client `ClientView` via `project()`,
  never raw state — a build test must fail if a pre-SETTLE payload leaks the phase type.

## ADR-0007 — Build in coordinated disjoint paths, not git worktrees (this session)
- **Context:** Milestone 1 is built by several parallel agents (AI bots, solo runner, balance sim,
  content validator, placeholder client). At the time this work began, the M0 engine was **not yet
  committed**, so git worktrees (which branch off a commit) were not a safe basis for isolation.
- **Decision:** Coordinate the parallel agents by assigning **disjoint file/path ownership**
  (each agent writes only its own package/lane) rather than using git worktrees.
- **Status:** ✅ Accepted (this session, 2026-06-13).
- **Consequences:** Lower merge risk because lanes don't overlap; the Producer's lane is `docs/`
  (Markdown only). Once the engine + packages are committed, future parallel work *can* move to
  worktrees. Cross-package type contracts (M1 T0) must be agreed up front to avoid integration drift.
