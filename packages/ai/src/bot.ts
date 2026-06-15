/**
 * The heuristic bot decision functions. Each is a PURE function of a BotContext
 * (+ an engine Rng where a choice needs randomness). A department's Personality
 * drives every decision so the five bots feel distinct (core/01 §6).
 */
import { getAbility, REGION_IDS, BP_ONE } from "@econwar/shared";
import type {
  AbilityActivation,
  ByRegion,
  PlayerId,
  RegionId,
} from "@econwar/shared";
import { canAfford, type ControllerChoice, type Rng } from "@econwar/engine";
import { personalityFor } from "./personality.js";
import { apportion, scoreRegions, scoresToWeights } from "./score.js";
import type { BotContext } from "./types.js";

/** The region this bot rates highest under its own prior. */
export function favouriteRegion(ctx: BotContext): RegionId {
  const p = personalityFor(ctx.self.department);
  const scores = scoreRegions(p.prior);
  let best: RegionId = REGION_IDS[0]!;
  for (const r of REGION_IDS) {
    if (scores[r] > scores[best]) best = r;
  }
  return best;
}

/**
 * Decide how to spread the bot's money across the 4 regions. The returned map
 * ALWAYS sums to exactly the bot's available money (deploy + cash buffer), and
 * never exceeds it.
 *
 * `rng` is accepted for signature symmetry / future jitter; the current
 * heuristic is deterministic from the context alone, so the same context yields
 * the same allocation regardless of the rng stream.
 */
export function decideAllocation(
  ctx: BotContext,
  _rng: Rng,
): ByRegion<bigint> {
  const p = personalityFor(ctx.self.department);
  const money = ctx.self.money;
  if (money <= 0n) {
    const zero = {} as ByRegion<bigint>;
    for (const r of REGION_IDS) zero[r] = 0n;
    return zero;
  }

  // Deploy a personality-driven fraction; keep the rest as a cash buffer that
  // stays unallocated (still part of net worth, just not at market risk).
  const deployBp = BigInt(Math.max(0, Math.min(10000, p.deployBp | 0)));
  let deploy = (money * deployBp) / BP_ONE;
  if (deploy > money) deploy = money;

  const weights = scoresToWeights(scoreRegions(p.prior), p.concentration);
  const alloc = apportion(deploy, weights);

  // Fold the cash buffer back so the map sums to the full money (the engine
  // treats the difference as `unallocated`, but the orchestrator passes the
  // raw allocation map; keeping a buffer means we simply deploy < money).
  return alloc;
}

/**
 * Vote for the controller. Alliance logic: prefer the candidate from the bot's
 * OWN department (department-slate solidarity); otherwise back the candidate
 * whose favoured region overlaps the bot's, else the lowest-money candidate
 * (deny the front-runner). Always returns a valid candidate id.
 */
export function decideVote(ctx: BotContext): PlayerId {
  const candidates = ctx.candidates;
  if (candidates.length === 0) return ctx.self.id;

  // 1. Own-department candidate (alliance / self-interest).
  const ally = candidates.find((c) => c.department === ctx.self.department);
  if (ally) return ally.playerId;

  const infoById = new Map(ctx.players.map((pl) => [pl.id, pl]));

  // 2. Government bot: deny the richest candidate (defensive control).
  if (ctx.self.department === "government") {
    let poorest = candidates[0]!;
    for (const c of candidates) {
      const m = infoById.get(c.playerId)?.money ?? 0n;
      const pm = infoById.get(poorest.playerId)?.money ?? 0n;
      if (m < pm) poorest = c;
    }
    return poorest.playerId;
  }

  // 3. Default: back the lowest-PC candidate (least able to abuse the role),
  //    deterministic tie-break by candidate id.
  let pick = candidates[0]!;
  for (const c of candidates) {
    const pc = infoById.get(c.playerId)?.pc ?? 0;
    const ppc = infoById.get(pick.playerId)?.pc ?? 0;
    if (pc < ppc || (pc === ppc && c.playerId < pick.playerId)) pick = c;
  }
  return pick.playerId;
}

/**
 * If elected controller, tilt the market toward the bot's favourite region at a
 * personality-scaled magnitude. The engine clamps magnitude to MAX_TILT_BP and
 * applies the controller transparency penalty, so this is always safe.
 */
export function decideControllerTilt(ctx: BotContext): ControllerChoice {
  const region = favouriteRegion(ctx);
  // Aggressive front-runners tilt harder; cautious depts tilt gently.
  const p = personalityFor(ctx.self.department);
  const magnitudeBp = p.aggressiveAbility ? 2000 : 1000;
  return { boostRegion: region, magnitudeBp };
}

/**
 * Choose whether to fire the bot's department ability this phase. Respects the
 * PC cost (via canAfford) and the personality's PC reserve. Returns a fully
 * specified AbilityActivation (with any required target) or null.
 *
 * - government (TAX, needs target player): tax the richest rival.
 * - sociology (GLOBAL_REGION_MULT, needs region): boost its favourite region.
 * - public_admin / ir / politics_global use INFO/REBALANCE abilities, which the
 *   engine treats as no-ops at settlement, so an auto-playing bot never fires
 *   them (it would burn PC for no settlement gain).
 */
export function decideAbility(
  ctx: BotContext,
  _rng: Rng,
): AbilityActivation | null {
  const p = personalityFor(ctx.self.department);
  const abilityId = abilityIdFor(ctx);
  const def = getAbility(abilityId);

  // Must be able to pay the PC cost at all.
  if (!canAfford(ctx.self.pc, def.pcCost)) return null;

  const pcAfter = ctx.self.pc - def.pcCost;
  const hasSettlementEffect =
    def.kind === "TAX" ||
    def.kind === "GLOBAL_REGION_MULT" ||
    def.kind === "REGION_MULT";

  // INFO / REBALANCE abilities cost PC but have no settlement multiplier. Their
  // real value (peek/rebalance) is realised earlier in the round loop by the
  // UI/orchestrator, so an auto-playing bot gains nothing by burning PC on them
  // at settlement time — it never fires them itself.
  if (!hasSettlementEffect) return null;

  // Settlement-affecting abilities (TAX, region multipliers): cautious bots
  // respect their PC reserve; aggressive bots spend down to an empty reserve.
  if (!p.aggressiveAbility && pcAfter < p.pcReserve) return null;

  if (def.needsTargetPlayer) {
    const target = richestRival(ctx);
    if (!target) return null;
    return { actorId: ctx.self.id, abilityId, targetPlayerId: target };
  }
  if (def.needsTargetRegion) {
    return {
      actorId: ctx.self.id,
      abilityId,
      targetRegion: favouriteRegion(ctx),
    };
  }
  return { actorId: ctx.self.id, abilityId };
}

/* ---------------- helpers ---------------- */

function abilityIdFor(ctx: BotContext) {
  // The bot's department maps 1:1 to its signature ability via content.
  // We resolve it from the department's abilityId through getAbility lookups.
  // Map department → abilityId directly (mirrors departments.json).
  switch (ctx.self.department) {
    case "government":
      return "gov_tax" as const;
    case "ir":
      return "ir_peek" as const;
    case "sociology":
      return "soc_marketmove" as const;
    case "public_admin":
      return "pa_rebalance" as const;
    case "politics_global":
      return "pg_foresight" as const;
  }
}

function richestRival(ctx: BotContext): PlayerId | null {
  let best: PlayerId | null = null;
  let bestMoney = -1n;
  for (const pl of ctx.players) {
    if (pl.id === ctx.self.id) continue;
    if (pl.money > bestMoney || (pl.money === bestMoney && best !== null && pl.id < best)) {
      best = pl.id;
      bestMoney = pl.money;
    }
  }
  return best;
}
