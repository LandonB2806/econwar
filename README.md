# EconWar

A web-first, phase-based **economic-strategy game** for political-science students.
See [`CLAUDE.md`](CLAUDE.md) for the authoritative brief and [`core/`](core/) for the full spec set.

## Status — Milestone 0 ✅ (pure engine)

The deterministic game core is built and green. UI, art, and networking come next
(and must not start before the engine is green — see `CLAUDE.md`).

```
packages/
  shared/   types, constants, Zod schemas, data-driven content JSON, project() anti-leak boundary
  engine/   PURE core: settlePhase, rng (mulberry32), factors/, voteTally, pcLedger, stateMachine
golden/     committed cross-language vectors (rng_vector.json, settlement_cases.json)
lab/        Python port + pytest parity (offline balance lab; never shipped)
```

### Golden rules enforced
- **Integer money** (satang) + **basis-point** factors, all in `BigInt`; round half-up **once** at the end.
- **Deterministic RNG** (pinned `mulberry32`), locked by `golden/rng_vector.json`, identical in TS & Python.
- **Pure engine** — no React/Phaser/Node/DB/network/clock.
- **No state leaks** — `project(state, viewerId)` hides phase type, controller tilt, and rivals'
  allocations until `settled === true`; a test fails the build if a pre-SETTLE payload leaks them.
- **Data-driven content** validated by Zod at load.
- **Tests are the contract** — `golden/settlement_cases.json` runs in both Vitest and pytest.

## Commands

```bash
npm install
npm run typecheck        # tsc --build
npm test                 # Vitest (TS engine + shared)
npm run lab:test         # pytest (Python parity)

# Regenerate the golden vectors after an intentional engine/content change:
npx tsx packages/engine/scripts/gen_golden.ts
```

## Build order (next)

1. ✅ **Milestone 0** — pure engine + shared, golden TS/Python parity.
2. **Milestone 1** — single-player vertical slice (engine + FSM + heuristic AI bots + placeholder UI, no network).
3. **Milestone 2** — Stardew pixel-art pass.
4. **Milestone 3** — multiplayer core (Node clock worker + Supabase Realtime, 8–16 players).
5. **Milestone 4** — scale & host mode (~260, Pro tier).
6. **Milestone 5** — balance & polish (Python sims).
