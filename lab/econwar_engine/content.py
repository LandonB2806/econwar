"""Loads the same data-driven content JSON the TS engine uses.

Single source of truth: packages/shared/src/content/*.json. The Python lab must
never fork these numbers, or parity breaks.
"""
import json
from pathlib import Path

REGION_IDS = ("central", "north", "south", "northeast")
PHASE_TYPES = ("boom", "recession", "recovery", "slowdown")

_REPO_ROOT = Path(__file__).resolve().parents[2]
_CONTENT_DIR = _REPO_ROOT / "packages" / "shared" / "src" / "content"


def _load(name: str) -> dict:
    with open(_CONTENT_DIR / name, encoding="utf-8") as f:
        return json.load(f)


_regions = {r["id"]: r for r in _load("regions.json")["regions"]}
_phases = {p["type"]: p for p in _load("phases.json")["phases"]}
_departments = {d["id"]: d for d in _load("departments.json")["departments"]}
_abilities = {a["id"]: a for a in _load("abilities.json")["abilities"]}
EVENT_DECK = _load("eventDeck.json")["events"]


def base_phase_effect(phase: str, region: str) -> int:
    return _phases[phase]["baseEffect"][region]


def regional_modifier(region: str, phase: str) -> int:
    return _regions[region]["modifier"][phase]


def department(dep_id: str) -> dict:
    return _departments[dep_id]


def ability(ability_id: str) -> dict:
    return _abilities[ability_id]
