# EconWar — Risk Register

> Owner: **Producer (role 13)**. Sources: `../core/01_Game_Design_Spec.md` §10 (open design risks)
> and `../CLAUDE.md` ("Resolved decisions" — hosting/scale constraints).
> Related: [`ROADMAP.md`](./ROADMAP.md) · [`DECISION_LOG.md`](./DECISION_LOG.md) · [`M1_BACKLOG.md`](./M1_BACKLOG.md)
>
> Scale: Likelihood / Impact ∈ {Low, Med, High}. Reviewed each milestone exit.

| # | Risk | Likelihood | Impact | Owner | Surfaces in |
|---|---|---|---|---|---|
| R1 | Ability balance — powerful abilities dominate | High | High | Economy Designer / QA | M1 sim, M5 |
| R2 | Controller dominance — one player snowballs | Med | High | Lead Systems / Economy Designer | M3, M5 |
| R3 | 260-scale fairness — latency punishes slow players | Med | High | Technical Director / QA | M4 |
| R4 | Realtime connection cap (free tier < 260) | High | High | Technical Director / Producer | M4 |
| R5 | Free-tier idle pause / no backups | Med | Med | Technical Director | dev + M3 |
| R6 | Pre-SETTLE state leak over the wire | Low | High | Technical Director | M3, M4 |
| R7 | TS↔Python engine divergence | Low | High | Technical Director / Tools Eng. | all (CI) |
| R8 | M1 integration drift across parallel lanes | Med | Med | Producer / Gameplay Programmer | M1 |
| R9 | Skilled play fails to beat random (shallow game) | Med | High | Economy Designer / QA | M1 gate |

---

## R1 — Ability balance
- **Detail:** "Move the whole market" (Sociology) and "tax a rival's gains" (Government) are strong;
  without numeric caps + PC costs they can warp every game (`../core/01` §10.1).
- **Mitigation:** Caps + PC costs live in content JSON (data-driven, tunable without code). The M1
  Python sim (M1 T5) and the M5 Monte-Carlo sims measure per-ability win-rate; tune until no
  ability dominates. Abilities resolve **last** in the fixed factor order, bounding their reach.

## R2 — Controller dominance
- **Detail:** The voted Market Controller could rig the market for themselves and snowball
  (`../core/01` §10.2, §7 guardrails).
- **Mitigation:** Bounded tilt magnitude; the Controller cannot fully zero-out other regions; a
  transparency penalty on the Controller's own holdings; re-election pressure every phase
  (only 4 phases caps any single reign). Tilt bounds are config; tuned in M5.

## R3 — 260-scale fairness / latency
- **Detail:** With 260 players, a too-short allocation/voting window punishes slower or
  higher-latency players (`../core/01` §10.3).
- **Mitigation:** Generous, phase-based time windows (no fast input needed — latency is a non-issue
  by design); server-authoritative settlement at window close; load test with simulated clients in
  M4 before the live event.

## R4 — Realtime connection cap
- **Detail:** Supabase free tier caps at **200 concurrent connections** — below 260 (CLAUDE.md).
- **Mitigation:** Run the event on **Supabase Pro** (~500 connections, ~$25/mo) per
  [ADR-0004](./DECISION_LOG.md). Producer provisions Pro ahead of M4 and tracks cost. Keep Realtime
  payloads under the 256 KB message cap via per-client diffs.

## R5 — Free-tier idle pause / no backups
- **Detail:** Free tier pauses after 1 week idle and has no backups (CLAUDE.md).
- **Mitigation:** Acceptable for dev/small multiplayer; the event runs on Pro (ADR-0004). Keep
  content/config in Git (source of truth), so a paused dev DB loses no authored data. Schedule Pro
  provisioning so the event DB is never on a pausable tier.

## R6 — Pre-SETTLE state leak over the wire
- **Detail:** Broadcasting raw state would expose hidden `phase.type`, `controllerTilt`, and rivals'
  allocations before `settled === true` — breaking the core hidden-information game (Golden rule 5).
- **Mitigation:** Never broadcast raw state — only per-client `ClientView` via `project(state,
  viewerId)`. A build test already fails if a pre-SETTLE payload leaks the phase type; extend that
  test to the network path in M3.

## R7 — TS↔Python engine divergence
- **Detail:** The balance lab (Python) and the shipped engine (TS) could drift, invalidating tuning.
- **Mitigation:** Shared `golden/settlement_cases.json` + `golden/rng_vector.json` run in both Vitest
  and pytest; any divergence fails CI (Golden rule 7). Already green at M0.

## R8 — M1 integration drift across parallel lanes
- **Detail:** Parallel agents own disjoint paths ([ADR-0007](./DECISION_LOG.md)); mismatched type
  contracts between bots / solo runner / client could cause integration pain at M1 T6.
- **Mitigation:** Agree the shared M1 type surface up front (M1 T0) reusing `shared/types.ts`; no
  duplicated engine types; `tsc --build` gate; converge early at the T6 integration step.

## R9 — Skilled play fails to beat random
- **Detail:** If informed allocation/voting doesn't reliably beat random guessing, the game lacks
  depth — and M1's exit gate fails.
- **Mitigation:** The M1 Python sim (T5) explicitly tests skilled-beats-random over many games; if
  it fails, treat it as a design signal and revisit indicator legibility / region differentiation /
  ability value before declaring M1 done. This is a **hard gate**, not a nice-to-have.
