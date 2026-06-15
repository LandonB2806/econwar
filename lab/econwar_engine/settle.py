"""settle_phase — Python port of packages/engine/src/settlePhase.ts.

Integer-only arithmetic (Python ints are arbitrary precision, standing in for
the TS BigInt chain). Factor order and round-half-up-once are identical, so the
output must match the TS engine byte-for-byte.
"""
from .content import (
    EVENT_DECK,
    REGION_IDS,
    ability,
    base_phase_effect,
    department,
    regional_modifier,
)
from .rng import make_rng

BP_ONE = 10000
SETTLEMENT_DENOM = BP_ONE ** 5
CONTROLLER_TRANSPARENCY_PENALTY_BP = 1000


def round_half_up(num: int, den: int) -> int:
    return (num + den // 2) // den


def draw_event(rng) -> dict:
    total = sum(e["weight"] for e in EVENT_DECK)
    roll = rng.next_below(total)
    for e in EVENT_DECK:
        if roll < e["weight"]:
            return e
        roll -= e["weight"]
    return EVENT_DECK[-1]


def event_multiplier_for(event: dict, region: str) -> int:
    target = event["target"]
    if target == "none":
        return BP_ONE
    if target == "all":
        return event["multiplierBp"]
    return event["multiplierBp"] if target == region else BP_ONE


def _neutral_region_map() -> dict:
    return {r: BP_ONE for r in REGION_IDS}


def resolve_abilities(activations: list) -> dict:
    global_region_mult = _neutral_region_map()
    self_region_mult: dict = {}
    taxes: list = []

    for act in activations:
        d = ability(act["abilityId"])
        kind = d["kind"]
        if kind == "GLOBAL_REGION_MULT":
            region = act.get("targetRegion")
            if region is None:
                continue
            global_region_mult[region] = (
                global_region_mult[region] * d["magnitudeBp"]
            ) // BP_ONE
        elif kind == "REGION_MULT":
            region = act.get("targetRegion")
            if region is None:
                continue
            self_map = self_region_mult.setdefault(
                act["actorId"], _neutral_region_map()
            )
            self_map[region] = (self_map[region] * d["magnitudeBp"]) // BP_ONE
        elif kind == "TAX":
            target_id = act.get("targetPlayerId")
            if target_id is None:
                continue
            taxes.append(
                {
                    "actorId": act["actorId"],
                    "targetId": target_id,
                    "bp": d["magnitudeBp"],
                }
            )
        # INFO / REBALANCE: no settlement effect.

    return {
        "globalRegionMult": global_region_mult,
        "selfRegionMult": self_region_mult,
        "taxes": taxes,
    }


def ability_multiplier(resolved: dict, player_id: str, region: str) -> int:
    self_map = resolved["selfRegionMult"].get(player_id)
    self_bp = self_map[region] if self_map else BP_ONE
    return (resolved["globalRegionMult"][region] * self_bp) // BP_ONE


def settle_phase(state: dict, inputs: dict, seed: int) -> dict:
    phase = inputs["phaseType"]
    rng = make_rng(seed)
    event = draw_event(rng)
    resolved = resolve_abilities(inputs["abilities"])

    pc_spent_by_player: dict = {}
    for act in inputs["abilities"]:
        cost = ability(act["abilityId"])["pcCost"]
        pc_spent_by_player[act["actorId"]] = (
            pc_spent_by_player.get(act["actorId"], 0) + cost
        )

    players = sorted(state["players"], key=lambda p: p["id"])

    settlements: dict = {}
    market_gain: dict = {}
    controller_id = inputs.get("controllerId")

    for p in players:
        alloc = inputs["allocations"].get(p["id"], {})
        region_results = {}
        alloc_sum = 0
        region_total = 0

        for region in REGION_IDS:
            allocated = alloc.get(region, 0)
            alloc_sum += allocated

            base = base_phase_effect(phase, region)
            regional = regional_modifier(region, phase)

            tilt = inputs["controllerTilt"].get(region, BP_ONE)
            if p["id"] == controller_id and tilt > BP_ONE:
                tilt = (tilt * (BP_ONE - CONTROLLER_TRANSPARENCY_PENALTY_BP)) // BP_ONE

            ev = event_multiplier_for(event, region)
            ab = ability_multiplier(resolved, p["id"], region)

            num = allocated * base * regional * tilt * ev * ab
            final_value = round_half_up(num, SETTLEMENT_DENOM)
            region_results[region] = {"allocated": allocated, "finalValue": final_value}
            region_total += final_value

        unallocated = p["money"] - alloc_sum
        gross = region_total + unallocated
        market_gain[p["id"]] = gross - p["money"]

        pc_spent = pc_spent_by_player.get(p["id"], 0)
        pc_earned = department(p["department"])["pcRate"][phase]

        settlements[p["id"]] = {
            "playerId": p["id"],
            "startMoney": p["money"],
            "regionResults": region_results,
            "unallocated": unallocated,
            "grossAfterMarket": gross,
            "taxPaid": 0,
            "taxReceived": 0,
            "endMoney": gross,
            "pcStart": p["pc"],
            "pcSpent": pc_spent,
            "pcEarned": pc_earned,
            "pcEnd": p["pc"] - pc_spent + pc_earned,
        }

    for tax in resolved["taxes"]:
        target = settlements.get(tax["targetId"])
        actor = settlements.get(tax["actorId"])
        if target is None or actor is None:
            continue
        gain = market_gain.get(tax["targetId"], 0)
        if gain <= 0:
            continue
        amount = round_half_up(gain * tax["bp"], BP_ONE)
        if amount <= 0:
            continue
        target["taxPaid"] += amount
        target["endMoney"] -= amount
        actor["taxReceived"] += amount
        actor["endMoney"] += amount

    player_results = [settlements[p["id"]] for p in players]
    leaderboard = [
        s["playerId"]
        for s in sorted(
            player_results,
            key=lambda s: (-s["endMoney"], s["playerId"]),
        )
    ]

    return {
        "seed": seed,
        "phaseType": phase,
        "event": event,
        "players": player_results,
        "leaderboard": leaderboard,
    }
