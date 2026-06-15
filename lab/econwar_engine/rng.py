"""mulberry32 — the pinned PRNG, ported to match the TS engine bit-for-bit.

All ops are performed on unsigned 32-bit values (masked), which reproduces
JS's int32/uint32/Math.imul semantics exactly.
"""

MASK32 = 0xFFFFFFFF
GOLDEN_RATIO = 0x9E3779B1


def _imul(a: int, b: int) -> int:
    """Equivalent of JS Math.imul on the low 32 bits."""
    return (a * b) & MASK32


class Rng:
    def __init__(self, seed: int) -> None:
        self.a = seed & MASK32

    def next_u32(self) -> int:
        self.a = (self.a + 0x6D2B79F5) & MASK32
        a = self.a
        t = _imul(a ^ (a >> 15), (1 | a) & MASK32)
        t = (((t + _imul(t ^ (t >> 7), (61 | t) & MASK32)) & MASK32) ^ t) & MASK32
        return (t ^ (t >> 14)) & MASK32

    def next_below(self, n: int) -> int:
        if not isinstance(n, int) or n <= 0:
            raise ValueError(f"next_below requires a positive integer, got {n}")
        u = self.next_u32()
        return (u * n) >> 32


def make_rng(seed: int) -> Rng:
    return Rng(seed)


def phase_seed(game_seed: int, phase_index: int) -> int:
    return (game_seed ^ _imul(phase_index + 1, GOLDEN_RATIO)) & MASK32
