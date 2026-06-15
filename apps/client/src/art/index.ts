/**
 * EconWar procedural pixel-art module — public surface.
 *
 * This package generates the game's pixel look at runtime via the Canvas 2D API
 * (no binary asset files, no Phaser dependency). The Phaser scene layer is the
 * primary consumer; React UI can use the same palette tokens for visual unity.
 *
 * ── Quick start (Phaser) ────────────────────────────────────────────────
 *   import {
 *     DEPARTMENT_SPRITE, REGION_SPRITE, makeSpriteCanvas,
 *   } from "../art";
 *
 *   // In a Scene.preload()/create():
 *   const canvas = makeSpriteCanvas(DEPARTMENT_SPRITE["government"], 4);
 *   this.textures.addCanvas("dept-government", canvas);
 *   // ...then this.add.image(x, y, "dept-government");
 *
 * ── Quick start (React, plain colors) ───────────────────────────────────
 *   import { DEPARTMENT_COLOR, PHASE_TINT } from "../art";
 *   <span style={{ background: DEPARTMENT_COLOR[dept] }} />
 *
 * ── Data shapes ─────────────────────────────────────────────────────────
 *   PixelSprite = { palette: string[]; grid: number[][] }
 *     grid[y][x] indexes palette; -1 (TRANSPARENT) = empty cell.
 *
 * Everything exported here is pure data or a pure/DOM-only function. No
 * Math.random, no Date.now, no Phaser, no network.
 */

import { DEPARTMENT_COLOR } from "./palette.js";
import { CONTENT } from "@econwar/shared";

/* ---- Palette tokens ---- */
export {
  BASE_PALETTE,
  REGION_PALETTE,
  DEPARTMENT_COLOR,
  PHASE_TINT,
} from "./palette.js";
export type {
  BasePalette,
  RegionPalette,
  PhaseTint,
} from "./palette.js";

/* ---- Sprite data ---- */
export {
  TRANSPARENT,
  DEPARTMENT_SPRITE,
  REGION_SPRITE,
  SPRITE_GOVERNMENT,
  SPRITE_IR,
  SPRITE_SOCIOLOGY,
  SPRITE_PUBLIC_ADMIN,
  SPRITE_POLITICS_GLOBAL,
  SPRITE_CENTRAL,
  SPRITE_NORTH,
  SPRITE_SOUTH,
  SPRITE_NORTHEAST,
  SPRITE_COIN,
  SPRITE_PC_TOKEN,
} from "./sprites.js";
export type { PixelSprite } from "./sprites.js";

/* ---- Canvas render helpers ---- */
export {
  renderPixelSprite,
  makeSpriteCanvas,
  makeWeatherGradient,
  applyPhaseOverlay,
  disableSmoothing,
  spriteWidth,
  spriteHeight,
  mixToward,
} from "./render.js";
export type { AnyCanvas2D } from "./render.js";

/**
 * Dev-only sanity check: the static `DEPARTMENT_COLOR` table must match the
 * canonical colors in `CONTENT.departments[].color`. If content drifts, this
 * throws at import time in dev so the mismatch is caught immediately rather
 * than shipping inconsistent banners. (In a prod build, tree-shaking/minifiers
 * keep this cheap — it's a handful of string compares.)
 */
function assertDepartmentColorsMatchContent(): void {
  for (const dept of CONTENT.departments) {
    const tokenColor = DEPARTMENT_COLOR[dept.id];
    if (tokenColor.toLowerCase() !== dept.color.toLowerCase()) {
      throw new Error(
        `[art] DEPARTMENT_COLOR["${dept.id}"] = ${tokenColor} but CONTENT says ${dept.color}. ` +
          "Update apps/client/src/art/palette.ts to match departments.json.",
      );
    }
  }
}

assertDepartmentColorsMatchContent();
