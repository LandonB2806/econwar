# EconWar — Game Design Specification (v0.2)

> A phase-based economic-strategy game for political-science students.
> Web-first, pixel-art (Stardew Valley vibe), with Single-Player (vs AI) and Multiplayer modes.

---

## 1. Core Concept

All players start with **equal capital**. Each player belongs to one of **5 political-science departments**, each granting a unique **Special Ability**. Players allocate their capital across **Thailand's 4 regions**. The economy moves through **4 phases**; before each phase the group **votes a Market Controller** who can nudge the economy in a chosen direction. After each phase, every portfolio is revalued. **The player with the most money after Phase 4 wins.**

The design tension is deliberate: you are simultaneously an **investor** (read the economy, allocate well) and a **political actor** (win the vote, spend your ability at the right moment, manage who controls the market).

---

## 2. Win Condition & Game Length

| Item | Value |
|---|---|
| Starting capital | Equal for all (e.g., ฿1,000,000 virtual) |
| Phases per game | 4 |
| Winner | Highest net worth after Phase 4 settlement |
| Target session length | ~4 hours (≈ 45–55 min per phase incl. debate + voting + allocation) |
| Target player count | Up to ~260 (Multiplayer); 1 + AI bots (Single-Player) |

---

## 3. The Round Loop (one phase)

Each phase runs through the same five steps. This is the heartbeat of the game and the single most important thing to implement correctly.

1. **Indicator Reveal** — The engine publishes economic indicators (inflation, interest rate, unemployment, regional sentiment). The *true* upcoming phase is **hidden**; players must infer it.
2. **Debate & Vote** — Players debate and vote to elect the **Market Controller** for this phase.
3. **Controller Action** — The elected Controller spends their ultimate power to **tilt the economic direction** (within bounded limits).
4. **Portfolio Allocation** — Every player sets/adjusts their allocation across the 4 regions and optionally spends their **department Special Ability**.
5. **Settlement** — The engine applies phase outcome + regional modifiers + random event + abilities, then revalues all portfolios and publishes the leaderboard.

```
Indicator Reveal → Debate/Vote Controller → Controller tilts economy
→ Players allocate + use ability → Engine settles → Leaderboard
```

---

## 4. The 4 Regions (investable assets)

Players allocate capital across four regions. Each region behaves differently per economic phase, so there is no single "always-best" region.

| Region | Character | Strong in | Weak in |
|---|---|---|---|
| **Central (กลาง)** | Startup / high-growth | Boom | Recession |
| **North (เหนือ)** | Tourism / real estate | Recovery | Flood/Event shocks |
| **South (ใต้)** | Commodity / energy | Inflation / oil spikes | Slowdown |
| **Northeast (อีสาน)** | Agriculture / stable | Recovery, defensive | Boom (lower upside) |

Each region has a per-phase **return multiplier** the engine computes from: base phase effect × regional modifier × controller tilt × random event × ability effects.

---

## 5. The 4 Economic Phases

The phase sequence is **hidden** — players read indicators and guess. The four phase types:

| Phase | Theme | General effect |
|---|---|---|
| **Boom** | Expansion | Growth assets surge (Central) |
| **Recession** | Contraction | Defensive assets hold (NE), risk assets fall |
| **Recovery** | Rebound | North/NE rebound strongly |
| **Slowdown** | Stagnation | Low returns everywhere; punishes over-leverage |

> Design note: the *order* of phases should vary between games so memorized strategies don't dominate.

---

## 6. The 5 Departments (player factions + abilities)

Players are grouped by department. Each department has a distinct play style and a **Special Ability** fueled by a second resource: **Political Capital (PC)**, earned at different rates per department per phase.

| Department | Play style | Signature Special Ability |
|---|---|---|
| **Government (ปกครอง)** | Control | Tax a rival's gains; shield self from one event. Strongest in **Recession**. |
| **International Relations (IR)** | Information & alliances | Peek at extra indicator data; broker a benefit-swap deal with another player. |
| **Sociology & Anthropology (สังคมฯ)** | Mass movement | Shift the whole market in one region — but rivals invested there also gain. |
| **Public Administration (รัฐปศ.)** | Efficiency | Pays lowest transaction fees; can rebalance once *after* an event is revealed. |
| **Politics & Global Studies (การเมืองโลกฯ)** | Strategist | Reads the next phase early; high-risk/high-reward. Weakest in **Slowdown**. |

### Resource model: two currencies
- **Money** — the score and the investment fuel.
- **Political Capital (PC)** — spent to activate abilities and to influence the Controller vote. Forces dual-resource management.

---

## 7. The Market Controller (voted role)

Each phase, players elect one **Market Controller** via the **voting function**.

- The Controller wields the **ultimate power**: choose/tilt the economic direction for the coming phase (within bounded options, not unlimited).
- This creates a political meta-game: alliances form to elect a favorable Controller, and the Controller must balance self-interest against being voted out next phase.
- **Anti-abuse guardrails:** bounded tilt magnitude, the Controller cannot fully zero-out other regions, and their own holdings may carry a transparency penalty (so they can't trivially rig the market for themselves).

---

## 8. Required Functions (from feedback) → feature map

| Requested function | Spec'd feature |
|---|---|
| Vote to choose market-mechanism controller | **Controller Election** (§7) — one vote per player, PC can weight influence |
| Portfolio allocation across 4 regions | **Allocation Panel** (§4) — sliders/amounts summing to available capital |
| Use own special ability | **Ability Action** (§6) — one charge per phase, costs PC |
| Controller's ultimate power: choose economic direction | **Economic Tilt** (§7) — bounded direction selection |
| Single Player with AI | **Solo mode** — AI bots fill departments + AI runs the engine |
| Multiplayer | **Live mode** — synchronized phases across all players |

---

## 9. Game Modes

**Single-Player (vs AI)**
- One human; AI bots occupy the other departments with distinct strategies.
- AI also runs neutral engine events. Good for onboarding/tutorial and balance testing.

**Multiplayer (live, up to ~260)**
- Synchronized phase clock: all players see the same Indicator Reveal, vote together, allocate within a time window, then settle simultaneously.
- A facilitator/host screen shows the global leaderboard and phase timer.

---

## 10. Open Design Risks (to tune during playtests)

1. **Ability balance** — "move the whole market" (Sociology) and "tax rivals" (Government) are powerful; need numeric caps + PC costs.
2. **Controller dominance** — bound the tilt and add re-election pressure so one player can't snowball.
3. **Scale fairness** — with 260 players, the allocation/voting window must be generous enough that slower players aren't punished by latency.
4. **Unfinished archetypes** — the earlier "hot-headed" and "conservative" investor roles from the original draft should either be merged into department flavor or dropped to avoid overlap.
