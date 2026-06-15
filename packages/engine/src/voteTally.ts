/**
 * Department-slate Market Controller election (designed for 260 players).
 *
 * Each of the 5 departments fields 1 candidate → a ≤5-card ballot.
 *   voteWeight(pc) = 1 + min(floor(pc / PC_PER_BONUS_VOTE), MAX_BONUS_VOTES)
 *
 * Tie-break order (all deterministic):
 *   1. highest weighted total
 *   2. fewer bonus weight   (the less PC-boosted candidate — underdog on money)
 *   3. fewer raw headcount   (underdog department)
 *   4. seeded RNG            (last resort)
 */
import { voteWeight } from "@econwar/shared";
import type { Candidate, PlayerId, Vote, VoteResult } from "@econwar/shared";
import { makeRng } from "./rng.js";

interface Bucket {
  candidateId: PlayerId;
  weighted: number;
  bonus: number;
  headcount: number;
}

export function tallyVotes(
  votes: readonly Vote[],
  candidates: readonly Candidate[],
  seed: number,
): VoteResult {
  const buckets = new Map<PlayerId, Bucket>();
  for (const c of candidates) {
    buckets.set(c.playerId, {
      candidateId: c.playerId,
      weighted: 0,
      bonus: 0,
      headcount: 0,
    });
  }

  for (const v of votes) {
    const b = buckets.get(v.candidateId);
    if (!b) continue; // vote for a non-candidate is ignored
    const w = voteWeight(v.voterPc);
    b.weighted += w;
    b.bonus += w - 1;
    b.headcount += 1;
  }

  const all = [...buckets.values()];
  const tally: Record<PlayerId, number> = {};
  for (const b of all) tally[b.candidateId] = b.weighted;

  // 1. highest weighted
  const maxWeighted = Math.max(...all.map((b) => b.weighted));
  let pool = all.filter((b) => b.weighted === maxWeighted);
  if (pool.length === 1) {
    return { winnerId: pool[0]!.candidateId, tally, tieBreak: "none" };
  }

  // 2. fewer bonus weight
  const minBonus = Math.min(...pool.map((b) => b.bonus));
  let next = pool.filter((b) => b.bonus === minBonus);
  if (next.length === 1) {
    return { winnerId: next[0]!.candidateId, tally, tieBreak: "fewer_bonus" };
  }
  pool = next;

  // 3. fewer raw headcount (underdog department)
  const minHead = Math.min(...pool.map((b) => b.headcount));
  next = pool.filter((b) => b.headcount === minHead);
  if (next.length === 1) {
    return {
      winnerId: next[0]!.candidateId,
      tally,
      tieBreak: "underdog_dept",
    };
  }
  pool = next;

  // 4. seeded RNG over a stable (id-sorted) pool
  const sorted = [...pool].sort((a, b) =>
    a.candidateId < b.candidateId ? -1 : 1,
  );
  const rng = makeRng(seed);
  const idx = rng.nextBelow(sorted.length);
  return { winnerId: sorted[idx]!.candidateId, tally, tieBreak: "seeded_rng" };
}
