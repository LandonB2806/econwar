"""Plays one full 4-phase solo EconWar game through the real Python engine port.

Determinism: every random draw (phase order, per-phase event seed, the random
strategist's split) comes from the pinned mulberry32 RNG, seeded off the game
seed. No floats, no Math.random equivalents.

We deliberately exercise only the settlement path the TS engine shares:
allocations + per-phase event draw. To keep the gate purely about *allocation
skill* we run with neutral controller tilt and no abilities — abilities and the
controller meta-game are separate balance questions (flagged in the report).
"""
from econwar_engine.content import PHASE_TYPES, REGION_IDS
from econwar_engine.rng import make_rng, phase_seed
from econwar_engine.settle import settle_phase
from econwar_engine.shuffle import shuffled

from .strategies import random_alloc, skilled_alloc

STARTING_CAPITAL = 100_000_000  # ฿1,000,000 in satang (matches STARTING_CAPITAL_SATANG)
NEUTRAL_TILT = {r: 10000 for r in REGION_IDS}


def _phase_order(game_seed: int) -> list:
    """Deterministic hidden phase order for this game (Fisher-Yates on the RNG)."""
    return shuffled(PHASE_TYPES, make_rng(game_seed ^ 0x5BD1E995))


def play_game(game_seed: int, players: list) -> dict:
    """Run a 4-phase solo game.

    players: list of {"id", "department", "strategy"} where strategy is
             "skilled" or "random".
    Returns {"final_money": {id: satang}, "winner": id, "phase_order": [...]}.
    """
    phase_order = _phase_order(game_seed)

    # Mutable money ledger; everyone starts equal.
    state_players = [
        {"id": p["id"], "department": p["department"], "money": STARTING_CAPITAL, "pc": 0}
        for p in players
    ]
    strat_by_id = {p["id"]: p["strategy"] for p in players}

    # A dedicated RNG stream for the random strategists' splits, kept separate
    # from the engine's event RNG so allocation choices and events don't alias.
    alloc_rng = make_rng(game_seed ^ 0xA5A5A5A5)

    for phase_index, phase in enumerate(phase_order):
        allocations = {}
        for sp in state_players:
            budget = sp["money"]
            if strat_by_id[sp["id"]] == "skilled":
                allocations[sp["id"]] = skilled_alloc(budget, phase)
            else:
                allocations[sp["id"]] = random_alloc(budget, alloc_rng)

        inputs = {
            "phaseType": phase,
            "allocations": allocations,
            "controllerTilt": dict(NEUTRAL_TILT),
            "controllerId": None,
            "abilities": [],
        }
        seed = phase_seed(game_seed, phase_index)
        result = settle_phase({"players": state_players, "controllerId": None}, inputs, seed)

        end_by_id = {ps["playerId"]: ps["endMoney"] for ps in result["players"]}
        for sp in state_players:
            sp["money"] = end_by_id[sp["id"]]

    final_money = {sp["id"]: sp["money"] for sp in state_players}
    # Winner: most money, tie-break by id ascending (matches engine leaderboard).
    winner = min(final_money.items(), key=lambda kv: (-kv[1], kv[0]))[0]
    return {"final_money": final_money, "winner": winner, "phase_order": phase_order}
