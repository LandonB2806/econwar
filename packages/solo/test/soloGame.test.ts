import { describe, expect, it } from "vitest";
import {
  PHASES_PER_GAME,
  REGION_IDS,
  STARTING_CAPITAL_SATANG,
} from "@econwar/shared";
import type { ByRegion, DepartmentId, Satang } from "@econwar/shared";
import { createSoloGame, SoloGame } from "../src/index.js";

const DEPTS: DepartmentId[] = [
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
];

/** Drive a game to completion with no human intents (all defaults). */
function runToEnd(seed: number, dept: DepartmentId): SoloGame {
  const game = createSoloGame({ seed, human: { nickname: "You", department: dept } });
  let guard = 0;
  while (!game.isOver()) {
    game.step();
    if (++guard > 1000) throw new Error("step loop did not terminate");
  }
  return game;
}

describe("SoloGame — full 4-phase game", () => {
  it("seats all 5 departments (human + 4 bots)", () => {
    const game = createSoloGame({ seed: 1, human: { nickname: "You", department: "ir" } });
    expect(game.getPlayers()).toHaveLength(5);
    const depts = new Set(game.getPlayers().map((p) => p.department));
    expect(depts.size).toBe(5);
  });

  it("runs to completion and yields exactly one winner", () => {
    const game = runToEnd(2024, "politics_global");
    expect(game.isOver()).toBe(true);
    expect(game.getPhaseIndex()).toBe(PHASES_PER_GAME - 1);

    const winner = game.getWinner();
    expect(winner).not.toBeNull();

    const board = game.getLeaderboard();
    expect(board).toHaveLength(5);
    expect(board[0]!.rank).toBe(1);
    expect(board[0]!.playerId).toBe(winner!.id);

    // Exactly one rank-1 row.
    expect(board.filter((r) => r.rank === 1)).toHaveLength(1);
  });

  it("settles every phase and records a settlement result", () => {
    const game = createSoloGame({ seed: 7, human: { nickname: "You", department: "government" } });
    let settlements = 0;
    while (!game.isOver()) {
      const before = game.getStep();
      game.step();
      if (before === "settlement") {
        expect(game.getLastSettlement()).not.toBeNull();
        settlements++;
      }
    }
    expect(settlements).toBe(PHASES_PER_GAME);
  });
});

describe("SoloGame — determinism", () => {
  it("same seed + same (default) intents → identical final leaderboard", () => {
    const a = runToEnd(12345, "sociology").getLeaderboard();
    const b = runToEnd(12345, "sociology").getLeaderboard();
    expect(serialize(a)).toBe(serialize(b));
  });

  it("same seed + same explicit human intents → identical final leaderboard", () => {
    const play = () => {
      const game = createSoloGame({
        seed: 555,
        human: { nickname: "You", department: "public_admin" },
      });
      while (!game.isOver()) {
        if (game.getStep() === "vote") {
          const cands = game.getCandidates();
          game.submitVote(cands[0]!.playerId);
        }
        if (game.getStep() === "allocation") {
          const money = game.getHuman().money;
          const each = money / 4n;
          const alloc = {} as ByRegion<Satang>;
          let used = 0n;
          for (const r of REGION_IDS) {
            alloc[r] = each;
            used += each;
          }
          alloc[REGION_IDS[0]!] += money - used; // exact sum
          game.submitAllocation(alloc);
        }
        game.step();
      }
      return game.getLeaderboard();
    };
    expect(serialize(play())).toBe(serialize(play()));
  });

  it("different seeds can produce different outcomes", () => {
    // Not guaranteed different, but the phase order shuffle should vary; assert
    // at least the games are well-formed and independent.
    const a = runToEnd(1, "ir");
    const b = runToEnd(2, "ir");
    expect(a.isOver()).toBe(true);
    expect(b.isOver()).toBe(true);
  });
});

describe("SoloGame — allocation invariants", () => {
  it("rejects a human allocation that exceeds available money", () => {
    const game = createSoloGame({ seed: 9, human: { nickname: "You", department: "ir" } });
    // advance to allocation
    while (game.getStep() !== "allocation") game.step();
    const tooMuch = {} as ByRegion<Satang>;
    for (const r of REGION_IDS) tooMuch[r] = STARTING_CAPITAL_SATANG;
    expect(() => game.submitAllocation(tooMuch)).toThrow();
  });

  it("rejects negative allocations", () => {
    const game = createSoloGame({ seed: 9, human: { nickname: "You", department: "ir" } });
    while (game.getStep() !== "allocation") game.step();
    const bad = {} as ByRegion<Satang>;
    for (const r of REGION_IDS) bad[r] = 0n;
    bad[REGION_IDS[0]!] = -1n;
    expect(() => game.submitAllocation(bad)).toThrow();
  });

  it("every player's money never goes negative across the game", () => {
    for (const dept of DEPTS) {
      const game = runToEnd(31, dept);
      for (const p of game.getPlayers()) {
        expect(p.money >= 0n, `${p.department} money ${p.money}`).toBe(true);
        expect(p.pc >= 0, `${p.department} pc ${p.pc}`).toBe(true);
      }
    }
  });
});

describe("SoloGame — controller intents", () => {
  it("rejects a controller tilt when the human is not the controller", () => {
    const game = createSoloGame({ seed: 4, human: { nickname: "You", department: "ir" } });
    while (game.getStep() !== "controller_action") game.step();
    if (!game.isHumanController()) {
      expect(() =>
        game.submitControllerTilt({ boostRegion: "central", magnitudeBp: 1000 }),
      ).toThrow();
    }
  });
});

function serialize(rows: ReturnType<SoloGame["getLeaderboard"]>): string {
  return JSON.stringify(
    rows.map((r) => ({ ...r, money: r.money.toString() })),
  );
}
