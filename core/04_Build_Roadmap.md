# EconWar — Build Roadmap & Mobile Plan (v0.2)

> Order of construction, from a playable core to a polished 260-player event, then mobile.

---

## Milestone 0 — Foundations (skills + skeleton)
- Stand up the repo: TypeScript + React + Phaser + a hosting target.
- Define the **data model** (see Technical Architecture §4).
- Implement the **Economy Engine as a pure, seeded function** first — it's the heart of everything and the easiest thing to unit-test.
- **Deliverable:** given a seed + allocations, the engine returns correct portfolio values.

## Milestone 1 — Single-Player vertical slice
- One human + AI bots, one full 4-phase game, **no networking**.
- Build all five round-loop steps locally: reveal → vote (mocked) → tilt → allocate + ability → settle.
- Basic placeholder pixel UI.
- **Deliverable:** a complete solo game you can finish and see a winner.

## Milestone 2 — Stardew art pass
- Replace placeholders with the pixel look: region map, ledger panel, voting hall, settlement animation.
- Add department banners/mascots and palette.
- **Deliverable:** the solo game *looks* like the target product.

## Milestone 3 — Multiplayer core (small)
- Add server + realtime (Supabase Realtime or Node + Socket.IO).
- Synchronized phase clock; live voting; server-authoritative settlement broadcast.
- Test with ~8–16 players.
- **Deliverable:** a real multiplayer game for a small group.

## Milestone 4 — Scale & host mode (~260)
- Generous time windows; server-authoritative everything; Redis if needed.
- Facilitator/host screen: phase timer + global leaderboard.
- Load-test with simulated clients.
- **Deliverable:** a stable event-scale game.

## Milestone 5 — Balance & polish
- Run **Python simulations** of thousands of games to tune ability caps, PC rates, and controller tilt bounds.
- Add sound, juice, tutorial.
- **Deliverable:** a balanced, fun, event-ready game.

---

## Mobile Roadmap (prepare from day 1, ship later)

The feedback asks for **web first, mobile-friendly later**. Bake these in early so the port is cheap:

1. **Design at a fixed virtual resolution** and integer-scale — this makes phone layouts predictable.
2. **Responsive React shell** — stack panels vertically on narrow screens; collapse the region map into a tabbed/scrollable view.
3. **Touch-first interactions** — allocation via sliders/tap, not hover; large tap targets for voting and ability buttons.
4. **Phase-based design helps** — no fast input needed, so mobile latency is a non-issue.
5. **Optional later:** wrap the web app as an installable **PWA** (add-to-home-screen, offline shell) before considering any native build.

> Rule of thumb: if every interaction works with a finger and the layout reflows to a single column, the mobile port is mostly CSS + input handling, not a rewrite.

---

## Suggested file/spec set for handing to an AI engineer (Codex)

1. `01_Game_Design_Spec.md` — what the game *is* (rules, abilities, economy).
2. `02_Technical_Architecture.md` — stack, data model, engine contract.
3. `03_Art_Direction_Stardew.md` — the look and asset pipeline.
4. `04_Build_Roadmap.md` — this file: build order + mobile plan.

Hand them in this order; Milestone 0's **pure Economy Engine** is the ideal first implementation task because it's fully specified and independently testable.
