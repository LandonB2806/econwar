# EconWar — Art Direction: "Stardew Valley" Vibe (v0.2)

> Cozy, warm, hand-pixeled. A friendly economic world, not a cold trading terminal.

---

## 1. The Feeling

Stardew Valley's appeal is **warmth + clarity + charm**: chunky pixel art, soft warm lighting, hand-drawn UI panels with wooden/parchment frames, gentle ambient music, and readable icons. EconWar should feel like a **cozy town of four regions** where finance is a friendly seasonal activity — not a Bloomberg terminal.

Translate the political-economy theme into a **map of Thailand as a living pixel town**: four regions = four districts you can visit, each with its own palette and seasonal mood that shifts with the economic phase.

---

## 2. Visual Pillars

| Pillar | Direction |
|---|---|
| **Resolution** | Low-res pixel art. Base sprite grid 16×16 or 32×32; integer-scale up (no blurry filtering — `image-rendering: pixelated`). |
| **Palette** | Warm, slightly desaturated. Earthy greens, warm browns, soft golden light, muted blues. Each region gets a sub-palette. |
| **Lighting** | Soft, warm "golden hour" feel. Subtle vignette. Phase changes shift the time-of-day/season tint. |
| **UI frames** | Wooden / parchment panels with rounded pixel borders, like Stardew's menus. Drop-shadow under panels. |
| **Typography** | A pixel/bitmap font for headings (e.g., a free font like "Press Start 2P" or "PixelOperator"), a clean readable font for dense numbers. |
| **Motion** | Gentle: bob animations, coin-pop on profit, leaf/cloud parallax. Nothing harsh. |

---

## 3. Region Theming (4 districts)

| Region | Pixel motif | Palette mood |
|---|---|---|
| **Central** | Modern town, startup stalls, cranes | Bright, optimistic gold/teal |
| **North** | Hills, temples, guesthouses | Cool misty greens & blues |
| **South** | Coast, oil rigs, fishing docks | Warm turquoise & sandy tones |
| **Northeast** | Farmland, rice fields, windmills | Earthy ochre & green |

Each region is a small animated scene. Economic phase changes the weather/season overlay (Boom = sunny, Recession = overcast/rain, Recovery = spring bloom, Slowdown = grey fog).

---

## 4. Department Identity (5 factions)

Give each department a **pixel mascot / banner / color** so players feel they represent "their" discipline:

| Department | Color | Mascot/icon idea |
|---|---|---|
| Government | Deep red | Pillar / seal |
| International Relations | Blue | Globe / handshake |
| Sociology & Anthropology | Green | Crowd / linked figures |
| Public Administration | Slate/grey | Gear / ledger |
| Politics & Global Studies | Purple | Compass / world map |

---

## 5. Screen Inventory (with vibe notes)

1. **Lobby / Department Select** — a cozy town square; pick your faction banner.
2. **Region Map (main hub)** — the four districts as a tile-mapped town; tap a district to allocate.
3. **Portfolio Panel** — wooden ledger UI; coins and bars instead of cold charts.
4. **Voting Hall** — a pixel town hall for the Controller election; candidates on a podium.
5. **Phase Settlement** — animated "harvest"-style reveal of gains/losses with coin-pop effects.
6. **Leaderboard** — a festival scoreboard / trophy shelf.

---

## 6. Asset Pipeline & Tools (all low-cost)

| Need | Tool | Cost |
|---|---|---|
| Pixel sprites & tiles | **Aseprite** (or free **LibreSprite** / **Piskel**) | ~paid / free |
| Tilemaps / level layout | **Tiled** (free) | free |
| Rendering in browser | **Phaser 3** tilemap + sprite system | free |
| Fonts | Free pixel fonts (Press Start 2P, PixelOperator) | free |
| Audio | Free cozy chiptune/ambient packs (itch.io, OpenGameArt) | free |

> Cost-conscious note: free placeholder asset packs (itch.io / Kenney / OpenGameArt) let you prototype the entire look before commissioning or drawing custom art.

---

## 7. Implementation Tips (web pixel art)

- Set `image-rendering: pixelated;` on canvas to keep edges crisp.
- Use **integer scaling** (×2, ×3) so pixels stay square on any screen.
- Keep the React UI layer visually consistent with the Phaser scene (same palette, same pixel font) so the menus and the game world feel like one product.
- Design at a fixed virtual resolution, then scale to fit — this also simplifies the later **mobile** layout.
