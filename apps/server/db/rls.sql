-- EconWar — Row-Level Security (RLS) policies (Supabase / Postgres)
-- Owner: Technical Director. Apply AFTER schema.sql.
--
-- Identity model (ADR-0003): ephemeral join-code + nickname. No email auth.
--   Each player carries an opaque `session_token`. The client sends it on every
--   request; the server sets it into a request-local GUC so RLS can answer
--   "who is me?". We use `current_setting('econwar.session_token', true)`.
--
--   Supabase roles:
--     * `anon` / `authenticated` -> the PLAYER client. Heavily restricted below.
--     * `service_role`           -> the always-on Node phase-clock worker
--                                   (ADR-0006). Bypasses RLS by default in
--                                   Supabase; it is the ONLY writer of truth
--                                   (settlement, results, events, hidden phase data).
--
-- TWO LAYERS, ONE GUARANTEE (Golden rule #5 — no pre-SETTLE leak):
--   Layer 1 (THIS FILE, defence in depth): even if a client queries Postgres
--           directly with the anon key, RLS forbids reading rivals' allocations,
--           the hidden phase `type`, and `controller_tilt` while `settled = false`.
--   Layer 2 (server project(): packages/shared/src/project.ts): the worker NEVER
--           broadcasts raw rows. It projects per-viewer ClientViews where
--           phaseType / controllerTilt / rivals' allocations are null until
--           settled === true, then broadcasts those over Realtime.
--   The client SHOULD read game data via the projected ClientView (Realtime), not
--   by hitting the tables directly; RLS is the backstop that makes a direct read
--   useless before settlement. R6 in docs/RISK_REGISTER.md.
--
--   Because PostgREST/Supabase cannot do column-level masking in a single policy,
--   we hide leak-sensitive COLUMNS by exposing them to clients only through a
--   SECURITY-INVOKER VIEW (`phases_client`) that nulls them pre-SETTLE, and by
--   forbidding direct client SELECT on the raw `phases` table.

begin;

-- ===========================================================================
-- Helper: the current player's id, derived from the session-token GUC.
--   The server runs `select set_config('econwar.session_token', $token, true)`
--   (true = local to the transaction) before issuing the client's query.
-- ===========================================================================
create or replace function current_player_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.id
  from players p
  where p.session_token = current_setting('econwar.session_token', true)
  limit 1;
$$;

create or replace function current_game_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.game_id
  from players p
  where p.session_token = current_setting('econwar.session_token', true)
  limit 1;
$$;

-- True only while the phase the row belongs to is still OPEN (intents accepted).
create or replace function phase_is_open(p_phase_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from phases ph
    where ph.id = p_phase_id and ph.settled = false
  );
$$;

create or replace function phase_is_settled(p_phase_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select ph.settled from phases ph where ph.id = p_phase_id), false);
$$;

-- ===========================================================================
-- Enable RLS on every table. Default-deny: with RLS on and no permissive
-- policy, clients get nothing. service_role bypasses RLS (writes truth).
-- ===========================================================================
alter table games          enable row level security;
alter table players        enable row level security;
alter table phases         enable row level security;
alter table allocations    enable row level security;
alter table votes          enable row level security;
alter table abilities_used enable row level security;
alter table events         enable row level security;
alter table results        enable row level security;

-- ===========================================================================
-- games — a player may READ only their own game. No client writes (server only).
-- ===========================================================================
create policy games_select_own
  on games for select
  to anon, authenticated
  using (id = current_game_id());

-- ===========================================================================
-- players — a player may READ the PUBLIC roster of their game (nickname, dept,
--   money, pc). The leak-sensitive column is `session_token`: it must never be
--   readable by other clients. PostgREST can't column-mask in a policy, so:
--     * clients NEVER select the raw `players` table (no select policy below);
--     * clients read the roster via the `players_public` view (no session_token).
--   A player may UPDATE only their own nickname (cosmetic) — money/pc/department
--   are server-authoritative and excluded by a trigger guard.
-- ===========================================================================
-- (Intentionally no SELECT policy on raw players for clients -> use players_public.)

create or replace view players_public
with (security_invoker = true) as
  select id, game_id, department, nickname, money, political_capital, is_bot, joined_at
  from players
  where game_id = current_game_id();

-- Guard: clients may only change nickname; money/pc/department/token are locked.
create or replace function players_client_update_guard() returns trigger
language plpgsql as $$
begin
  if new.money            is distinct from old.money
     or new.political_capital is distinct from old.political_capital
     or new.department    is distinct from old.department
     or new.session_token is distinct from old.session_token
     or new.game_id       is distinct from old.game_id
     or new.is_bot        is distinct from old.is_bot then
    raise exception 'players: clients may only update nickname';
  end if;
  return new;
end;
$$;

-- current_user reflects the active role after Supabase's SET ROLE, so the guard
-- runs for anon/authenticated clients but is skipped for the service_role worker.
create trigger players_client_update_guard_trg
  before update on players
  for each row
  when (current_user is distinct from 'service_role')
  execute function players_client_update_guard();

create policy players_update_self
  on players for update
  to anon, authenticated
  using (id = current_player_id())
  with check (id = current_player_id());

-- ===========================================================================
-- phases — THE leak-critical table. Clients get NO direct SELECT on the raw
--   table (so `type` and `controller_tilt` are unreachable). They read the
--   `phases_client` view, which masks the hidden columns until settled.
-- ===========================================================================
-- (Intentionally no client SELECT policy on raw phases.)

create or replace view phases_client
with (security_invoker = true) as
  select
    ph.id,
    ph.game_id,
    ph.phase_index,
    ph.indicators,                                   -- public, legible
    ph.controller_player_id,                         -- public once elected
    ph.settled,
    ph.settled_at,
    -- HIDDEN until settled (Golden rule #5):
    case when ph.settled then ph.type           else null end as type,
    case when ph.settled then ph.controller_tilt else null end as controller_tilt
  from phases ph
  where ph.game_id = current_game_id();

-- ===========================================================================
-- allocations — a player may READ:
--     * their OWN allocations for any phase, always; AND
--     * EVERYONE's allocations for a phase, but ONLY after that phase settled.
--   Pre-SETTLE, rivals' allocations are invisible (Golden rule #5).
--   A player may WRITE (insert/update) only their OWN allocations, and only
--   while the phase is still OPEN (server-authoritative intent window).
-- ===========================================================================
create policy allocations_select_own_or_settled
  on allocations for select
  to anon, authenticated
  using (
    player_id = current_player_id()
    or phase_is_settled(phase_id)
  );

create policy allocations_insert_own_open
  on allocations for insert
  to anon, authenticated
  with check (
    player_id = current_player_id()
    and phase_is_open(phase_id)
  );

create policy allocations_update_own_open
  on allocations for update
  to anon, authenticated
  using (player_id = current_player_id() and phase_is_open(phase_id))
  with check (player_id = current_player_id() and phase_is_open(phase_id));

-- ===========================================================================
-- votes — a player may READ only their own ballot pre-SETTLE (secret ballot),
--   and all ballots once settled (audit/transparency). Writes only own, open.
-- ===========================================================================
create policy votes_select_own_or_settled
  on votes for select
  to anon, authenticated
  using (
    voter_id = current_player_id()
    or phase_is_settled(phase_id)
  );

create policy votes_insert_own_open
  on votes for insert
  to anon, authenticated
  with check (voter_id = current_player_id() and phase_is_open(phase_id));

create policy votes_update_own_open
  on votes for update
  to anon, authenticated
  using (voter_id = current_player_id() and phase_is_open(phase_id))
  with check (voter_id = current_player_id() and phase_is_open(phase_id));

-- ===========================================================================
-- abilities_used — same shape: own-only pre-SETTLE (hidden info), all settled;
--   write only own, open. Revealing a rival's ability pre-settle would leak
--   intent just like an allocation.
-- ===========================================================================
create policy abilities_select_own_or_settled
  on abilities_used for select
  to anon, authenticated
  using (
    player_id = current_player_id()
    or phase_is_settled(phase_id)
  );

create policy abilities_insert_own_open
  on abilities_used for insert
  to anon, authenticated
  with check (player_id = current_player_id() and phase_is_open(phase_id));

create policy abilities_update_own_open
  on abilities_used for update
  to anon, authenticated
  using (player_id = current_player_id() and phase_is_open(phase_id))
  with check (player_id = current_player_id() and phase_is_open(phase_id));

-- ===========================================================================
-- events — drawn during settlement; only meaningful post-SETTLE. Read only
--   for settled phases in the player's game. No client writes (server only).
-- ===========================================================================
create policy events_select_settled
  on events for select
  to anon, authenticated
  using (
    exists (
      select 1 from phases ph
      where ph.id = events.phase_id
        and ph.game_id = current_game_id()
        and ph.settled = true
    )
  );

-- ===========================================================================
-- results — final standings. Readable by any player in that game once written.
--   No client writes (server only).
-- ===========================================================================
create policy results_select_own_game
  on results for select
  to anon, authenticated
  using (game_id = current_game_id());

-- ===========================================================================
-- Expose the safe views to client roles; keep raw leak-sensitive tables out.
-- ===========================================================================
grant select on players_public to anon, authenticated;
grant select on phases_client  to anon, authenticated;

-- Note: no client GRANTs on raw `players` (SELECT) or raw `phases` (SELECT).
-- service_role retains full access (bypasses RLS) for settlement & projection.

commit;
