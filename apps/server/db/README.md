# EconWar — Database (`apps/server/db`)

> Owner: **Technical Director**. The Postgres schema + RLS for EconWar's multiplayer
> (Supabase = Postgres + Auth + Realtime). Money is integer **satang** (`BIGINT`),
> basis points are integers — never floats (CLAUDE.md Golden rule #2).
>
> Related: [`schema.sql`](./schema.sql) · [`rls.sql`](./rls.sql) ·
> [`../../../docs/MULTIPLAYER_ARCHITECTURE.md`](../../../docs/MULTIPLAYER_ARCHITECTURE.md) ·
> [`../../../docs/LOAD_TEST_PLAN.md`](../../../docs/LOAD_TEST_PLAN.md) ·
> [`../../../docs/DECISION_LOG.md`](../../../docs/DECISION_LOG.md) (ADR-0003/0004/0006) ·
> [`../../../docs/RISK_REGISTER.md`](../../../docs/RISK_REGISTER.md) (R4/R5/R6)

## Files

| File | What it does |
|------|--------------|
| `schema.sql` | Tables, enums, PKs/FKs, indexes, CHECK constraints, `updated_at` trigger. |
| `rls.sql`    | Row-Level Security: client (anon) vs server (service_role) split + the anti-leak rule. Apply **after** `schema.sql`. |

## Tables (and key FKs)

```
games (1) ──< players ──< allocations >── phases (each phase belongs to a game)
                     │                 │
                     ├──< votes >───────┤   (votes.candidate_player_id -> players)
                     ├──< abilities_used (target_player_id -> players)
                     └──< results        events >── phases
```

- `players.game_id -> games.id`
- `phases.game_id -> games.id`, `phases.controller_player_id -> players.id`
- `allocations.player_id -> players.id`, `allocations.phase_id -> phases.id`
- `votes.phase_id -> phases.id`, `votes.voter_id -> players.id`, `votes.candidate_player_id -> players.id`
- `abilities_used.player_id -> players.id`, `abilities_used.phase_id -> phases.id`, `abilities_used.target_player_id -> players.id`
- `events.phase_id -> phases.id`
- `results.game_id -> games.id`, `results.player_id -> players.id`

All `on delete cascade` from `games`/`players`/`phases` so tearing down a finished
game removes its children cleanly; player/region back-references that are merely
informational use `on delete set null`.

## How to apply (Supabase migration)

These are plain Postgres DDL files; apply them in order. Pick one path.

**A. Supabase CLI (recommended — versioned migrations)**
```bash
supabase init                      # once, if not already
supabase link --project-ref <ref>  # link to your project
# copy schema then rls into a timestamped migration (schema first, rls second):
supabase migration new econwar_schema   # paste schema.sql into the generated file
supabase migration new econwar_rls      # paste rls.sql into the generated file
supabase db push                        # applies pending migrations
```

**B. Direct psql (dev / one-off)**
```bash
psql "$DATABASE_URL" -f apps/server/db/schema.sql
psql "$DATABASE_URL" -f apps/server/db/rls.sql
```

**C. Supabase SQL editor** — paste `schema.sql`, run; then `rls.sql`, run.

Order matters: `rls.sql` references tables/columns created by `schema.sql`.

## Connection model & the role split

EconWar is **server-authoritative** (Golden rule #4, ADR-0006). Two distinct
connection identities hit the database:

| Identity | Key | Who | RLS | Can do |
|----------|-----|-----|-----|--------|
| **Player client** | `anon` (Supabase anon key) | The browser | **Enforced** | Read own game's public data; read **own** intents always and rivals' only after settle; write **own** allocation/vote/ability while the phase is open; rename self. |
| **Server worker** | `service_role` key | The always-on Node phase-clock worker | **Bypassed** | Owns the FSM + countdown; writes the hidden phase `type`/`controller_tilt`, draws `events`, runs `settlePhase()`, flips `settled`, writes `results`. The only writer of truth. |

- The **service_role key never ships to the browser.** It lives only in the Node
  worker's server-side env. Leaking it would bypass RLS entirely.
- The **player's `session_token`** (ephemeral, ADR-0003) is how RLS answers
  "who is *me*?". Before running a client's query, the worker (or the client via
  Supabase, with the token bound) sets a transaction-local GUC:
  ```sql
  select set_config('econwar.session_token', '<token>', true);
  ```
  `current_player_id()` / `current_game_id()` read that GUC. No email, no
  long-lived auth — the token is the room/session credential.

## The anti-leak rule at the DB layer (Golden rule #5)

The hidden phase `type`, the `controller_tilt`, and **rivals' allocations / votes /
abilities** must not be readable before `phases.settled = true`. Two layers:

1. **RLS (defence in depth, in `rls.sql`):**
   - Clients have **no SELECT** on the raw `phases` table. They read `phases_client`,
     a `security_invoker` view that returns `type` and `controller_tilt` as `NULL`
     until `settled = true`.
   - `allocations` / `votes` / `abilities_used` SELECT policies allow a row only if
     it is the caller's **own** row, **or** the row's phase is **settled**. So a
     direct anon query for a rival's pre-SETTLE allocation returns zero rows.
   - Clients have no SELECT on raw `players` (which holds `session_token`); they read
     `players_public` (no token column).
2. **`project()` (in `packages/shared/src/project.ts`):** the worker never broadcasts
   raw rows. It builds a per-viewer `ClientView` where `phaseType`, `controllerTilt`,
   and `allAllocations` are `null` until `settled`, and broadcasts that over Realtime.

Together: the normal read path is the projected `ClientView` (already masked); RLS
makes a direct-to-Postgres read attempt useless before settlement. See
[`MULTIPLAYER_ARCHITECTURE.md`](../../../docs/MULTIPLAYER_ARCHITECTURE.md) and risk
R6 in [`RISK_REGISTER.md`](../../../docs/RISK_REGISTER.md).

## Money / basis-point integrity

Audited: every money column (`players.money`, `allocations.amount`, `results.final_money`)
is `BIGINT` satang; PC is `INTEGER`; basis points live as integers inside `JSONB`
(`phases.controller_tilt`, `events.effect`). **No `NUMERIC`/`REAL`/`DOUBLE PRECISION`
anywhere** — formatting to `฿` happens only at the React display edge.
