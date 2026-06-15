# EconWar — ROADMAP (Critical Path, M0 → M5)

> Owner: **Producer (role 13)**. Authoritative source for build order is `../CLAUDE.md`
> ("Build order" + "Resolved decisions" tables) and `../core/04_Build_Roadmap.md`.
> Status as of **2026-06-13**.
>
> Related docs: [`M1_BACKLOG.md`](./M1_BACKLOG.md) · [`DECISION_LOG.md`](./DECISION_LOG.md) · [`RISK_REGISTER.md`](./RISK_REGISTER.md)

## Status at a glance

| Milestone | Title | Status | Owning roles |
|---|---|---|---|
| **M0** | Engine + shared package | ✅ **DONE** | Technical Director, Tools & Data Pipeline Eng., Economy Designer |
| **M1** | Single-player vertical slice | 🟡 **IN PROGRESS** | Gameplay Programmer, Tools & Data Pipeline Eng., UI/UX Designer, Economy Designer, QA & Balance Analyst |
| **M2** | Stardew art pass | ⚪ Not started | Art Director, UI/UX Designer, Gameplay Programmer |
| **M3** | Multiplayer core (8–16) | ⚪ Not started | Technical Director, Gameplay Programmer |
| **M4** | Scale & host mode (~260) | ⚪ Not started | Technical Director, Producer, QA & Balance Analyst |
| **M5** | Balance & polish | ⚪ Not started | Economy Designer, QA & Balance Analyst, Audio Director, UI/UX Designer |

Role names refer to the 13-role studio in `../politics/AI_Agent_Studio_Framework.md`.
**Stack note:** the Godot/C# tech listed in that framework and the `../agents/*` briefs is
**superseded** by the committed TypeScript/React/Phaser/Node/Supabase stack (see
[`DECISION_LOG.md` ADR-0002](./DECISION_LOG.md)). The *roles* still apply; only the tech does not.

---

## The dependency chain (what unblocks what)

```
M0 pure engine (DONE)
      │  @econwar/engine + @econwar/shared, golden TS↔Python parity
      ▼
M1 single-player vertical slice (IN PROGRESS)
      │  AI bots + solo runner + placeholder UI + balance sim + content validator
      │  GATE: finish a 4-phase solo game & see a winner; skilled play beats random
      ▼
M2 Stardew art pass ──────────────┐  (reuses M1 solo loop; swaps placeholders for pixel art)
      │                           │
      ▼                           │
M3 multiplayer core (8–16) <──────┘  (engine is shared verbatim; adds Node clock + Supabase Realtime)
      │  GATE: a real synchronized game for a small group, server-authoritative
      ▼
M4 scale & host mode (~260)
      │  Supabase Pro, host screen, reconnect backoff, load test
      │  GATE: stable at event scale
      ▼
M5 balance & polish
         Python sims tune caps/curves; sound, juice, tutorial
```

Key cross-cuts:
- **The engine is the spine.** Both `apps/client` (solo) and the future `apps/server`
  `import { settlePhase } from "@econwar/engine"` — one engine, two callers (CLAUDE.md). M3 adds
  *no* new economy logic; it wraps the existing engine in an authoritative Node clock.
- **M2 can overlap M3** once the M1 loop is green: art is a presentation swap and does not block
  the server work, which depends only on the engine + a multiplayer transport.
- **Balance (M5) starts early but lands late.** The Python balance sim is built *in M1* (to prove
  skilled > random) and is reused in M5 to tune caps/curves at volume.

---

## Per-milestone goals & exit criteria

### M0 — Engine + shared package ✅ DONE
**Goal:** a pure, deterministic economy engine, testable in isolation.
**Built:** `packages/shared` (types, constants, Zod schemas, content JSON, `project()` anti-leak
boundary) and `packages/engine` (`settlePhase`, `rng.ts` mulberry32, `factors/`, `voteTally`,
`pcLedger`, `stateMachine`); `golden/rng_vector.json` + `golden/settlement_cases.json`; `lab/`
Python port.
**Exit criteria (met):**
- [x] `(seed, allocations) → correct portfolio values` proven by test.
- [x] TS (Vitest) and Python (pytest) golden runs produce **identical** numbers.
- [x] 18 Vitest + 6 pytest tests green; integer/BigInt money, round-half-up once.
- [x] Pre-SETTLE leak test fails the build if phase type / controller tilt / rivals' allocations escape.
**Owners:** Technical Director (engine architecture, RNG, determinism), Tools & Data Pipeline
Engineer (Zod schemas, content JSON, golden vectors), Economy & Progression Designer (factor order
+ values).

### M1 — Single-player vertical slice 🟡 IN PROGRESS
**Goal:** one human + AI bots play one full 4-phase game with no networking, on placeholder UI.
**Scope:** `@econwar/ai` (heuristic bots), `@econwar/solo` (round-loop orchestrator running the five
steps: reveal → vote(mocked) → tilt → allocate+ability → settle), a placeholder React client for
the 5 screens, the Python balance sim, and a content validator. (`packages/ai` and `packages/solo`
are currently scaffolded stubs.)
**Exit criteria (the M1 gate):**
- [ ] A complete solo game runs all 4 phases end-to-end and **declares a winner**.
- [ ] All five round-loop steps execute locally against the real engine (vote mocked is acceptable).
- [ ] AI bots fill the other 4 departments with distinct strategies.
- [ ] Placeholder UI exists for all 5 screens (Lobby/Dept-select, Region Map, Portfolio, Voting Hall, Settlement) — see `../core/03_Art_Direction_Stardew.md` §5.
- [ ] Content validator passes on all `shared/content/*.json`.
- [ ] Python sim shows **skilled play beats random guessing** over many games.
**Owners:** Gameplay Programmer (AI bots + solo runner + UI wiring), UI/UX Designer (5-screen
placeholder IA), Tools & Data Pipeline Engineer (content validator), Economy & Progression Designer
+ QA & Balance Analyst (Python sim + the skilled-beats-random check).
**Detail:** [`M1_BACKLOG.md`](./M1_BACKLOG.md).

### M2 — Stardew art pass ⚪
**Goal:** the solo game *looks* like the target product.
**Scope:** pixel region map (4 districts), wooden-ledger portfolio panel, voting hall, settlement
animation with coin-pop, department banners/mascots, palette + pixel fonts (`../core/03` §1–§5).
**Exit criteria:**
- [ ] Placeholder UI replaced by the pixel look across all 5 screens.
- [ ] Phaser scene + React UI share one palette/font; `image-rendering: pixelated`, integer scaling.
- [ ] Designed at a fixed virtual resolution (prepares mobile reflow per `../core/04`).
**Owners:** Art Director (style/palette/assets), UI/UX Designer (frames + reflow), Gameplay
Programmer (Phaser integration).

### M3 — Multiplayer core (8–16) ⚪
**Goal:** a real synchronized multiplayer game for a small group.
**Scope:** the always-on **Node worker** that owns the phase FSM + countdown timer + calls
`settlePhase()` at window close + writes to Postgres; Supabase Postgres/Auth/Realtime broadcast;
ephemeral join-code + nickname identity + lobby + `players` table; server-authoritative intake of
intents (vote/allocation/ability); per-client `ClientView` via `project()` (never raw state).
**Exit criteria:**
- [ ] 8–16 players play a full synchronized 4-phase game.
- [ ] Server alone computes outcomes; clients send only intents.
- [ ] No pre-SETTLE leak over the wire (the `project()` boundary holds on the network path).
- [ ] Realtime payloads stay under the 256 KB Supabase message cap (per-client diffs).
**Owners:** Technical Director (Node clock worker, DB schema, authority), Gameplay Programmer
(client net layer + reconnection plumbing).

### M4 — Scale & host mode (~260) ⚪
**Goal:** a stable event-scale game.
**Scope:** Supabase **Pro** for the event (free tier caps at 200 concurrent connections, below 260,
and pauses after 1 week idle); facilitator/host screen (phase timer + global leaderboard); generous
time windows; reconnect backoff; load test with simulated clients; department-slate voting
(≤5-card ballot, weighted by PC) to keep the 260-vote tally tractable.
**Exit criteria:**
- [ ] Load test sustains ~260 simulated clients through a full game without dropping the clock.
- [ ] Host screen shows live leaderboard + phase timer.
- [ ] Allocation/voting windows are generous enough that latency doesn't punish slower players.
- [ ] Provisioned on Pro for the event (Producer tracks the ~$25/mo cost).
**Owners:** Technical Director (scale + reconnect + load test), Producer (Pro provisioning + cost),
QA & Balance Analyst (simulated-client load harness).

### M5 — Balance & polish ⚪
**Goal:** a balanced, fun, event-ready game.
**Scope:** Python Monte-Carlo sims over thousands of games to tune ability caps, PC rates, and
controller-tilt bounds (exported to `shared/content/*.json` — no code changes); sound + juice;
tutorial. Directly retires the open design risks in `../core/01` §10.
**Exit criteria:**
- [ ] No single department/ability dominates across sims; controller can't trivially snowball.
- [ ] Tuned constants live in content JSON (data-driven), validated by Zod.
- [ ] Audio + onboarding tutorial in place.
**Owners:** Economy & Progression Designer + QA & Balance Analyst (sims + tuning), Audio Director
(sound), UI/UX Designer (tutorial/onboarding).

---

## Mobile (prepare from day 1, ship later)
Per `../core/04`: design at a fixed virtual resolution, keep a responsive React shell (single-column
reflow), use touch-first interactions (sliders/taps, large targets). The phase-based design makes
latency a non-issue, so the eventual port is mostly CSS + input handling, optionally wrapped as a
PWA. No dedicated milestone — baked into M1/M2 layout decisions.
