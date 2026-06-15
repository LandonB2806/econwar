import { describe, expect, it } from "vitest";
import { tallyVotes } from "../src/index.js";
import { voteWeight } from "@econwar/shared";
import type { Candidate, Vote } from "@econwar/shared";

const candidates: Candidate[] = [
  { playerId: "gov", department: "government" },
  { playerId: "ir", department: "ir" },
];

describe("voteWeight", () => {
  it("1 + min(floor(pc/20), 3)", () => {
    expect(voteWeight(0)).toBe(1);
    expect(voteWeight(19)).toBe(1);
    expect(voteWeight(20)).toBe(2);
    expect(voteWeight(60)).toBe(4);
    expect(voteWeight(1000)).toBe(4); // capped at +3
  });
});

describe("tallyVotes", () => {
  it("elects the highest weighted candidate", () => {
    const votes: Vote[] = [
      { voterId: "a", candidateId: "gov", voterPc: 60 }, // weight 4
      { voterId: "b", candidateId: "ir", voterPc: 0 }, // weight 1
      { voterId: "c", candidateId: "ir", voterPc: 0 }, // weight 1
    ];
    const r = tallyVotes(votes, candidates, 1);
    expect(r.winnerId).toBe("gov");
    expect(r.tieBreak).toBe("none");
    expect(r.tally).toEqual({ gov: 4, ir: 2 });
  });

  it("breaks a weighted tie in favor of fewer bonus weight (underdog)", () => {
    const votes: Vote[] = [
      { voterId: "a", candidateId: "gov", voterPc: 40 }, // weight 3 (bonus 2)
      { voterId: "b", candidateId: "ir", voterPc: 0 }, // weight 1
      { voterId: "c", candidateId: "ir", voterPc: 0 }, // weight 1
      { voterId: "d", candidateId: "ir", voterPc: 0 }, // weight 1 -> ir total 3, bonus 0
    ];
    const r = tallyVotes(votes, candidates, 1);
    expect(r.tally).toEqual({ gov: 3, ir: 3 });
    expect(r.winnerId).toBe("ir");
    expect(r.tieBreak).toBe("fewer_bonus");
  });

  it("is deterministic under the seeded-RNG tie-break", () => {
    const votes: Vote[] = [
      { voterId: "a", candidateId: "gov", voterPc: 0 },
      { voterId: "b", candidateId: "ir", voterPc: 0 },
    ];
    const r1 = tallyVotes(votes, candidates, 99);
    const r2 = tallyVotes(votes, candidates, 99);
    expect(r1.winnerId).toBe(r2.winnerId);
    expect(r1.tieBreak).toBe("seeded_rng");
  });
});
