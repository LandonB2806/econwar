import json
from pathlib import Path

from econwar_engine.rng import make_rng, phase_seed

GOLDEN = Path(__file__).resolve().parents[2] / "golden" / "rng_vector.json"


def test_rng_matches_golden_vector():
    """Python mulberry32 must reproduce the TS-locked uint32 stream exactly."""
    vec = json.loads(GOLDEN.read_text(encoding="utf-8"))
    rng = make_rng(vec["seed"])
    got = [rng.next_u32() for _ in vec["u32"]]
    assert got == vec["u32"]


def test_next_below_range():
    rng = make_rng(42)
    for _ in range(1000):
        x = rng.next_below(7)
        assert 0 <= x < 7


def test_phase_seed_stable_and_distinct():
    assert phase_seed(12345, 0) == phase_seed(12345, 0)
    assert phase_seed(12345, 0) != phase_seed(12345, 1)
