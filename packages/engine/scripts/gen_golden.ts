/**
 * Authors the committed golden vectors from the engine itself (a one-time
 * blessing). After this runs, golden/*.json are the locked contract that BOTH
 * Vitest (TS regression) and pytest (TS↔Python parity) must reproduce.
 *
 * Run: npx tsx packages/engine/scripts/gen_golden.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { makeRng, settlePhase } from "../src/index.js";
import { REGION_IDS } from "@econwar/shared";
import type {
  AbilityActivation,
  ByRegion,
  DepartmentId,
  GameState,
  PhaseInputs,
  PhaseType,
  PlayerState,
  Satang,
} from "@econwar/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = resolve(__dirname, "../../../golden");

/* ---------- helpers to author readable cases ---------- */

function regionMap(values: Partial<ByRegion<bigint>>): ByRegion<bigint> {
  return {
    central: values.central ?? 0n,
    north: values.north ?? 0n,
    south: values.south ?? 0n,
    northeast: values.northeast ?? 0n,
  };
}

function tilt(values: Partial<ByRegion<bigint>>): ByRegion<bigint> {
  return {
    central: values.central ?? 10000n,
    north: values.north ?? 10000n,
    south: values.south ?? 10000n,
    northeast: values.northeast ?? 10000n,
  };
}

function player(
  id: string,
  department: DepartmentId,
  money: bigint,
  pc: number,
): PlayerState {
  return { id, nickname: id.toUpperCase(), department, money, pc };
}

function gameOf(players: PlayerState[]): GameState {
  return {
    id: "golden",
    mode: "solo",
    seed: 0,
    phaseIndex: 0,
    phaseOrder: ["boom", "recession", "recovery", "slowdown"],
    step: "settlement",
    players,
    controllerId: null,
    settled: false,
  };
}

interface Case {
  name: string;
  seed: number;
  phaseType: PhaseType;
  controllerId: string | null;
  controllerTilt: ByRegion<bigint>;
  players: PlayerState[];
  allocations: Record<string, ByRegion<bigint>>;
  abilities: AbilityActivation[];
}

const CAP = 100_000_000n; // ฿1,000,000

const cases: Case[] = [
  {
    name: "single_player_neutral_boom",
    seed: 12345,
    phaseType: "boom",
    controllerId: null,
    controllerTilt: tilt({}),
    players: [player("p1", "politics_global", CAP, 0)],
    allocations: {
      p1: regionMap({ central: 60_000_000n, northeast: 40_000_000n }),
    },
    abilities: [],
  },
  {
    name: "controller_tilt_with_transparency_penalty",
    seed: 777,
    phaseType: "recovery",
    controllerId: "p2",
    controllerTilt: tilt({ north: 12000n, central: 9700n, south: 9700n, northeast: 9700n }),
    players: [
      player("p1", "government", CAP, 30),
      player("p2", "ir", CAP, 24),
    ],
    allocations: {
      p1: regionMap({ north: 50_000_000n, northeast: 50_000_000n }),
      p2: regionMap({ north: 80_000_000n, central: 20_000_000n }),
    },
    abilities: [],
  },
  {
    name: "abilities_market_move_and_tax",
    seed: 9090,
    phaseType: "recession",
    controllerId: null,
    controllerTilt: tilt({}),
    players: [
      player("p1", "sociology", CAP, 40),
      player("p2", "government", CAP, 40),
      player("p3", "public_admin", CAP, 40),
    ],
    allocations: {
      p1: regionMap({ northeast: 70_000_000n, south: 30_000_000n }),
      p2: regionMap({ northeast: 100_000_000n }),
      p3: regionMap({ northeast: 50_000_000n, central: 50_000_000n }),
    },
    abilities: [
      { actorId: "p1", abilityId: "soc_marketmove", targetRegion: "northeast" },
      { actorId: "p2", abilityId: "gov_tax", targetPlayerId: "p3" },
    ],
  },
  {
    // Balance-lab additions (Economy/QA). Exercise the round-half-up boundary
    // and a slowdown phase (the "low returns everywhere" cell with the tightest
    // region margins) so the golden contract pins those paths too.
    name: "round_half_up_boundary_boom_central",
    seed: 12345,
    phaseType: "boom",
    controllerId: null,
    controllerTilt: tilt({}),
    // alloc=1500 satang in boom/central: if the drawn event is calm, the chain
    // lands on an exact .5 boundary -> must round up. The engine itself blesses
    // the recorded value, so this case is a regression+parity anchor either way.
    players: [player("p1", "ir", CAP, 0)],
    allocations: { p1: regionMap({ central: 1500n }) },
    abilities: [],
  },
  {
    name: "slowdown_spread_three_players",
    seed: 4242,
    phaseType: "slowdown",
    controllerId: null,
    controllerTilt: tilt({}),
    players: [
      player("p1", "public_admin", CAP, 12),
      player("p2", "politics_global", CAP, 7),
      player("p3", "ir", CAP, 11),
    ],
    allocations: {
      p1: regionMap({ south: 100_000_000n }),
      p2: regionMap({ central: 50_000_000n, north: 50_000_000n }),
      p3: regionMap({ northeast: 100_000_000n }),
    },
    abilities: [],
  },
];

/* ---------- serialization ---------- */

const s = (v: Satang) => v.toString();

function serializeRegionMap(m: ByRegion<bigint>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of REGION_IDS) out[r] = s(m[r]);
  return out;
}

const outputCases = cases.map((c) => {
  const state = gameOf(c.players);
  const inputs: PhaseInputs = {
    phaseType: c.phaseType,
    allocations: c.allocations,
    controllerTilt: c.controllerTilt,
    controllerId: c.controllerId,
    abilities: c.abilities,
  };
  const result = settlePhase(state, inputs, c.seed);

  return {
    name: c.name,
    seed: c.seed,
    phaseType: c.phaseType,
    controllerId: c.controllerId,
    controllerTilt: serializeRegionMap(c.controllerTilt),
    players: c.players.map((p) => ({
      id: p.id,
      department: p.department,
      money: s(p.money),
      pc: p.pc,
    })),
    allocations: Object.fromEntries(
      Object.entries(c.allocations).map(([id, m]) => [id, serializeRegionMap(m)]),
    ),
    abilities: c.abilities,
    expected: {
      eventId: result.event.id,
      leaderboard: result.leaderboard,
      players: Object.fromEntries(
        result.players.map((ps) => [
          ps.playerId,
          {
            endMoney: s(ps.endMoney),
            grossAfterMarket: s(ps.grossAfterMarket),
            taxPaid: s(ps.taxPaid),
            taxReceived: s(ps.taxReceived),
            pcEnd: ps.pcEnd,
            regionResults: serializeRegionMap(
              regionMap(
                Object.fromEntries(
                  REGION_IDS.map((r) => [r, ps.regionResults[r].finalValue]),
                ) as ByRegion<bigint>,
              ),
            ),
          },
        ]),
      ),
    },
  };
});

/* ---------- RNG vector ---------- */

const rng = makeRng(12345);
const rngVector = {
  seed: 12345,
  algorithm: "mulberry32",
  u32: Array.from({ length: 12 }, () => rng.nextU32()),
};

/* ---------- write ---------- */

mkdirSync(GOLDEN_DIR, { recursive: true });
writeFileSync(
  resolve(GOLDEN_DIR, "settlement_cases.json"),
  JSON.stringify({ cases: outputCases }, null, 2) + "\n",
);
writeFileSync(
  resolve(GOLDEN_DIR, "rng_vector.json"),
  JSON.stringify(rngVector, null, 2) + "\n",
);

console.log(`Wrote golden vectors to ${GOLDEN_DIR}`);
console.log(`  - ${outputCases.length} settlement cases`);
console.log(`  - rng vector: [${rngVector.u32.join(", ")}]`);
