/**
 * Property / invariant tests for settlePhase — the structural guarantees that
 * must hold no matter the inputs (complementing the byte-exact golden cases).
 *
 * These assert the GOLDEN RULES from CLAUDE.md hold operationally:
 *  - integer money conservation under fully-neutral factors,
 *  - round-half-up (exact .5 boundary),
 *  - tax bounded by the target's positive gain and never on a loss,
 *  - determinism for a fixed seed,
 *  - stable leaderboard ordering (money desc, id asc).
 */
import { describe, expect, it } from "vitest";
import { settlePhase } from "../src/index.js";
import { makeRng } from "../src/rng.js";
import { drawEvent } from "../src/factors/event.js";
import { BP_ONE, REGION_IDS } from "@econwar/shared";
import type {
  ByRegion,
  DepartmentId,
  GameState,
  PhaseInputs,
  PhaseType,
  PlayerState,
} from "@econwar/shared";

/* ---------- helpers ---------- */

function regionMap(values: Partial<ByRegion<bigint>>): ByRegion<bigint> {
  return {
    central: values.central ?? 0n,
    north: values.north ?? 0n,
    south: values.south ?? 0n,
    northeast: values.northeast ?? 0n,
  };
}

function neutralTilt(): ByRegion<bigint> {
  return regionMap({
    central: BP_ONE,
    north: BP_ONE,
    south: BP_ONE,
    northeast: BP_ONE,
  });
}

function player(
  id: string,
  department: DepartmentId,
  money: bigint,
  pc = 0,
): PlayerState {
  return { id, nickname: id.toUpperCase(), department, money, pc };
}

function gameOf(players: PlayerState[], controllerId: string | null = null): GameState {
  return {
    id: "inv",
    mode: "solo",
    seed: 0,
    phaseIndex: 0,
    phaseOrder: ["boom", "recession", "recovery", "slowdown"],
    step: "settlement",
    players,
    controllerId,
    settled: false,
  };
}

/** Find a seed whose drawn event is "calm" (target=none, x1.0). */
function calmSeed(): number {
  for (let s = 0; s < 100_000; s++) {
    if (drawEvent(makeRng(s)).id === "calm") return s;
  }
  throw new Error("no calm seed found");
}

/** Find a seed whose drawn event hits a specific region with a known multiplier. */
function seedForEvent(eventId: string): number {
  for (let s = 0; s < 1_000_000; s++) {
    if (drawEvent(makeRng(s)).id === eventId) return s;
  }
  throw new Error(`no seed found for event ${eventId}`);
}

const CAP = 100_000_000n;

/* ---------- tests ---------- */

describe("settlePhase invariants", () => {
  it("conserves money exactly when nothing is allocated (unallocated carries 1:1)", () => {
    // The strongest *exact* conservation guarantee: capital left out of every
    // region is carried through untouched, regardless of phase/event. (No cell
    // has base×regional == 10000^2, so a fully-invested portfolio is never a
    // no-op; un-invested capital always is.)
    const seed = calmSeed();
    const p = player("p1", "ir", CAP);
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: { p1: regionMap({}) }, // allocate nothing
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [],
    };
    const res = settlePhase(gameOf([p]), inputs, seed);
    expect(res.players[0]!.endMoney).toBe(CAP);
    expect(res.players[0]!.grossAfterMarket).toBe(CAP);
  });

  it("portfolio identity: gross = sum(regionValues) + unallocated, with no tax", () => {
    const seed = calmSeed();
    const p = player("p1", "ir", CAP);
    const alloc = regionMap({ central: 30_000_000n, north: 20_000_000n, south: 10_000_000n });
    const allocSum = 30_000_000n + 20_000_000n + 10_000_000n;
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: { p1: alloc },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [],
    };
    const res = settlePhase(gameOf([p]), inputs, seed);
    const ps = res.players[0]!;
    expect(ps.unallocated).toBe(CAP - allocSum);
    const regionTotal = REGION_IDS.reduce(
      (acc, r) => acc + ps.regionResults[r].finalValue,
      0n,
    );
    expect(ps.grossAfterMarket).toBe(regionTotal + ps.unallocated);
    expect(ps.endMoney).toBe(ps.grossAfterMarket); // no tax in this case
  });

  it("is deterministic: same inputs + seed produce identical settlement", () => {
    const seed = 13579;
    const players = [
      player("p1", "sociology", CAP, 40),
      player("p2", "government", CAP, 40),
    ];
    const inputs: PhaseInputs = {
      phaseType: "recession",
      allocations: {
        p1: regionMap({ northeast: 60_000_000n, south: 40_000_000n }),
        p2: regionMap({ central: 100_000_000n }),
      },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [],
    };
    const a = settlePhase(gameOf(players), inputs, seed);
    const b = settlePhase(gameOf(players), inputs, seed);
    const norm = (x: unknown) =>
      JSON.stringify(x, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    expect(norm(a)).toBe(norm(b));
  });

  it("leaderboard is sorted by money desc, then id asc (stable tie-break)", () => {
    // Two players with identical allocations -> identical money -> id tie-break.
    const seed = calmSeed();
    const players = [
      player("pB", "ir", CAP),
      player("pA", "ir", CAP),
      player("pC", "ir", 50_000_000n),
    ];
    const sameAlloc = regionMap({ central: 30_000_000n });
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: {
        pA: sameAlloc,
        pB: sameAlloc,
        pC: regionMap({ central: 10_000_000n }),
      },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [],
    };
    const res = settlePhase(gameOf(players), inputs, seed);
    // pA and pB tie on money; pA < pB by id. pC has less money -> last.
    expect(res.leaderboard).toEqual(["pA", "pB", "pC"]);
    // verify monotonic non-increasing money along the leaderboard.
    const byId = new Map(res.players.map((p) => [p.playerId, p.endMoney]));
    for (let i = 1; i < res.leaderboard.length; i++) {
      const prev = byId.get(res.leaderboard[i - 1]!)!;
      const cur = byId.get(res.leaderboard[i]!)!;
      expect(prev >= cur).toBe(true);
    }
  });

  it("round-half-up: an exact .5 numerator rounds up by exactly 1 satang", () => {
    // Construct a single-region case where alloc*base*regional*tilt*event*ability
    // / 10000^5 lands on an exact .5. With calm event (x1.0) and neutral tilt &
    // ability, the chain is alloc*base*regional / 10000^2. Pick a *non-shared*
    // region/phase product, then choose alloc so the remainder is exactly half.
    // boom/central: base=13000, regional=10300 -> product=133900000. denom=10^8.
    // alloc * 133900000 must be ≡ 5*10^7 (mod 10^8) for a .5 boundary.
    // Solve: 1339*alloc ≡ 500 (mod 1000). 1339 mod 1000 = 339.
    // 339*alloc ≡ 500 (mod 1000). 339 inverse mod 1000 = 339*... try alloc=1500:
    // 339*1500=508500 -> mod 1000 = 500. ✓  So alloc=1500 satang gives exact .5.
    const seed = calmSeed();
    const alloc = 1500n;
    const p = player("p1", "ir", CAP);
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: { p1: regionMap({ central: alloc }) },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [],
    };
    const res = settlePhase(gameOf([p]), inputs, seed);
    // num = 1500 * 13000 * 10300 * 10000 * 10000 * 10000 = (exact)
    const num = 1500n * 13000n * 10300n * BP_ONE * BP_ONE * BP_ONE;
    const denom = BP_ONE ** 5n;
    // confirm we really hit a .5 boundary (remainder == denom/2)
    expect(num % denom).toBe(denom / 2n);
    const floor = num / denom;
    expect(res.players[0]!.regionResults.central.finalValue).toBe(floor + 1n);
  });

  it("tax never exceeds the target's positive gain and routes it to the actor", () => {
    // gov_tax = 15% of target's POSITIVE market gain. Use a region/event combo
    // that yields a gain for the target.
    const seed = calmSeed();
    const actor = player("gov", "government", CAP, 40);
    const target = player("vic", "ir", CAP, 40);
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: {
        gov: regionMap({ central: 50_000_000n }),
        vic: regionMap({ central: 100_000_000n }), // boom/central is strong -> gain
      },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [{ actorId: "gov", abilityId: "gov_tax", targetPlayerId: "vic" }],
    };
    const res = settlePhase(gameOf([actor, target]), inputs, seed);
    const tgt = res.players.find((p) => p.playerId === "vic")!;
    const act = res.players.find((p) => p.playerId === "gov")!;
    const gain = tgt.grossAfterMarket - CAP; // pre-tax positive gain
    expect(gain > 0n).toBe(true);
    expect(tgt.taxPaid > 0n).toBe(true);
    // tax is at most the whole gain (15% < 100%).
    expect(tgt.taxPaid <= gain).toBe(true);
    // transfer is conserved: what target pays, actor receives.
    expect(act.taxReceived).toBe(tgt.taxPaid);
    // expected: round_half_up(gain * 1500 / 10000)
    const expected = (gain * 1500n + BP_ONE / 2n) / BP_ONE;
    expect(tgt.taxPaid).toBe(expected);
  });

  it("tax does not fire when the target had a market loss", () => {
    // Drive the target into a loss: invest in a weak cell (recession/central is
    // base 8000 -> a loss) and avoid a positive event on it.
    const seed = seedForEvent("calm");
    const actor = player("gov", "government", CAP, 40);
    const target = player("vic", "ir", CAP, 40);
    const phase: PhaseType = "recession";
    const inputs: PhaseInputs = {
      phaseType: phase,
      allocations: {
        gov: regionMap({ northeast: 50_000_000n }),
        vic: regionMap({ central: 100_000_000n }), // recession/central -> loss
      },
      controllerTilt: neutralTilt(),
      controllerId: null,
      abilities: [{ actorId: "gov", abilityId: "gov_tax", targetPlayerId: "vic" }],
    };
    const res = settlePhase(gameOf([actor, target]), inputs, seed);
    const tgt = res.players.find((p) => p.playerId === "vic")!;
    const act = res.players.find((p) => p.playerId === "gov")!;
    expect(tgt.grossAfterMarket - CAP < 0n).toBe(true); // genuine loss
    expect(tgt.taxPaid).toBe(0n);
    expect(act.taxReceived).toBe(0n);
    expect(tgt.endMoney).toBe(tgt.grossAfterMarket);
  });

  it("controller's own boosted region carries the transparency penalty", () => {
    // A controller boosting their own region nets less than a non-controller with
    // the same allocation, because of CONTROLLER_TRANSPARENCY_PENALTY_BP.
    const seed = calmSeed();
    const boss = player("boss", "ir", CAP);
    const peon = player("peon", "ir", CAP);
    const tilt = regionMap({
      central: 12000n,
      north: BP_ONE,
      south: BP_ONE,
      northeast: BP_ONE,
    });
    const sameAlloc = regionMap({ central: 80_000_000n });
    const inputs: PhaseInputs = {
      phaseType: "boom",
      allocations: { boss: sameAlloc, peon: sameAlloc },
      controllerTilt: tilt,
      controllerId: "boss",
      abilities: [],
    };
    const res = settlePhase(gameOf([boss, peon], "boss"), inputs, seed);
    const b = res.players.find((p) => p.playerId === "boss")!;
    const p = res.players.find((p) => p.playerId === "peon")!;
    // Same investment, but the controller's boosted region is penalized.
    expect(
      b.regionResults.central.finalValue < p.regionResults.central.finalValue,
    ).toBe(true);
  });
});
