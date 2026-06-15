"""Allocation strategies for the balance simulation.

Everything here is integer-only and deterministic given a seeded RNG. Strategies
return an allocation map {region -> satang} that sums to exactly `budget`.

The two strategies under test:

  * SKILLED  — invests where the expected per-baht return is highest. It does NOT
               see the hidden phase perfectly: it scores each region by the mean
               of (basePhaseEffect x regionalModifier) across all 4 phase types,
               then tilts that score toward the *actual* phase to model the mild
               foresight a careful player gets from reading indicators (and, for
               the strategist dept, the Foresight ability). It concentrates the
               whole budget on the single best-scoring region.

  * RANDOM   — splits the budget across regions by an arbitrary seeded weighting,
               i.e. a player who guesses. No use of the factor tables at all.

We deliberately keep SKILLED simple and legible: the point of the gate is to show
that *using the tables beats not using them*, not to find an optimum.
"""
from econwar_engine.content import PHASE_TYPES, REGION_IDS, base_phase_effect, regional_modifier

BP_ONE = 10000

# How strongly the skilled player weights the true upcoming phase vs. the
# blind average across all phases. 0 = no foresight (pure average), higher =
# sharper read. Expressed as an integer weight added to the true phase's vote.
FORESIGHT_WEIGHT = 2


def _region_score(region: str, phase: str) -> int:
    """Expected gross multiplier for 1.0 allocation, in bp^2 (integer).

    base x regional, both in bp -> product is bp-squared. We never divide, so it
    stays an exact integer and comparisons between regions are exact.
    """
    return base_phase_effect(phase, region) * regional_modifier(region, phase)


def skilled_alloc(budget: int, true_phase: str) -> dict:
    """Concentrate the budget on the best expected-return region.

    Score(region) = sum over phases of region_score, with the true phase counted
    (1 + FORESIGHT_WEIGHT) times to model partial foresight. Ties break by the
    fixed REGION_IDS order (deterministic).
    """
    best_region = None
    best_score = -1
    for region in REGION_IDS:
        score = 0
        for phase in PHASE_TYPES:
            weight = 1 + (FORESIGHT_WEIGHT if phase == true_phase else 0)
            score += weight * _region_score(region, phase)
        if score > best_score:
            best_score = score
            best_region = region

    alloc = {r: 0 for r in REGION_IDS}
    alloc[best_region] = budget
    return alloc


def random_alloc(budget: int, rng) -> dict:
    """Arbitrary seeded split across all four regions, summing to `budget`.

    Weights are drawn from the pinned RNG in [1, 16]; the last region absorbs the
    rounding remainder so the allocation sums to exactly `budget` (no leakage).
    """
    weights = [1 + rng.next_below(16) for _ in REGION_IDS]
    total = sum(weights)
    alloc = {}
    allocated = 0
    for i, region in enumerate(REGION_IDS):
        if i == len(REGION_IDS) - 1:
            alloc[region] = budget - allocated  # remainder -> exact sum
        else:
            part = (budget * weights[i]) // total
            alloc[region] = part
            allocated += part
    return alloc
