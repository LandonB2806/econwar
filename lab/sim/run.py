"""EconWar balance gate (Milestone 1): does skilled play beat random play?

Runs N deterministic 4-phase solo games. Each game seats a fixed table of
players: a mix of SKILLED and RANDOM strategists (one per department, so PC
rates differ but PC is unused here — settlement turns purely on allocation).
We record who wins each game and each strategy's final net worth.

PASS criteria (all must hold):
  1. Skilled win-rate is far above the fair share (a skilled seat winning at
     least ~2x its proportional share of seats).
  2. Skilled mean AND median net worth exceed random's.

Reproducible: everything keys off BASE_SEED. Run:  python lab/sim/run.py
Optional:  python lab/sim/run.py --games 5000 --seed 999

stdlib-only by default; uses numpy/pandas for the summary if available, else
falls back to the `statistics` module. Engine math never uses floats.
"""
import argparse
import statistics
import sys
from pathlib import Path

# Make `econwar_engine` importable when run as `python lab/sim/run.py`.
_LAB_DIR = Path(__file__).resolve().parents[1]
if str(_LAB_DIR) not in sys.path:
    sys.path.insert(0, str(_LAB_DIR))

from sim.game import STARTING_CAPITAL, play_game  # noqa: E402

BASE_SEED = 20260613
DEFAULT_GAMES = 2000

# Fixed table: 3 skilled vs 3 random, one per department slot. Department only
# affects PC (unused in the settlement-only gate), so the comparison is clean.
TABLE = [
    {"id": "s1", "department": "politics_global", "strategy": "skilled"},
    {"id": "s2", "department": "ir", "strategy": "skilled"},
    {"id": "s3", "department": "sociology", "strategy": "skilled"},
    {"id": "r1", "department": "government", "strategy": "random"},
    {"id": "r2", "department": "public_admin", "strategy": "random"},
    {"id": "r3", "department": "sociology", "strategy": "random"},
]


def _try_numpy():
    try:
        import numpy as np  # noqa: F401
        return np
    except Exception:
        return None


def run(num_games: int, base_seed: int) -> dict:
    skilled_ids = {p["id"] for p in TABLE if p["strategy"] == "skilled"}
    random_ids = {p["id"] for p in TABLE if p["strategy"] == "random"}

    skilled_wins = 0
    random_wins = 0
    skilled_finals = []  # per (game, skilled-seat) final money
    random_finals = []

    for g in range(num_games):
        game_seed = (base_seed + g) & 0xFFFFFFFF
        res = play_game(game_seed, TABLE)
        if res["winner"] in skilled_ids:
            skilled_wins += 1
        else:
            random_wins += 1
        for pid, money in res["final_money"].items():
            if pid in skilled_ids:
                skilled_finals.append(money)
            else:
                random_finals.append(money)

    return {
        "num_games": num_games,
        "base_seed": base_seed,
        "n_skilled_seats": len(skilled_ids),
        "n_random_seats": len(random_ids),
        "skilled_wins": skilled_wins,
        "random_wins": random_wins,
        "skilled_finals": skilled_finals,
        "random_finals": random_finals,
    }


def _summary(vals):
    return {
        "n": len(vals),
        "mean": statistics.mean(vals),
        "median": statistics.median(vals),
        "min": min(vals),
        "max": max(vals),
    }


def evaluate(stats: dict) -> dict:
    n = stats["num_games"]
    skilled_seats = stats["n_skilled_seats"]
    total_seats = skilled_seats + stats["n_random_seats"]

    skilled_winrate = stats["skilled_wins"] / n
    # Fair share if all seats were equal: skilled_seats / total_seats.
    fair_share = skilled_seats / total_seats

    sk = _summary(stats["skilled_finals"])
    rn = _summary(stats["random_finals"])

    pass_winrate = skilled_winrate >= 2.0 * fair_share
    pass_mean = sk["mean"] > rn["mean"]
    pass_median = sk["median"] > rn["median"]
    overall = pass_winrate and pass_mean and pass_median

    return {
        "skilled_winrate": skilled_winrate,
        "fair_share": fair_share,
        "winrate_ratio": skilled_winrate / fair_share if fair_share else 0.0,
        "skilled": sk,
        "random": rn,
        "pass_winrate": pass_winrate,
        "pass_mean": pass_mean,
        "pass_median": pass_median,
        "overall_pass": overall,
    }


def _baht(satang) -> str:
    return f"฿{satang / 100:,.2f}"


def _pct(x) -> str:
    return f"{x * 100:.1f}%"


def build_report(stats: dict, ev: dict) -> str:
    np = _try_numpy()
    backend = "numpy/statistics" if np is not None else "stdlib statistics"
    sk, rn = ev["skilled"], ev["random"]
    verdict = "PASS" if ev["overall_pass"] else "FAIL"

    lines = [
        "# EconWar Balance Report — Skilled vs Random (Milestone 1 gate)",
        "",
        f"- Games simulated: **{stats['num_games']}** (4 phases each, hidden phase order shuffled per game)",
        f"- Base seed: `{stats['base_seed']}` (fully reproducible)",
        f"- Table: {stats['n_skilled_seats']} skilled vs {stats['n_random_seats']} random seats",
        f"- Starting capital each: {_baht(STARTING_CAPITAL)}",
        f"- Stats backend: {backend}",
        "- Settlement path: neutral controller tilt, no abilities — isolates *allocation skill*.",
        "",
        "## Win rate",
        "",
        f"- Skilled win-rate: **{_pct(ev['skilled_winrate'])}** "
        f"({stats['skilled_wins']}/{stats['num_games']} games)",
        f"- Random win-rate: {_pct(1 - ev['skilled_winrate'])} "
        f"({stats['random_wins']}/{stats['num_games']} games)",
        f"- Fair share if seats were equal: {_pct(ev['fair_share'])}",
        f"- Skilled win-rate / fair share: **{ev['winrate_ratio']:.2f}x** "
        f"(PASS needs >= 2.00x)",
        "",
        "## Net worth after Phase 4 (per seat, per game)",
        "",
        "| Strategy | Mean | Median | Min | Max |",
        "|---|---|---|---|---|",
        f"| Skilled | {_baht(sk['mean'])} | {_baht(sk['median'])} | {_baht(sk['min'])} | {_baht(sk['max'])} |",
        f"| Random | {_baht(rn['mean'])} | {_baht(rn['median'])} | {_baht(rn['min'])} | {_baht(rn['max'])} |",
        "",
        f"- Mean uplift (skilled - random): {_baht(sk['mean'] - rn['mean'])} "
        f"({(sk['mean'] / rn['mean'] - 1) * 100:.1f}% better)",
        "",
        "## Gate checks",
        "",
        f"- [{'x' if ev['pass_winrate'] else ' '}] Skilled win-rate >= 2x fair share",
        f"- [{'x' if ev['pass_mean'] else ' '}] Skilled mean net worth > random",
        f"- [{'x' if ev['pass_median'] else ' '}] Skilled median net worth > random",
        "",
        f"## VERDICT: {verdict}",
        "",
        "Skilled play (investing per the base x regional return tables) decisively "
        "outperforms random allocation, confirming the economy rewards reading the "
        "market. See `lab/sim/run.py` to reproduce."
        if ev["overall_pass"]
        else "Skilled play did NOT clear the bar — investigate the factor tables "
        "or the skilled heuristic.",
        "",
    ]
    return "\n".join(lines)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="EconWar skilled-vs-random balance gate")
    ap.add_argument("--games", type=int, default=DEFAULT_GAMES)
    ap.add_argument("--seed", type=int, default=BASE_SEED)
    args = ap.parse_args(argv)

    stats = run(args.games, args.seed)
    ev = evaluate(stats)
    report = build_report(stats, ev)

    out_path = Path(__file__).resolve().parent / "report.md"
    out_path.write_text(report + "\n", encoding="utf-8")

    # Console summary.
    print(report)
    print(f"[report written to {out_path}]")
    print(f"RESULT: {'PASS' if ev['overall_pass'] else 'FAIL'}")
    return 0 if ev["overall_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
