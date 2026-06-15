# EconWar — Load Test Plan (toward the ~260-player event, M4)

> Owner: **Technical Director** (Producer tracks cost). Validates that the
> server-authoritative runtime survives the live ~260-student event before it happens.
> Source of truth: [`../CLAUDE.md`](../CLAUDE.md) ("Resolved decisions" — Pro tier for 260),
> [`../core/02_Technical_Architecture.md`](../core/02_Technical_Architecture.md) §5.
>
> Related: [`MULTIPLAYER_ARCHITECTURE.md`](./MULTIPLAYER_ARCHITECTURE.md) ·
> [`DECISION_LOG.md`](./DECISION_LOG.md) (ADR-0004) ·
> [`RISK_REGISTER.md`](./RISK_REGISTER.md) (R3 latency, R4 connection cap) ·
> [`ROADMAP.md`](./ROADMAP.md) (M4)

---

## 1. Goal & exit criteria

Prove that **~260 concurrent players** can complete a full 4-phase game with correct,
fair, on-time settlement — **before** the live event. This is the M4 gate.

**Pass when:**
- 260 simulated clients connect and stay connected through 4 phases (no mass drops).
- Every phase settles at its scheduled window close; no settlement is skipped or doubled.
- The connection count stays under the tier's cap with headroom (see §3).
- p95 intent round-trip (submit → ack) is comfortably inside each phase window (§5).
- No Realtime message exceeds the **256 KB** cap; no pre-SETTLE leak (R6) under load.
- The worker stays single-source-of-truth: no client computes outcomes.

## 2. Why this is achievable (and what actually stresses the system)

EconWar is **phase-based, not twitch-action** (R3). There is **no continuous traffic** —
load is bursty and predictable. The stressors are:

1. **Concurrent connection count** — the hard ceiling (R4). Free tier caps at **200
   concurrent Realtime connections**, below 260 → the event needs **Supabase Pro**
   (~500 connections, ~$25/mo, ADR-0004).
2. **Phase-boundary spikes** — at each reveal/vote/allocate/settle transition, up to 260
   clients submit an intent and then 260 broadcasts go out within seconds. Everything else
   is idle waiting. The test must reproduce these **synchronized bursts**, not a smooth
   request rate.
3. **Fan-out at settlement** — the worker `project()`s and broadcasts one `ClientView` per
   viewer. 260 projections + 260 sends per phase is the heaviest CPU/bandwidth moment.

## 3. Connection cap → tier (R4 / ADR-0004)

| Tier | Concurrent Realtime conns | Verdict for 260 |
|------|---------------------------|-----------------|
| Free | **200** | ❌ below 260 — also pauses after 1 week idle, no backups (R5) |
| Pro  | **~500** (~$25/mo) | ✅ run the live event here; ~240 conns of headroom |

Test progression: validate logic on **Free at ≤16** (M3), then load-test on **Pro** at
50 → 130 → 200 → **260** → 300 (overshoot for headroom). Producer provisions Pro ahead of
M4 and de-provisions/down-tiers after the event to control cost.

## 4. Simulated clients (the harness)

- **Headless intent bots, not browsers.** Write a Node/TS load harness that opens N
  Supabase Realtime connections (anon key + a unique ephemeral `session_token` each,
  ADR-0003) and drives the same intent API the real client uses: join → vote → allocate →
  (ability) → receive settled view. No React/Phaser — only the network behavior matters.
- **Reuse the engine's determinism** for self-checking: bots can submit seeded allocations
  and the harness can assert the broadcast `ClientView` matches the expected `settlePhase()`
  output (also catches TS↔engine drift end-to-end).
- **Synchronized bursts:** all bots submit within the phase window, clustered near the start
  and near the deadline (worst case for the worker), to reproduce real spikes — not a steady
  trickle.
- **Jittered latency:** add randomized per-bot delay/latency to mimic 260 real laptops on
  classroom Wi-Fi (R3). Include a slice of "slow" bots that submit near the deadline.
- **Run location:** drive from a machine/region close to the Supabase project to avoid the
  harness's own network being the bottleneck; scale horizontally if one node can't hold 260
  sockets.

## 5. Time-window sizing (latency is a non-issue by design — R3)

Because the game is phase-based, generous windows absorb slow clients instead of punishing
them. Tune per step and confirm under load:

| Step | Suggested window | Rationale |
|------|------------------|-----------|
| indicator_reveal | 10–20 s | read indicators, no input |
| vote | 30–45 s | choose from ≤5 department candidates |
| controller_action | 20–30 s | only the elected controller acts |
| allocation | 60–90 s | the main decision; absorbs latency + slow clients |
| settlement | server-side | worker computes + broadcasts; not a client window |

Sizing rule: a window must exceed **p99 intent round-trip + human decision time** with
margin, so a slow 260th client is never cut off. The load test measures actual p95/p99 and
feeds back into these numbers.

## 6. Metrics to watch

- **Concurrent connections** (vs the 200/500 cap) — the primary ceiling (R4).
- **Intent round-trip latency** p50 / p95 / p99 (submit → server ack), per step.
- **Settlement timing accuracy** — actual settle moment vs scheduled window close; must be
  on time every phase, **exactly once** per phase (no skip/double).
- **Broadcast fan-out latency** — time from `settled=true` to last client receiving its view.
- **Realtime message size** — max bytes per message; must stay **< 256 KB** (per-client diffs).
- **Worker CPU / memory / event-loop lag** at the settlement spike (the fan-out moment).
- **Postgres**: connection pool saturation, write latency on the intent upserts and the
  settlement batch write.
- **Drop / reconnect rate** — connections lost mid-game and successful reconnects (M4 backoff).
- **Correctness under load** — broadcast `ClientView` matches expected `settlePhase()` output;
  **zero pre-SETTLE leaks** of phase type / tilt / rivals' allocations (R6).
- **Cost** — Realtime messages + DB usage on Pro for the event window (Producer tracks).

## 7. Schedule

1. **M3:** logic + leak checks on Free at ≤16 real-ish clients.
2. **M4 ramp (Pro):** 50 → 130 → 200 → 260 → 300 simulated clients, full 4-phase games.
3. **Dress rehearsal:** one end-to-end run at 260 on Pro with production-like windows the
   week before the event; review every §6 metric against §1 exit criteria; re-tune §5
   windows if p99 is tight.
