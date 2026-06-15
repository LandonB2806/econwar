# EconWar Art Module — Notes

Procedural pixel art generated at runtime via the Canvas 2D API. No binary
assets, no Phaser dependency. This is the "golden look" placeholder layer until
a real artist / asset pack arrives (core/03 "Stardew" brief).

## What's here

| File | Purpose |
|---|---|
| `palette.ts` | Typed color tokens: base UI palette (mirrors `styles.css`), `REGION_PALETTE`, `DEPARTMENT_COLOR`, `PHASE_TINT`. Pure data. |
| `sprites.ts` | Compact indexed-bitmap sprite data (`PixelSprite`): 5 department mascots, 4 region motifs, a coin. |
| `render.ts` | Canvas helpers: `renderPixelSprite`, `makeSpriteCanvas`, `makeWeatherGradient`, `applyPhaseOverlay`, color mixing. Smoothing always off. |
| `index.ts` | Clean public surface + a dev guard asserting `DEPARTMENT_COLOR` matches `CONTENT`. |

## Palette rationale

- **Base palette** is copied by hand from the `:root` custom properties in
  `apps/client/src/styles.css` (CSS can't be imported into TS). If you change a
  wood/parchment/ink/gold value in one place, change it in the other so the
  React UI and the pixel world stay one product. The names match the CSS vars.
- **Region sub-palettes** follow core/03 §3: Central = bright gold/teal,
  North = cool misty greens/blues, South = warm turquoise/sandy,
  Northeast = earthy ochre/green. Each carries `sky / ground / primary /
  accent / shade` so a motif and its backdrop come from one ramp.
- **Department colors** come from `departments.json` (`CONTENT.departments[].color`).
  They're re-declared as a static literal here for a side-effect-free constant
  table; `index.ts` throws at import if the two ever drift.
- **Phase tints** are the 4 weather moods: Boom = sunny gold, Recession =
  overcast rain blue-grey, Recovery = spring bloom green, Slowdown = grey fog.
  Each has a `sky` (backdrop swap), an `overlay` (translucent wash over the
  scene), and a `mood` label.

## Sprite data format

```ts
interface PixelSprite { palette: string[]; grid: number[][]; }
```

`grid[y][x]` is an index into `palette`. The sentinel `-1` (`TRANSPARENT`) means
"don't draw this cell". Index `0` of every palette is a real color, never
transparency. Grids are 16×16 for readable integer scaling (×2..×6).

### How to add a sprite

1. In `sprites.ts`, copy an existing `SPRITE_*` block.
2. Pick a small palette (4–5 colors is plenty); pull tones from `BASE_PALETTE`
   / `REGION_PALETTE` / `DEPARTMENT_COLOR` so it stays on-theme.
3. Draw the `grid` as rows of indices; use `T` for transparent cells.
4. If it belongs to a region/department, add it to `REGION_SPRITE` /
   `DEPARTMENT_SPRITE`, then re-export from `index.ts`.

### Rendering it

```ts
import { makeSpriteCanvas, DEPARTMENT_SPRITE } from "../art";
const canvas = makeSpriteCanvas(DEPARTMENT_SPRITE["ir"], 4); // 64×64
scene.textures.addCanvas("dept-ir", canvas);
```

Or draw directly: `renderPixelSprite(ctx, sprite, x, y, scale)`.

For weather: fill the backdrop with `makeWeatherGradient(ctx, phase, w, h)`,
draw the scene, then `applyPhaseOverlay(ctx, phase, x, y, w, h)` on top.

## What a real artist should replace first

1. **Region motifs** — the 16×16 crane/temple/oil-rig/windmill are legible but
   single-tile. Replace with proper multi-tile animated district scenes
   (parallax clouds, bobbing props) per core/03 §3/§5.
2. **Department mascots** — usable as banner icons, but a hand-drawn mascot per
   faction (with a flag/banner variant) would give the lobby real charm.
3. **Tilesets & UI nine-slices** — there are none yet. A wooden/parchment
   nine-slice panel set and ground tilesets would let Phaser build real maps
   instead of CSS panels.
4. **Settlement juice** — the coin sprite is a stand-in; an artist should do a
   coin-pop spin sheet and gain/loss particles (core/03 §5 "harvest reveal").
5. **A bitmap font** — headings currently lean on the CSS web font
   ("Press Start 2P"); an in-engine bitmap font would unify Phaser text with
   the React UI.

## Constraints to keep

- Pure / DOM-only. Never import Phaser here. Never call `Math.random` /
  `Date.now` in shared helpers (pass a seed if you need jitter).
- Strict TS: `verbatimModuleSyntax` (use `import type`),
  `noUncheckedIndexedAccess` (guard every array/record index).
- Keep `image-rendering: pixelated` on the canvas/CSS side and scale by integers.
