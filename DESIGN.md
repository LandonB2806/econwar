# DESIGN.md — EconWar Visual System

> The design system Claude Code references on **every** UI prompt. Drop it in the repo root next to
> `CLAUDE.md` and add the reference line shown at the bottom. This file overrides the
> "slightly desaturated" palette in `03_Art_Direction_Stardew.md` — EconWar should look **bright,
> saturated, warm, and alive**, like a Stardew summer, not a muted SaaS dashboard.

---

## 0. The anti-slop contract (read this first — these are bannable)

Every one of these is an automatic redo. Name them when you critique your own output.

| Slop trait | What it looks like | What we do instead |
|------------|--------------------|--------------------|
| **The purple gradient** | violet→indigo background gradient | **Banned.** No purple gradients anywhere. |
| **Random glow / lights** | soft neon halos, scattered light blooms, "ambient" glows | **Banned.** Light comes from *one* warm sun direction; depth comes from drop-shadows, not glows. |
| **Neon-on-near-black SaaS look** | dark UI + one acid accent | **Banned.** EconWar is a *daylit warm world*, not a dark dashboard. |
| **Lazy selected-state** | a thin, uneven 1px border on the active item | **Banned.** Selected = a real **filled, pressed tab** with a color fill + inner shadow (see §6). |
| **Cramped all-caps eyebrows** | tiny ALL-CAPS labels jammed above headings | Only use a label if it encodes real info (e.g. "PHASE 2 / 4"). Never decorative. Comfortable letter-spacing. |
| **Orphan "status" chips** | a status pill that appears from nowhere | Every chip must map to a real game state. No decorative chips. |
| **Uneven spacing** | top inset ≠ left inset; ad-hoc gaps | One spacing scale (§5). Top and left insets **equal** unless there's a reason. |
| **Inter / Geist** | the default AI sans | **Banned for display.** Use the type system in §3. |
| **Lucide icons** | the default AI icon set | **Banned.** Custom pixel icons; Iconoir/Basil only as non-pixel fallback (§4). |
| **Stock / Unsplash photos** | generic photography | **Banned.** This is a pixel-art world — everything is drawn (Aseprite) or generated to match. |
| **The three AI design clusters** | (1) cream + high-contrast serif + terracotta, (2) near-black + acid accent, (3) hairline broadsheet | All three banned. We use saturated multi-color pixel warmth — none of these defaults. |

> Note on our cream panels (§2): they are a **wooden-game-UI material** paired with pixel type and a
> fully saturated world palette — deliberately *not* the minimalist "cream + editorial serif" cluster.

---

## 1. The feeling (one sentence)

A sunlit Thai town where four districts live and breathe, finance is a cheerful seasonal harvest, and
your wealth is a physical stack of coins you can watch grow — warm, saturated, hand-pixeled, joyful.

---

## 2. Color — bright, saturated, warm

Stardew's secret is **saturated warmth + clear daylight**, not desaturation. Hex values are the law.

**Core UI palette**
```
Parchment panel   #F4DFA8   warm golden paper (NOT the AI #F4F1EA cream)
Wood frame        #9C5A2D   walnut frame
Wood frame dark   #5E3417   outline / 2px borders
Ink (text)        #3A2418   warm dark brown — never pure black
Sky               #57C4E5   bright cerulean daylight
Leaf              #5FB54A   lush grass
Money gold        #FFC23C   coins, profit highlight, score
Profit green      #34C759   gains
Loss red          #FF5A47   warm tomato (losses)
Political Capital #16C2B0   teal — the second currency, deliberately NOT purple
```
> **Two-currency rule:** Money is always **gold**, Political Capital is always **teal**. Never mix
> these hues for anything else — the player must read wealth vs. influence at a glance.

**Region sub-palettes (each district is its own world, all vivid)**
```
Central (growth)    primary #FFB627  accent #06AED5  — sunny gold + teal, optimistic & modern
North (tourism)     primary #3DA35D  accent #E0A458  — lush green + temple gold, cool but bright
South (energy)      primary #00B4D8  accent #FF7F50  — turquoise sea + sunset coral, hot coast
Northeast (farm)    primary #E9C46A  accent #8AB17D  — golden rice + field green, warm earth
```

**Phase mood overlays — colorful even in the downturns** (this is where the old doc went "grey & lame"; we don't)
```
Boom        warm golden-hour, high saturation, long light       (lively up)
Recovery    bright spring bloom — fresh pinks + greens, lightest (brightest of all)
Recession   rich blue-violet DUSK + rain sparkle (jewel-toned, NOT grey)
Slowdown    warm amber overcast / sepia haze (muted but WARM, NOT grey fog)
```

---

## 3. Typography — distinctive, on-theme, never Inter

Four roles, each a deliberate choice grounded in "a cozy pixel finance game." All free on Google Fonts.

| Role | Typeface | Why this, not the default |
|------|----------|---------------------------|
| **Display** (headings, banners) | **Pixelify Sans** | Friendly pixel character, readable — *not* the overused "Press Start 2P", *not* Inter |
| **Data / ledger** (money, PC, %) | **VT323** *(or Departure Mono)* | A pixel **monospace** so financial figures align in columns — the type literally embodies "this is a finance game" |
| **Body** (copy, tooltips, dialog) | **Nunito** | Warm rounded humanist; cozy and legible at small sizes — explicitly *not* Inter/Geist |
| **Thai** (any Thai glyphs, all roles) | **Bai Jamjuree** (Cadson Demak) | Proper Thai + Latin support. Routed by **script, not locale**: appended to every font stack so Thai glyphs render in Bai Jamjuree while Latin keeps Pixelify/VT323/Nunito. Pixelify Sans has no Thai glyphs, so Thai headings fall back to a heavier Bai Jamjuree weight (CR-01 #6). |

Type scale (pixel-snapped): `12 · 14 · 16 · 20 · 28 · 40`. Headings use Pixelify Sans at 28/40; numbers
use VT323 at 16/20/28; body Nunito at 14/16. Set generous line-height (1.5) on body. Sentence case for
copy; the only all-caps allowed is short real labels like `PHASE 2 / 4`.

---

## 4. Iconography — drawn, not Lucide

- **Primary:** custom **16×16 pixel icons** in Aseprite (coin, vote ballot, ability spark, region
  crest, region weather). On-brand and unmistakable.
- **Fallback** (only for utility UI chrome where a pixel icon isn't ready): **Iconoir** or **Basil**.
  **Never Lucide** — it's the AI-default tell.
- One icon = one meaning, reused everywhere (a coin always means money).

---

## 5. Spacing & layout — even, on a pixel grid

- **Base unit 4px.** Scale: `4 · 8 · 12 · 16 · 24 · 32`. Nothing off-scale.
- **Equal insets:** panel padding is the same top/right/bottom/left unless asymmetry encodes meaning.
- **Chunky framing:** panels are parchment (#F4DFA8) with a 2px wood-dark (#5E3417) outline, a 1px warm
  highlight on the top edge (faux bevel), and a **soft drop-shadow** (`0 3px 0 rgba(94,52,23,.35)`) —
  shadow for depth, **never a glow**.
- `image-rendering: pixelated;` on the Phaser canvas; integer scaling (×2/×3) from a fixed virtual
  resolution so pixels stay square on every screen and the phone reflow stays predictable.
- React DOM panels and the Phaser world share this exact palette + these fonts, so menus and town read
  as **one product**.

---

## 6. Component states — fix the named slop

- **Selected tab/item:** a **filled pressed state** — district/department fill color, inner shadow,
  sits 2px lower. *Not* a thin border. The active thing looks physically pushed in.
- **Buttons:** chunky, 2px dark outline, lighter top bevel, gold for primary actions; on press they
  drop 2px and the bevel flips. No glow, no gradient.
- **Hover (desktop):** a 1-step brighter fill + a tiny 1px lift. Subtle, consistent everywhere.
- **Disabled:** desaturate + 60% opacity, never just hidden.
- **Focus (keyboard):** a visible 2px gold focus ring — accessibility is part of the quality floor.

---

## 7. Motion — purposeful, never scattered

Allowed, because each serves the subject: coin-pop + count-up on profit, a gentle 2px idle bob on town
sprites, leaf/cloud parallax, and the **settlement "harvest" reveal** (districts animate their result
in sequence). Respect `prefers-reduced-motion`. **Banned:** ambient glow pulses, scattered particles
as decoration, anything that exists "to feel alive" without meaning. One orchestrated moment (the
settlement reveal) beats ten idle sparkles.

---

## 8. The signature element (the one thing we spend boldness on)

**The living coin-ledger.** A player's portfolio is shown as **physical stacks of pixel coins / mason
jars** in a wooden ledger — they visibly **grow, topple, or spill** during the settlement reveal, gold
coins for money and teal tokens for Political Capital. It is the page's memorable identity, grounded
directly in the subject (wealth you can *see*), and it replaces the cold charts a generic finance UI
would default to. Everything else stays quiet so this lands.

---

## 9. Per-screen direction

- **Lobby / Department Select** — sunlit town square; pick your faction **banner** (each department's
  color from `03_Art_Direction`). Big friendly Pixelify Sans title. Join via **code + nickname**, no signup.
- **Region Map (hub)** — the four districts as a living tilemap town, each in its sub-palette, current
  phase as the weather overlay. Tap a district to allocate. This is the hero — open on the town, not a menu.
- **Portfolio (the signature, §8)** — wooden ledger, coin-stacks, gold vs teal, VT323 figures in aligned columns.
- **Voting Hall** — pixel town hall, **≤5 candidate cards** (one per department) on a podium. Selected
  candidate uses the pressed-tab state (§6). PC-weight shown as teal tokens.
- **Settlement** — the harvest reveal: districts animate gains/losses in sequence, coins pop, leaderboard updates.
- **Leaderboard** — a festival scoreboard / trophy shelf, warm and celebratory, not a data table.

---

## 10. How to actually keep slop out (workflow)

1. **Reference, don't free-style.** Before building a screen, drop a real Stardew screenshot (or a
   Mobbin pattern) as an image reference so the model matches a target instead of inventing slop.
2. **This file is law.** Reference it every prompt (line below). When you critique output, name the
   slop trait from §0 you're removing ("the selected-state is a lazy border — fix to a pressed fill").
3. **Generate assets to match**, never stock. Pixel art in Aseprite; if generating, generate *in this
   palette and pixel style*.
4. **One screenshot beats 1000 words** — screenshot your build, compare to the reference, fix the deltas.

**Add to `CLAUDE.md`:**
```
## Visual system
All UI must follow DESIGN.md. Before building any screen, load DESIGN.md and obey the §0 anti-slop
contract. Palette, fonts (Pixelify Sans / VT323 / Nunito), and the pressed-state rules are non-negotiable.
```

---

## 11. Design tooling & order of authority

You have the **impeccable skill installed** — that's the taste/quality enforcer. This file is the
**project-specific brief it runs against**. Use them together:

1. **impeccable (installed) — run it on every screen.** It enforces general taste and catches slop.
   Feed it *this file* so it applies EconWar's specifics. **When impeccable's generic instinct and
   DESIGN.md ever disagree, DESIGN.md wins** — the palette, fonts, spacing, and the §0 bans here are
   project law.
2. **Figma (connected) — the source of truth for built screens.** `create_design_system_rules`
   materializes this file as Figma variables/styles; `get_design_context` + `get_screenshot` let
   Claude Code match a real design instead of inventing slop.
3. **Image references — a habit, not a tool.** Keep real Stardew screenshots + Mobbin patterns and
   drop them into prompts (§10). This alone kills most slop.
4. **Aseprite** for all pixel assets, on-palette — never stock/Unsplash (§0).

**Order of authority:** `DESIGN.md` (project rules) → `impeccable` (taste enforcement) →
`Figma` (source of truth for the built screen).
