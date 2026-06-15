"""Deterministic Fisher-Yates shuffle — additive helper for the balance lab.

Mirrors packages/engine/src/stateMachine.ts shufflePhaseOrder: it consumes the
pinned mulberry32 stream (rng.next_below) so a (seed) reproduces an identical
permutation in TS and Python. This does NOT touch settlement math.
"""
from .rng import Rng


def shuffle_in_place(items: list, rng: Rng) -> list:
    """Fisher-Yates over `items` using the pinned RNG. Returns the same list."""
    for i in range(len(items) - 1, 0, -1):
        j = rng.next_below(i + 1)
        items[i], items[j] = items[j], items[i]
    return items


def shuffled(items, rng: Rng) -> list:
    """Non-mutating shuffle: copy `items`, shuffle the copy, return it."""
    out = list(items)
    return shuffle_in_place(out, rng)
