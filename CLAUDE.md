# CLAUDE.md — EconWar

> Project memory for Claude Code. Read this first. It is the authoritative brief.
> Full detail lives in `/docs` (the EconWar_*.md files). This file makes the decisions; the docs explain them.

---

## What EconWar is

A web-first, phase-based **economic-strategy game** for political-science students. Equal starting
capital; each player belongs to one of **5 departments** (each with a Special Ability); players
allocate capital across **Thailand's 4 regions**; the economy moves through **4 hidden phases**; before
each phase the group **votes a Market Controller** who can nudge the economy. After Phase 4, the richest
player wins. **Single-Player vs AI** and **Multiplayer (~260 players)**. Cozy **Stardew Valley** pixel look.

## Visual system

All UI must follow **`DESIGN.md`** (repo root). Before building or editing any screen, load `DESIGN.md`
and obey the **§0 anti-slop contract**. Non-negotiable: the saturated palette (gold = Money, teal =
Political Capital), the fonts (**Pixelify Sans** display / **VT323** figures / **Nunito** body — never
Press Start 2P or Inter), pressed (filled) selected-states with a gold focus ring (never a lazy border),
colorful phase overlays (no grey downturns), and the signature living coin-ledger. `DESIGN.md` overrides
the "slightly desaturated" guidance in `core/03_Art_Direction_Stardew.md`; when impeccable's generic
instinct and `DESIGN.md` disagree, **DESIGN.md wins**.

---

## Committed stack (IGNORE any Godot / C# / Unity / Ink / FMOD references in older agent files)

- **TypeScript** everywhere (engine, client, server).
- **React** + HTML/CSS for UI; **Phaser 3** for the pixel world.
- **Node.js** for the authoritative server/clock; **Supabase** for Postgres + Auth + Realtime broadcast.
- **Zod** for schema validation; **Zustand** for client state.
- **Python** (pandas/numpy) for the offline balance lab only — never shipped.
- **Vitest** (TS) + **pytest** (Python) for tests; **Git** (+LFS) for assets.

---

## Golden rules — NEVER break these

1. **The engine is pure.** `packages/engine` has no React, no Phaser, no Node, no DB, no network, no
   clock. Data in → data out. It runs unchanged in the browser, in Node, and on Deno.
2. **Integer money.** Money is **integer satang** (1 baht = 100 satang). Multipliers are **basis points**
   (`10000 = ×1.0`). Multiply the whole chain in `BigInt`, divide by `10000^5`, **round half-up once at
   the end**: `result = (num + den/2) / den`. No floats in the engine, ever.
3. **Deterministic RNG.** One pinned `mulberry32`, seeded, identical in TS and Python, locked by a
   committed golden vector. No `Math.random()`, no `Date.now()` inside the engine.
4. **Server-authoritative.** Clients send *intents* (vote / allocation / ability). The server alone
   computes outcomes. Clients never decide truth.
5. **Never broadcast raw state.** Send a per-client `ClientView` via `project(state, viewerId)`. The
   hidden `phase.type`, the `controllerTilt`, and rivals' allocations are `null` until `settled === true`.
   A test must fail the build if a pre-SETTLE payload leaks the phase type.
6. **Data-driven content.** Regions, phases, departments, abilities, event deck, and the voting
   constants live in JSON validated by Zod. Tune numbers without code changes.
7. **Tests are the contract.** A shared `golden/settlement_cases.json` runs in both Vitest and pytest;
   any TS/Python divergence fails CI.

---

## Resolved decisions (these were open; they are now closed)

| Decision | Resolution |
|----------|-----------|
| Where the phase clock + authority runs | A **small always-on Node worker** owns the FSM, the countdown timer, calls `settlePhase()` at window close, writes results to Postgres. Supabase provides Postgres + Auth + Realtime broadcast. (Edge Functions/Deno are a viable alt for one-shot settlement, but the long-lived timer lives in Node.) |
| Player identity for 260 students | **Ephemeral join-code + nickname.** No email signups. Use anonymous/room-token sessions. Build the lobby and `players` table for this. |
| Hosting / cost | Supabase **free** for dev + small multiplayer (≤16). The **260-player event needs Pro (~$25/mo, ~500 realtime connections)** — free tier caps at **200 concurrent connections**, below 260. Free tier also pauses after 1 week idle and has no backups; event runs on Pro. |
| Voting mechanic at 260 | **Department-slate voting:** each of the 5 departments fields 1 candidate → ≤5-card ballot. `voteWeight = 1 + min(floor(PC / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES)`. Tie-break: fewer bonus weight → underdog dept → seeded RNG. Constants are config. |
| Agent briefs | The 13 `/agents` briefs are **superseded** by this file + `docs/EconWar_Problem_Resolutions.md §9`. Use the web stack and the ownership table there, not the Godot stack in the briefs. |
| DevOps / hosting / cost owner | **Technical Director** owns it; Producer tracks cost. |

---

## Monorepo layout

```
econwar/
├── packages/
│   ├── engine/          # PURE: settlePhase, factors/, rng.ts, stateMachine.ts, voteTally.ts, pcLedger.ts
│   │   └── test/        # unit + golden tests
│   └── shared/          # types.ts, constants.ts, schema.ts (Zod), content/*.json, project() boundary
├── apps/
│   ├── client/          # React (ui/) + Phaser (scenes/) + net/ + solo/ + store/ + assets/
│   └── server/          # Node worker: rooms/, phaseClock.ts, intake.ts, settle.ts, db/ (Supabase)
├── lab/                 # Python balance sim (never shipped); export_config.py writes shared/content/*.json
└── docs/                # the EconWar_*.md spec set
```

Both `apps/client` (solo) and `apps/server` (multiplayer) `import { settlePhase } from "@econwar/engine"`.
One engine, two callers, zero duplication.

---

## Build order — do these in sequence

1. **Milestone 0 — Engine + shared package (START HERE).** See "First task" below.
2. **Milestone 1 — Single-player vertical slice.** Engine + FSM + heuristic AI bots + placeholder UI,
   no network. Done when you can finish a 4-phase solo game and see a winner. Then stand up a *tiny*
   Python sim to confirm skilled play beats random guessing.
3. **Milestone 2 — Stardew art pass.** Pixel region map, ledger, voting hall, settlement animation.
4. **Milestone 3 — Multiplayer core (8–16).** Node clock worker + Supabase Realtime; server-authoritative.
5. **Milestone 4 — Scale & host mode (~260).** Pro tier, host screen, reconnect backoff, load test.
6. **Milestone 5 — Balance & polish.** Python sims tune caps/curves; sound, juice, tutorial.

---

## ▶ First task (Milestone 0) — build the engine in isolation

Scaffold the monorepo, then in `packages/engine` + `packages/shared`:

1. Types & constants: `GameState`, `PhaseInputs`, `SettlementResult`, `REGIONS`, `PHASES`, `DEPARTMENTS`.
2. `rng.ts` — the pinned `mulberry32` (TS reference in `docs/EconWar_Problem_Resolutions.md §2`).
3. `settlePhase(state, inputs, seed)` — integer/BigInt settlement, fixed factor order
   (`basePhaseEffect → regionalModifier → controllerTilt → randomEvent → abilityEffects`), round-half-up once.
4. Content JSON (`regions/departments/abilities/eventDeck`) + Zod schemas.
5. `golden/settlement_cases.json` + a Vitest suite (and the parallel pytest port in `lab/`).

**Done when:** a test proves `(seed, allocations) → correct portfolio values`, and the TS and Python
golden runs produce identical numbers. Do **not** start UI, art, or networking before this is green.

---

## Conventions

- TypeScript `strict`, ESM modules, named exports.
- Engine functions are pure and total: no exceptions for normal flow, no side effects, no globals.
- Validate every external input (player intents, content JSON) with Zod at the boundary.
- Money is `bigint`/integer satang internally; format to `฿` only at the React display edge.
- Keep Realtime payloads small (per-client diffs) — Supabase messages cap at 256 KB.

## Connectors available

- **Supabase** — schema, Auth, Realtime; use for the DB layer and broadcast.
- **Linear** — the milestone backlog / critical path (Producer).
- **Figma** — the five UI screens + mobile reflow (UI/UX).

## Reference docs (in /docs)

- `EconWar_Architecture_Blueprint.md` — full layered architecture, FSM, data model, rendering.
- `EconWar_Essential_Languages_and_Skills.md` — the stack rationale + learning path.
- `EconWar_Problem_Resolutions.md` — exact engine/RNG/voting/leakage solutions + ownership (§9).
- `EconWar_PreBuild_Review.md` & `EconWar_Readiness_Check_2.md` — the risk registers.
