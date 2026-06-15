-- EconWar — Postgres schema (Supabase)
-- Owner: Technical Director. Source of truth: ../../../CLAUDE.md ("Resolved decisions"),
--   core/02_Technical_Architecture.md §4 (data model), packages/shared/src/types.ts.
--
-- GOLDEN RULES encoded here:
--   * Money is integer SATANG (1 baht = 100 satang) -> BIGINT, never float. (Golden rule #2)
--   * Basis points are integers (10000 = x1.0) -> INT/BIGINT, never float.
--   * The hidden phase.type, controller tilt, and rivals' allocations must not leak
--     pre-SETTLE. This file ships the COLUMNS (phases.type, phases.controller_tilt,
--     allocations.amount); rls.sql + the server's project() boundary gate VISIBILITY
--     until phases.settled = true. (Golden rule #5 — see rls.sql.)
--   * Server is authoritative: clients write only their own intents; the service role
--     writes settlement/results. (Golden rule #4 — enforced in rls.sql.)
--
-- Enum value sets mirror packages/shared/src/types.ts exactly:
--   RegionId      = central | north | south | northeast
--   PhaseType     = boom | recession | recovery | slowdown
--   DepartmentId  = government | ir | sociology | public_admin | politics_global
--   AbilityId     = gov_tax | ir_peek | soc_marketmove | pa_rebalance | pg_foresight
--
-- Apply: see README.md (Supabase migration).

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (mirror the engine's TS string-literal unions; tune content, not these)
-- ---------------------------------------------------------------------------
create type game_mode    as enum ('solo', 'multi');
create type game_status  as enum ('lobby', 'active', 'settling', 'finished', 'abandoned');
create type region_id    as enum ('central', 'north', 'south', 'northeast');
create type phase_type   as enum ('boom', 'recession', 'recovery', 'slowdown');
create type department_id as enum ('government', 'ir', 'sociology', 'public_admin', 'politics_global');
create type ability_id   as enum ('gov_tax', 'ir_peek', 'soc_marketmove', 'pa_rebalance', 'pg_foresight');

-- ---------------------------------------------------------------------------
-- games — one row per match (solo or multi). GameState.id maps to games.id.
-- ---------------------------------------------------------------------------
create table games (
  id            uuid primary key default gen_random_uuid(),
  mode          game_mode    not null,
  -- mulberry32 seed. The engine takes a 32-bit unsigned int; store as BIGINT to
  -- hold the full 0..4294967295 range without sign issues.
  seed          bigint       not null,
  -- 0-based index of the current phase (0..3). NULL while still in lobby.
  current_phase smallint     not null default 0
                  check (current_phase between 0 and 3),
  status        game_status  not null default 'lobby',
  -- Ephemeral join code (ADR-0003). Short, human-typeable; unique among live games.
  join_code     text         not null,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),

  constraint games_join_code_format check (char_length(join_code) between 4 and 12)
);

-- A join code must be unique among games that are still joinable/running. Once a
-- game is finished/abandoned its code may be recycled. Partial unique index does this.
create unique index games_join_code_live_uidx
  on games (join_code)
  where status in ('lobby', 'active', 'settling');

create index games_status_idx on games (status);

-- ---------------------------------------------------------------------------
-- players — one row per participant. Maps to PlayerState.
--   Identity = ephemeral session_token (anon), no email (ADR-0003).
-- ---------------------------------------------------------------------------
create table players (
  id                uuid          primary key default gen_random_uuid(),
  game_id           uuid          not null references games(id) on delete cascade,
  department        department_id not null,
  nickname          text          not null,
  -- Net worth in SATANG. BIGINT (never float). Starts at STARTING_CAPITAL_SATANG
  -- (100,000,000) — default mirrors the engine constant.
  money             bigint        not null default 100000000
                      check (money >= 0),
  -- Political Capital — integer count, never negative.
  political_capital integer       not null default 0
                      check (political_capital >= 0),
  -- Opaque per-session bearer token used by RLS to identify "me". Set by the
  -- server at join; never exposed to other clients (see rls.sql).
  session_token     text          not null,
  is_bot            boolean       not null default false,
  joined_at         timestamptz   not null default now(),

  constraint players_nickname_len check (char_length(nickname) between 1 and 24),
  -- Nicknames unique within a game so the lobby/leaderboard are unambiguous.
  constraint players_nick_unique  unique (game_id, nickname)
);

create index        players_game_idx        on players (game_id);
create unique index players_session_uidx    on players (session_token);

-- ---------------------------------------------------------------------------
-- phases — one row per (game, phase_index). Holds the HIDDEN truth for the phase.
--   `type` and `controller_tilt` are the leak-sensitive columns: RLS hides the
--   whole row's sensitive fields from clients until `settled = true`.
-- ---------------------------------------------------------------------------
create table phases (
  id                   uuid       primary key default gen_random_uuid(),
  game_id              uuid       not null references games(id) on delete cascade,
  phase_index          smallint   not null check (phase_index between 0 and 3),
  -- HIDDEN until settled. The true PhaseType for this phase.
  type                 phase_type not null,
  -- Public, legible economic indicators shown pre-vote (the "reveal" step).
  -- JSONB, not the hidden type. Validated by Zod at the server boundary.
  indicators           jsonb      not null default '{}'::jsonb,
  -- HIDDEN until settled. Per-region controller tilt in BASIS POINTS (10000=neutral).
  -- Stored as a JSONB object of region_id -> integer bp, e.g.
  --   {"central":10500,"north":9700,"south":9700,"northeast":9700}
  -- JSONB keeps it as a single small column; values are integers (bp), never floats.
  controller_tilt      jsonb,
  -- The elected Market Controller for this phase (nullable: none elected yet / solo).
  controller_player_id uuid       references players(id) on delete set null,
  settled              boolean    not null default false,
  settled_at           timestamptz,

  constraint phases_unique_index unique (game_id, phase_index)
);

create index phases_game_idx     on phases (game_id);
create index phases_unsettled_idx on phases (game_id) where settled = false;

-- ---------------------------------------------------------------------------
-- allocations — capital a player placed into a region for a phase (an INTENT).
--   amount is SATANG (BIGINT). A player's allocations for a phase are leak-
--   sensitive (rivals must not read them pre-SETTLE) — gated in rls.sql.
-- ---------------------------------------------------------------------------
create table allocations (
  id         uuid      primary key default gen_random_uuid(),
  player_id  uuid      not null references players(id)  on delete cascade,
  phase_id   uuid      not null references phases(id)   on delete cascade,
  region     region_id not null,
  -- Capital placed in this region, in SATANG. BIGINT, non-negative, never float.
  amount     bigint    not null check (amount >= 0),
  created_at timestamptz not null default now(),

  -- One row per (player, phase, region): a player allocates at most once per region
  -- per phase (re-submission updates the row).
  constraint allocations_unique unique (player_id, phase_id, region)
);

create index allocations_phase_idx        on allocations (phase_id);
create index allocations_player_phase_idx on allocations (player_id, phase_id);

-- ---------------------------------------------------------------------------
-- votes — a voter's ballot for the Market Controller of a phase (an INTENT).
--   Department-slate voting (ADR-0005): candidate is one of <=5 dept candidates.
-- ---------------------------------------------------------------------------
create table votes (
  id                  uuid    primary key default gen_random_uuid(),
  phase_id            uuid    not null references phases(id)  on delete cascade,
  voter_id            uuid    not null references players(id) on delete cascade,
  candidate_player_id uuid    not null references players(id) on delete cascade,
  -- voteWeight = 1 + min(floor(PC / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES). Integer.
  pc_weight           integer not null check (pc_weight >= 1),
  created_at          timestamptz not null default now(),

  -- One ballot per voter per phase (re-submission updates the row).
  constraint votes_unique unique (phase_id, voter_id)
);

create index votes_phase_idx     on votes (phase_id);
create index votes_candidate_idx on votes (phase_id, candidate_player_id);

-- ---------------------------------------------------------------------------
-- abilities_used — a department Special Ability activation for a phase (an INTENT).
-- ---------------------------------------------------------------------------
create table abilities_used (
  id               uuid       primary key default gen_random_uuid(),
  player_id        uuid       not null references players(id) on delete cascade,
  phase_id         uuid       not null references phases(id)  on delete cascade,
  ability          ability_id not null,
  -- Optional targets (depend on the ability's needsTargetPlayer / needsTargetRegion).
  target_player_id uuid       references players(id) on delete set null,
  target_region    region_id,
  created_at       timestamptz not null default now(),

  -- A player uses a given ability at most once per phase.
  constraint abilities_used_unique unique (player_id, phase_id, ability)
);

create index abilities_used_phase_idx  on abilities_used (phase_id);
create index abilities_used_player_idx on abilities_used (player_id, phase_id);

-- ---------------------------------------------------------------------------
-- events — the random event drawn during settlement for a phase (SERVER-written).
--   effect carries integer basis points (e.g. {"multiplierBp": 11500}); never float.
-- ---------------------------------------------------------------------------
create table events (
  id         uuid       primary key default gen_random_uuid(),
  phase_id   uuid       not null references phases(id) on delete cascade,
  event_type text       not null,           -- EventDef.id / name from content JSON
  -- Region the event hits; NULL means "all" / "none" (EventTarget can be non-region).
  region     region_id,
  -- JSONB effect payload. Integer bp inside, no floats. e.g. {"target":"all","multiplierBp":10800}
  effect     jsonb      not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_phase_idx on events (phase_id);

-- ---------------------------------------------------------------------------
-- results — final standings, written once at game end (SERVER-written).
-- ---------------------------------------------------------------------------
create table results (
  id          uuid    primary key default gen_random_uuid(),
  game_id     uuid    not null references games(id)   on delete cascade,
  player_id   uuid    not null references players(id) on delete cascade,
  -- Final net worth in SATANG. BIGINT, never float.
  final_money bigint  not null,
  -- 1 = winner (richest), ascending. Unique within a game.
  rank        integer not null check (rank >= 1),
  created_at  timestamptz not null default now(),

  constraint results_unique_player unique (game_id, player_id),
  constraint results_unique_rank   unique (game_id, rank)
);

create index results_game_idx on results (game_id);

-- ---------------------------------------------------------------------------
-- updated_at touch trigger for games
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_set_updated_at
  before update on games
  for each row execute function set_updated_at();

commit;
