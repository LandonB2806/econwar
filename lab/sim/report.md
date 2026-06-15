# EconWar Balance Report — Skilled vs Random (Milestone 1 gate)

- Games simulated: **2000** (4 phases each, hidden phase order shuffled per game)
- Base seed: `20260613` (fully reproducible)
- Table: 3 skilled vs 3 random seats
- Starting capital each: ฿1,000,000.00
- Stats backend: numpy/statistics
- Settlement path: neutral controller tilt, no abilities — isolates *allocation skill*.

## Win rate

- Skilled win-rate: **100.0%** (2000/2000 games)
- Random win-rate: 0.0% (0/2000 games)
- Fair share if seats were equal: 50.0%
- Skilled win-rate / fair share: **2.00x** (PASS needs >= 2.00x)

## Net worth after Phase 4 (per seat, per game)

| Strategy | Mean | Median | Min | Max |
|---|---|---|---|---|
| Skilled | ฿1,820,603.45 | ฿1,811,546.69 | ฿1,191,816.57 | ฿2,753,261.13 |
| Random | ฿1,164,810.40 | ฿1,160,607.52 | ฿792,006.00 | ฿1,618,336.31 |

- Mean uplift (skilled - random): ฿655,793.05 (56.3% better)

## Gate checks

- [x] Skilled win-rate >= 2x fair share
- [x] Skilled mean net worth > random
- [x] Skilled median net worth > random

## VERDICT: PASS

Skilled play (investing per the base x regional return tables) decisively outperforms random allocation, confirming the economy rewards reading the market. See `lab/sim/run.py` to reproduce.

