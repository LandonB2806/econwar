import { describe, expect, it } from "vitest";
import { REGION_IDS, STARTING_CAPITAL_SATANG } from "@econwar/shared";
import type { DepartmentId, PlayerState } from "@econwar/shared";
import { makeRng } from "@econwar/engine";
import {
  decideAbility,
  decideAllocation,
  decideControllerTilt,
  decideVote,
  type BotContext,
  type PublicPlayerInfo,
} from "../src/index.js";

const DEPTS: DepartmentId[] = [
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
];

function player(dept: DepartmentId, money = STARTING_CAPITAL_SATANG, pc = 0): PlayerState {
  return { id: `p_${dept}`, nickname: `${dept}`, department: dept, money, pc };
}

function ctxFor(self: PlayerState, others: PlayerState[]): BotContext {
  const all = [self, ...others];
  const players: PublicPlayerInfo[] = all.map((p) => ({
    id: p.id,
    nickname: p.nickname,
    department: p.department,
    money: p.money,
    pc: p.pc,
  }));
  return {
    self,
    phaseIndex: 0,
    candidates: all.map((p) => ({ playerId: p.id, department: p.department })),
    players,
  };
}

describe("bot allocations", () => {
  it("always sum to <= money and never exceed it, for every department", () => {
    for (const dept of DEPTS) {
      const self = player(dept);
      const ctx = ctxFor(self, DEPTS.filter((d) => d !== dept).map((d) => player(d)));
      const alloc = decideAllocation(ctx, makeRng(7));
      let sum = 0n;
      for (const r of REGION_IDS) {
        expect(alloc[r] >= 0n, `${dept}.${r} non-negative`).toBe(true);
        sum += alloc[r];
      }
      expect(sum <= self.money, `${dept} alloc ${sum} <= ${self.money}`).toBe(true);
    }
  });

  it("deploys nothing when the player is broke", () => {
    const self = player("ir", 0n);
    const alloc = decideAllocation(ctxFor(self, []), makeRng(1));
    let sum = 0n;
    for (const r of REGION_IDS) sum += alloc[r];
    expect(sum).toBe(0n);
  });

  it("is deterministic given the same context", () => {
    const self = player("politics_global");
    const ctx = ctxFor(self, DEPTS.filter((d) => d !== "politics_global").map((d) => player(d)));
    const a = decideAllocation(ctx, makeRng(99));
    const b = decideAllocation(ctx, makeRng(123));
    for (const r of REGION_IDS) expect(a[r]).toBe(b[r]);
  });
});

describe("bot votes", () => {
  it("returns a valid candidate id for every department", () => {
    for (const dept of DEPTS) {
      const self = player(dept);
      const others = DEPTS.filter((d) => d !== dept).map((d) => player(d));
      const ctx = ctxFor(self, others);
      const vote = decideVote(ctx);
      expect(ctx.candidates.some((c) => c.playerId === vote)).toBe(true);
    }
  });

  it("votes for its own department slate candidate", () => {
    const self = player("sociology");
    const ctx = ctxFor(self, DEPTS.filter((d) => d !== "sociology").map((d) => player(d)));
    expect(decideVote(ctx)).toBe(self.id);
  });
});

describe("bot controller tilt", () => {
  it("boosts a real region with a bounded positive magnitude", () => {
    const self = player("government");
    const choice = decideControllerTilt(ctxFor(self, []));
    expect(REGION_IDS.includes(choice.boostRegion!)).toBe(true);
    expect(choice.magnitudeBp).toBeGreaterThan(0);
  });
});

describe("bot ability", () => {
  it("never fires when it cannot afford the PC cost", () => {
    for (const dept of DEPTS) {
      const self = player(dept, STARTING_CAPITAL_SATANG, 0);
      const ctx = ctxFor(self, DEPTS.filter((d) => d !== dept).map((d) => player(d)));
      expect(decideAbility(ctx, makeRng(3))).toBeNull();
    }
  });

  it("government taxes the richest rival when it has PC", () => {
    const self = player("government", STARTING_CAPITAL_SATANG, 50);
    const rich = player("politics_global", STARTING_CAPITAL_SATANG * 2n, 0);
    const poor = player("ir", STARTING_CAPITAL_SATANG / 2n, 0);
    const act = decideAbility(ctxFor(self, [rich, poor]), makeRng(5));
    expect(act).not.toBeNull();
    expect(act!.abilityId).toBe("gov_tax");
    expect(act!.targetPlayerId).toBe(rich.id);
  });

  it("sociology targets a region when it has PC", () => {
    const self = player("sociology", STARTING_CAPITAL_SATANG, 50);
    const act = decideAbility(ctxFor(self, []), makeRng(5));
    expect(act).not.toBeNull();
    expect(act!.abilityId).toBe("soc_marketmove");
    expect(REGION_IDS.includes(act!.targetRegion!)).toBe(true);
  });
});
