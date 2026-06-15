# EconWar — Technical Architecture & Required Skills (v0.2)

> How to build it, and what you must be skilled in to build it.

---

## 1. TL;DR — Essential Languages You Must Know

If you only master these, you can build the whole game:

| Priority | Language / Skill | Why it's essential | Where it's used |
|---|---|---|---|
| **1. Must-have** | **HTML + CSS** | The web UI shell, layout, responsive design | All screens |
| **1. Must-have** | **TypeScript (JavaScript)** | The *entire* app — frontend logic, game rendering, backend server. One language, full stack. | Frontend + backend + game engine |
| **2. Must-have** | **SQL** | Persisting game state, users, results, leaderboards (you already have strong SQL handbooks — this is a strength) | Database layer |
| **3. Useful, optional** | **Python** | Offline economy **simulation & balancing**, statistical tuning of returns, generating test data (matches your existing Python skill set) | Pre-launch balancing, not the live app |

**Bottom line:** *TypeScript is the spine.* Learn it well and you cover the UI, the pixel game scene, and the server. HTML/CSS and SQL support it. Python is your lab for tuning numbers, not a requirement to ship.

> Why not C#/Unity (the "real" Stardew stack)? Stardew Valley itself is C#/MonoGame, but a desktop game engine is overkill and works against your *web-first* requirement. You can fully achieve the Stardew **look** in the browser with a 2D web game framework (see §3). Stick to the web stack.

---

## 2. Recommended Stack (web-first, cost-conscious)

| Layer | Choice | Notes |
|---|---|---|
| **Language (all layers)** | **TypeScript** | One language end-to-end |
| **UI framework** | **React** | Menus, portfolio panels, voting UI, leaderboard |
| **Game scene rendering** | **Phaser 3** (or PixiJS) | Pixel-art world, tilemaps, animations — the Stardew vibe (see Art doc) |
| **Backend / realtime** | **Node.js + Socket.IO** *(or Supabase Realtime)* | Phase clock, vote tallies, live settlement broadcast |
| **Database** | **PostgreSQL** | Game state, users, results |
| **Realtime cache** | **Redis** | Live session state, vote counts, websocket scaling (add only when needed) |
| **Auth + DB hosting (free tier)** | **Supabase** | Free Postgres + auth + realtime — can replace custom websockets for a truly-free v1 |
| **Frontend hosting (free tier)** | **Vercel / Netlify / Cloudflare Pages** | Static + edge functions |

> Cost-conscious v1 path: **Supabase (DB + auth + realtime) + Vercel (frontend)** gets you to a free/near-free multiplayer prototype without running your own websocket server.

---

## 3. System Architecture

```
┌──────────────────────────────────────────────┐
│                 CLIENT (browser)              │
│  React UI  ──embeds──►  Phaser canvas (pixel) │
│  • Portfolio panel      • Region map scene    │
│  • Voting panel         • Animated economy    │
│  • Ability buttons      • Leaderboard board   │
└───────────────┬───────────────▲───────────────┘
                │ WebSocket / Realtime channel
                ▼               │ broadcasts
┌──────────────────────────────────────────────┐
│              SERVER (Node + TS)               │
│  • Phase Clock (state machine: 4 phases)      │
│  • Vote Tally → Controller election           │
│  • ECONOMY ENGINE (settlement math)           │
│  • Ability resolver / PC ledger               │
│  • AI module (Single-Player bots + engine)    │
└───────────────┬───────────────────────────────┘
                ▼
┌──────────────────────────────────────────────┐
│   PostgreSQL (state, users, results)          │
│   Redis (live vote/session cache)             │
└──────────────────────────────────────────────┘
```

### The Economy Engine (the most important module)
A pure, deterministic function — easy to test, easy to balance:

```
finalValue(region) =
   capital_in_region
   × basePhaseEffect(phase, region)
   × regionalModifier(region, phase)
   × controllerTilt(region)
   × randomEvent(region)
   × abilityEffects(player, region)
```

Keep it **pure and seedable** (same seed → same outcome) so Single-Player AI, Multiplayer, and your Python balancing tests all share one source of truth.

---

## 4. Data Model (core tables)

| Table | Key fields |
|---|---|
| `games` | id, mode (solo/multi), seed, current_phase, status |
| `players` | id, game_id, department, money, political_capital |
| `phases` | id, game_id, phase_index, type, indicators(json), controller_player_id |
| `allocations` | id, player_id, phase_id, region, amount |
| `votes` | id, phase_id, voter_id, candidate_id, pc_weight |
| `abilities_used` | id, player_id, phase_id, ability, target_id |
| `events` | id, phase_id, event_type, region, effect(json) |
| `results` | id, game_id, player_id, final_money, rank |

---

## 5. Multiplayer at scale (~260 players)

The game is **phase-based, not twitch-action**, which makes 260 players very achievable:
- Heavy traffic happens only at **phase boundaries** (reveal, vote, settle) — not continuously.
- Use **server-authoritative** settlement: clients submit allocation/vote, the server computes the single truth and broadcasts the diff.
- Generous **time windows** per step (e.g., 90s to allocate) absorb latency and slow clients.
- Scale websockets horizontally later via Redis pub/sub if a single node isn't enough.

---

## 6. Single-Player AI

- **AI opponents:** rule-based "personality" bots per department (e.g., Strategist bot front-runs phases, Government bot plays defensive). No LLM required — heuristics are cheaper, faster, and reproducible.
- **AI engine:** the same deterministic Economy Engine; events drawn from a seeded RNG.
- Optional polish: a small LLM call for *flavor text* / news headlines per event — strictly cosmetic.

---

## 7. What to learn first (ordered)

1. **TypeScript fundamentals** + a React crash course → build the static UI screens.
2. **Phaser 3 basics** (scenes, sprites, tilemaps) → render the pixel world.
3. **Node + Socket.IO** *or* **Supabase Realtime** → make two browsers talk.
4. **SQL schema design** → persist a full game (you already have the SQL foundation).
5. *(Optional)* **Python** → simulate 10,000 games to balance the numbers before launch.
