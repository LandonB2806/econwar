# EconWar — Developer Feedback (Round 2)

> Direct feedback from the developer after reviewing the latest build. Hand to the new **Aesthetic
> Design Tester & Critique** agent (`14_Aesthetic_Design_Tester_Critique.md`) and the **Art Director**.
> Both items are escalations — they recur from CR-01 and must now be **gated**, not just requested.

---

## Why a new agent now

After this review, the developer concluded a dedicated **Aesthetic Design Tester & Critique** agent is
needed, because aesthetic and identity failures keep slipping through the pipeline and reaching the
developer. The two items below are the immediate triggers; from now on they pass through the critic's
gate before shipping.

---

## F-1. Start screen — no thematic identity, and too much dead space (BLOCKER)

**Observed.** The start screen now has both light and dark modes (good), but the **background
communicates nothing about the subject of the game**. It shows only sky, sun, and drifting clouds —
nothing about **political science, history, or economics**. On top of that, large areas of the canvas
are left **empty for no apparent reason**.

**Required.**
- The background must **encode the game's themes** — political science, history, economics, and
  Thailand's four regions. Concrete motifs to consider: the four-district skyline; economic cues
  (coins, market stalls, a pixel stock-ticker banner); the political layer (a voting podium, a ballot,
  an official seal); a Thailand map silhouette; and region-specific architectural/historical cues
  (temple, rice barn, oil rig, modern tower).
- **Use the canvas purposefully.** Intentional negative space is fine; **vast unexplained emptiness is
  not.** Fill the composition with layered, identity-bearing parallax elements so the screen feels like
  a *place* — the way Stardew's opening immediately reads as a farm under a sky.
- Must hold up in **both** light and dark themes.

**Owner:** Art Director (composition + assets), **gated by** the Aesthetic critic.
**Acceptance:** someone who has never seen the game can infer "this is about economics and politics
across Thailand's regions" from the start screen alone, **and** there is no large empty dead zone.

---

## F-2. The four region panels are still unintelligible (BLOCKER — repeat of CR-01 #3)

**Observed.** The four images representing the four regions during gameplay **still don't read** — you
cannot tell what each one is supposed to be.

**Required.** As already specified in CR-01 #3: each district must be legible at a glance via a clear
**hero landmark + distinct silhouette + its own sub-palette** (`DESIGN.md` §2/§9):

| Region | Must read as | Hero landmark |
|--------|--------------|---------------|
| Central / กลาง | modern startup town | cranes / glass stalls |
| North / เหนือ | hills & temples | temple roofline on green hills |
| South / ใต้ | coast & energy | oil rig + fishing docks on turquoise sea |
| Northeast / อีสาน | farmland | rice fields + windmill |

Because this is a **repeat failure**, it is escalated to **BLOCKER** and must be routed through the new
critic agent before it can ship again. Keep the existing motion (the developer likes it) — only the
**legibility of the artwork** must change.

**Owner:** Art Director, **gated by** the Aesthetic critic.
**Acceptance:** a first-time player names all four districts **without reading the labels** — verified
by the critic, in both themes.

---

## Routing

| Item | Severity | Owner | Gate |
|------|----------|-------|------|
| F-1 Start-screen identity + dead space | BLOCKER | Art Director | Aesthetic Design Tester & Critique |
| F-2 Region panels legibility (repeat) | BLOCKER | Art Director | Aesthetic Design Tester & Critique |

Both must receive a **PASS verdict** from the critic (rubric items 4 Identity, 5 Legibility, 6
Composition, in both light and dark) before they are considered done.
