/**
 * Procedural pixel-sprite DATA for EconWar.
 *
 * Each sprite is a tiny indexed bitmap: `grid[y][x]` holds an index into
 * `palette`. The sentinel `T` (-1) means "transparent / empty" — the renderer
 * skips it. This format is deliberately dumb data (no DOM, no Phaser) so it can
 * be rendered to a Canvas (see render.ts), snapshot-tested, or baked offline.
 *
 * Grids are 16×16 for readability at integer scales (×2..×6). Author new
 * sprites by drawing the grid as a block of digits — a leading `// legend`
 * comment makes review easy.
 *
 * Convention: index 0 of every sprite's palette is a usable color (NOT
 * transparency). Use `T` for holes.
 */

import { DEPARTMENT_COLOR, REGION_PALETTE, BASE_PALETTE } from "./palette.js";
import type { RegionId, DepartmentId } from "@econwar/shared";

/** Transparent sentinel. Any grid cell set to this is not drawn. */
export const TRANSPARENT = -1;

/** Shorthand alias for authoring readable grids below. */
const T = TRANSPARENT;

/**
 * A renderable pixel sprite: `grid` cells index into `palette`; `TRANSPARENT`
 * (-1) cells are skipped. Width is `grid[0].length`, height is `grid.length`.
 */
export interface PixelSprite {
  /** Hex/rgba color strings. Index 0..n referenced by grid cells. */
  palette: string[];
  /** Row-major grid of palette indices; -1 = transparent. */
  grid: number[][];
}

/* ------------------------------------------------------------------ *
 * Department mascots / icons (core/03 §4). 16×16.
 * Each uses its department color as the primary, a light tint as accent,
 * and ink for outline so it reads on parchment panels.
 * ------------------------------------------------------------------ */

const OUTLINE = BASE_PALETTE.ink;
const LIGHT = BASE_PALETTE.parchment;
const GOLD = BASE_PALETTE.gold;

/** Government — a classical pillar on a base (authority / the state). */
export const SPRITE_GOVERNMENT: PixelSprite = {
  // 0 outline  1 column  2 light edge  3 gold capital
  palette: [OUTLINE, DEPARTMENT_COLOR.government, LIGHT, GOLD],
  grid: [
    [T, T, T, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, T, T, T],
    [T, T, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, T, T],
    [T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 2, 1, 1, 2, 2, 1, 1, 2, 0, T, T, T],
    [T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T],
    [T, T, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, T, T],
    [T, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, T],
    [T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** International Relations — a globe with a meridian (world / handshake). */
export const SPRITE_IR: PixelSprite = {
  // 0 outline  1 ocean  2 land  3 highlight
  palette: [OUTLINE, DEPARTMENT_COLOR.ir, BASE_PALETTE.leaf, LIGHT],
  grid: [
    [T, T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T],
    [T, T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T],
    [T, T, 0, 1, 1, 1, 2, 2, 1, 1, 3, 1, 1, 0, T, T],
    [T, 0, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 0, T],
    [T, 0, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 0, T],
    [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 2, 1, 1, 0],
    [0, 1, 1, 2, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 0],
    [0, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0],
    [T, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 0, T],
    [T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, T],
    [T, T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T],
    [T, T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T],
    [T, T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** Sociology & Anthropology — three linked figures (a crowd / movement). */
export const SPRITE_SOCIOLOGY: PixelSprite = {
  // 0 outline  1 body  2 head light
  palette: [OUTLINE, DEPARTMENT_COLOR.sociology, LIGHT],
  grid: [
    [T, T, 0, 0, T, T, T, T, T, T, T, T, 0, 0, T, T],
    [T, 0, 2, 2, 0, T, T, 0, 0, T, T, 0, 2, 2, 0, T],
    [T, 0, 2, 2, 0, T, 0, 2, 2, 0, T, 0, 2, 2, 0, T],
    [T, T, 0, 0, T, T, 0, 2, 2, 0, T, T, 0, 0, T, T],
    [T, T, 0, 1, 0, 0, T, 0, 0, T, 0, 0, 1, 0, T, T],
    [T, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, T],
    [0, 1, 1, 1, 0, T, 0, 1, 1, 0, T, 0, 1, 1, 1, 0],
    [0, 1, 1, 0, T, T, 0, 1, 1, 0, T, T, 0, 1, 1, 0],
    [0, 1, 1, 0, T, T, 0, 1, 1, 0, T, T, 0, 1, 1, 0],
    [0, 1, 1, 0, T, T, 0, 1, 1, 0, T, T, 0, 1, 1, 0],
    [T, 0, 0, T, T, T, 0, 1, 1, 0, T, T, T, 0, 0, T],
    [T, T, T, T, T, T, 0, 1, 1, 0, T, T, T, T, T, T],
    [T, T, T, T, T, T, 0, 0, 0, 0, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** Public Administration — a gear with a ledger square (efficiency / process). */
export const SPRITE_PUBLIC_ADMIN: PixelSprite = {
  // 0 outline  1 gear  2 light  3 hub
  palette: [OUTLINE, DEPARTMENT_COLOR.public_admin, LIGHT, BASE_PALETTE.inkSoft],
  grid: [
    [T, T, T, T, T, 0, 0, T, T, 0, 0, T, T, T, T, T],
    [T, T, T, T, T, 0, 1, 0, 0, 1, 0, T, T, T, T, T],
    [T, T, 0, 0, T, 0, 1, 1, 1, 1, 0, T, 0, 0, T, T],
    [T, T, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, T, T],
    [T, T, T, 0, 1, 1, 1, 2, 2, 1, 1, 1, 0, T, T, T],
    [T, 0, 0, 0, 1, 1, 2, 3, 3, 2, 1, 1, 0, 0, 0, T],
    [T, 0, 1, 1, 1, 2, 3, 3, 3, 3, 2, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 2, 3, 3, 3, 3, 2, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 2, 3, 3, 3, 3, 2, 1, 1, 1, 0, T],
    [T, 0, 0, 0, 1, 1, 2, 3, 3, 2, 1, 1, 0, 0, 0, T],
    [T, T, T, 0, 1, 1, 1, 2, 2, 1, 1, 1, 0, T, T, T],
    [T, T, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, T, T],
    [T, T, 0, 0, T, 0, 1, 1, 1, 1, 0, T, 0, 0, T, T],
    [T, T, T, T, T, 0, 1, 0, 0, 1, 0, T, T, T, T, T],
    [T, T, T, T, T, 0, 0, T, T, 0, 0, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** Politics & Global Studies — a compass rose (strategy / worldview). */
export const SPRITE_POLITICS_GLOBAL: PixelSprite = {
  // 0 outline  1 body  2 needle light  3 gold center
  palette: [OUTLINE, DEPARTMENT_COLOR.politics_global, LIGHT, GOLD],
  grid: [
    [T, T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T],
    [T, T, T, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, T, T, T],
    [T, T, 0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 0, T, T],
    [T, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, T],
    [0, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1, 1, 1, 0],
    [0, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 0],
    [0, 2, 2, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 2, 2, 0],
    [0, 1, 1, 1, 1, 1, 2, 3, 3, 2, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 0],
    [T, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, T],
    [T, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, T],
    [T, T, 0, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 0, T, T],
    [T, T, T, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, T, T, T],
    [T, T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T],
  ],
};

/**
 * Department mascot lookup. Keyed by `DepartmentId` so callers can do
 * `DEPARTMENT_SPRITE[player.department]`.
 */
export const DEPARTMENT_SPRITE: Record<DepartmentId, PixelSprite> = {
  government: SPRITE_GOVERNMENT,
  ir: SPRITE_IR,
  sociology: SPRITE_SOCIOLOGY,
  public_admin: SPRITE_PUBLIC_ADMIN,
  politics_global: SPRITE_POLITICS_GLOBAL,
};

/* ------------------------------------------------------------------ *
 * Region motifs (core/03 §3). 16×16, tinted with each region's palette.
 * These are scene "landmarks" the Phaser hub can drop onto each district.
 * ------------------------------------------------------------------ */

/** Central — a glass tower with a rooftop flag (modern startup town). */
export const SPRITE_CENTRAL: PixelSprite = {
  // 0 outline  1 building  2 window/accent  3 flag (deep gold)
  palette: [
    REGION_PALETTE.central.shade,
    REGION_PALETTE.central.primary,
    REGION_PALETTE.central.accent,
    BASE_PALETTE.goldDeep,
  ],
  grid: [
    [T, T, T, T, T, T, 3, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, 3, 3, 3, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, 3, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 2, 1, 1, 2, 1, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 1, 1, 1, 1, 1, 0, T, T, T, T],
    [T, T, T, T, 0, 2, 1, 1, 2, 1, 2, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 1, 1, 1, 1, 1, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 2, 1, 1, 2, 1, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 1, 1, 1, 1, 1, 0, T, T, T, T],
    [T, T, T, T, 0, 2, 1, 1, 2, 1, 2, 0, T, T, T, T],
    [T, T, T, T, 0, 1, 1, 1, 1, 1, 1, 0, T, T, T, T],
    [T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T],
    [T, T, T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T, T],
    [T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** North — a temple with a tall spire on a green hill (highlands). */
export const SPRITE_NORTH: PixelSprite = {
  // 0 outline  1 hill (green)  2 temple (gold)  3 spire
  palette: [
    REGION_PALETTE.north.shade,
    REGION_PALETTE.north.primary,
    REGION_PALETTE.north.accent,
    BASE_PALETTE.gold,
  ],
  grid: [
    [T, T, T, T, T, T, T, 3, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, 3, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, 0, 2, 0, T, T, T, T, T, T, T],
    [T, T, T, T, T, 0, 2, 2, 2, 0, T, T, T, T, T, T],
    [T, T, T, T, 0, 2, 2, 2, 2, 2, 0, T, T, T, T, T],
    [T, T, T, 0, 2, 2, 2, 2, 2, 2, 2, 0, T, T, T, T],
    [T, T, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, T, T, T],
    [T, T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T, T],
    [T, T, T, 0, 2, 0, 2, 2, 0, 2, 0, T, T, T, T, T],
    [T, T, T, 0, 2, 0, 2, 2, 0, 2, 0, T, T, T, T, T],
    [T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T, T, T],
    [T, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, T, T],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T],
  ],
};

/** South — an offshore oil derrick with a gas flare over the sea (energy). */
export const SPRITE_SOUTH: PixelSprite = {
  // 0 outline  1 water  2 rig steel  3 flame/accent
  palette: [
    REGION_PALETTE.south.shade,
    REGION_PALETTE.south.primary,
    BASE_PALETTE.inkSoft,
    REGION_PALETTE.south.accent,
  ],
  grid: [
    [T, T, T, T, T, T, T, 3, 3, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, 2, 2, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, 0, 2, 2, 0, T, T, T, T, T, T],
    [T, T, T, T, T, T, 0, 2, 2, 0, T, T, T, T, T, T],
    [T, T, T, T, T, 0, 2, 2, 2, 2, 0, T, T, T, T, T],
    [T, T, T, T, T, 0, 2, 0, 0, 2, 0, T, T, T, T, T],
    [T, T, T, T, 0, 2, 2, 2, 2, 2, 2, 0, T, T, T, T],
    [T, T, T, T, 0, 2, 0, 0, 0, 0, 2, 0, T, T, T, T],
    [T, T, T, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, T, T, T],
    [T, T, T, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, T, T, T],
    [T, T, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, T, T],
    [T, T, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, T, T],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1],
  ],
};

/** Northeast — a windmill with four sails over rice rows (farmland). */
export const SPRITE_NORTHEAST: PixelSprite = {
  // 0 outline  1 field (green)  2 mill body (gold)  3 sails/grain
  palette: [
    REGION_PALETTE.northeast.shade,
    REGION_PALETTE.northeast.accent,
    REGION_PALETTE.northeast.primary,
    BASE_PALETTE.gold,
  ],
  grid: [
    [T, T, 3, T, T, T, T, T, T, T, T, T, T, 3, T, T],
    [T, T, T, 3, T, T, T, T, T, T, T, T, 3, T, T, T],
    [T, T, T, T, 3, T, T, 2, 2, T, T, 3, T, T, T, T],
    [T, T, T, T, T, 3, 0, 2, 2, 0, 3, T, T, T, T, T],
    [T, T, T, T, T, T, 0, 2, 2, 0, T, T, T, T, T, T],
    [T, T, T, T, T, 3, 0, 2, 2, 0, 3, T, T, T, T, T],
    [T, T, T, T, 3, T, 0, 2, 2, 0, T, 3, T, T, T, T],
    [T, T, T, 3, T, T, 0, 2, 2, 0, T, T, 3, T, T, T],
    [T, T, T, T, T, T, 0, 2, 2, 0, T, T, T, T, T, T],
    [T, T, T, T, T, 0, 2, 2, 2, 2, 0, T, T, T, T, T],
    [T, T, T, T, 0, 2, 2, 2, 2, 2, 2, 0, T, T, T, T],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
};

/**
 * Region motif lookup. Keyed by `RegionId` so callers can do
 * `REGION_SPRITE[region.id]`.
 */
export const REGION_SPRITE: Record<RegionId, PixelSprite> = {
  central: SPRITE_CENTRAL,
  north: SPRITE_NORTH,
  south: SPRITE_SOUTH,
  northeast: SPRITE_NORTHEAST,
};

/* ------------------------------------------------------------------ *
 * Shared UI motif: a coin (used for profit "coin-pop" juice, ledger).
 * ------------------------------------------------------------------ */

/** A teal Political-Capital token (the second currency). Same shape language as
 * the coin but unmistakably teal — the gold-vs-teal two-currency rule (§2). */
export const SPRITE_PC_TOKEN: PixelSprite = {
  // 0 outline  1 teal  2 deep teal  3 glint
  palette: [BASE_PALETTE.woodDark, BASE_PALETTE.pc, BASE_PALETTE.pcDeep, LIGHT],
  grid: [
    [T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T, T],
    [T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T, T],
    [T, 0, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 0, T, T, T],
    [0, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T],
    [T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T, T],
    [T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T, T],
    [T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};

/** A gold coin with a ฿ glint — handy for settlement coin-pop effects. */
export const SPRITE_COIN: PixelSprite = {
  // 0 outline  1 gold  2 deep gold  3 glint
  palette: [BASE_PALETTE.woodDark, BASE_PALETTE.gold, BASE_PALETTE.goldDeep, LIGHT],
  grid: [
    [T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T, T],
    [T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T, T],
    [T, 0, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 0, T, T, T],
    [0, 1, 1, 1, 3, 1, 1, 1, 1, 2, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 2, 2, 2, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 1, 1, 2, 2, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, T, T],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T],
    [T, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, T, T, T],
    [T, T, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, T, T, T, T],
    [T, T, T, T, 0, 0, 0, 0, 0, 0, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
    [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T],
  ],
};
