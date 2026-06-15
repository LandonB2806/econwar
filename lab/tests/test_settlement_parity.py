"""Cross-language parity: the Python port must reproduce the committed golden
settlement cases that the TypeScript engine produced. If TS and Python ever
diverge, this fails (golden rule #7)."""
import json
from pathlib import Path

import pytest

from econwar_engine.content import REGION_IDS
from econwar_engine.settle import settle_phase

GOLDEN = Path(__file__).resolve().parents[2] / "golden" / "settlement_cases.json"
CASES = json.loads(GOLDEN.read_text(encoding="utf-8"))["cases"]


def _to_int_region_map(src: dict) -> dict:
    return {r: int(src.get(r, "0")) for r in REGION_IDS}


def _build(case: dict):
    state = {
        "players": [
            {
                "id": p["id"],
                "department": p["department"],
                "money": int(p["money"]),
                "pc": p["pc"],
            }
            for p in case["players"]
        ],
        "controllerId": case["controllerId"],
    }
    inputs = {
        "phaseType": case["phaseType"],
        "allocations": {
            pid: _to_int_region_map(m) for pid, m in case["allocations"].items()
        },
        "controllerTilt": _to_int_region_map(case["controllerTilt"]),
        "controllerId": case["controllerId"],
        "abilities": case["abilities"],
    }
    return state, inputs


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_settlement_matches_golden(case):
    state, inputs = _build(case)
    result = settle_phase(state, inputs, case["seed"])

    assert result["event"]["id"] == case["expected"]["eventId"]
    assert result["leaderboard"] == case["expected"]["leaderboard"]

    by_id = {p["playerId"]: p for p in result["players"]}
    for pid, exp in case["expected"]["players"].items():
        got = by_id[pid]
        assert str(got["endMoney"]) == exp["endMoney"], f"{pid}.endMoney"
        assert str(got["grossAfterMarket"]) == exp["grossAfterMarket"], f"{pid}.gross"
        assert str(got["taxPaid"]) == exp["taxPaid"], f"{pid}.taxPaid"
        assert str(got["taxReceived"]) == exp["taxReceived"], f"{pid}.taxReceived"
        assert got["pcEnd"] == exp["pcEnd"], f"{pid}.pcEnd"
        for r in REGION_IDS:
            assert str(got["regionResults"][r]["finalValue"]) == exp[
                "regionResults"
            ][r], f"{pid}.{r}"
