/**
 * Canvas 2D rendering helpers for EconWar's procedural pixel art.
 *
 * Pure DOM Canvas only — no Phaser import. The Phaser layer consumes these by:
 *   const c = makeSpriteCanvas(DEPARTMENT_SPRITE[id], 4);
 *   this.textures.addCanvas("dept-government", c);
 *
 * All helpers disable smoothing so pixels stay crisp at integer scale
 * (core/03 §7). Nothing here uses Math.random — any jitter must be passed in.
 */

import { TRANSPARENT } from "./sprites.js";
import type { PixelSprite } from "./sprites.js";
import { PHASE_TINT } from "./palette.js";
import type { PhaseType } from "@econwar/shared";

/** A 2D context type that covers both on-screen and offscreen canvases. */
export type AnyCanvas2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/** Turn off all image smoothing on a context (keeps pixels square). */
export function disableSmoothing(ctx: AnyCanvas2D): void {
  ctx.imageSmoothingEnabled = false;
}

/** Width of a sprite in source pixels (columns of its first row). */
export function spriteWidth(sprite: PixelSprite): number {
  const firstRow = sprite.grid[0];
  return firstRow ? firstRow.length : 0;
}

/** Height of a sprite in source pixels (number of rows). */
export function spriteHeight(sprite: PixelSprite): number {
  return sprite.grid.length;
}

/**
 * Draw a pixel sprite onto `ctx` with its top-left at `(x, y)`, each source
 * pixel rendered as a `scale`×`scale` block. Transparent (-1) cells and any
 * out-of-range palette index are skipped, so partial sprites are safe.
 *
 * @param ctx    target 2D context
 * @param sprite the sprite data ({ palette, grid })
 * @param x      destination left in device pixels
 * @param y      destination top in device pixels
 * @param scale  integer pixel size (>= 1); non-integers still work but blur the grid
 */
export function renderPixelSprite(
  ctx: AnyCanvas2D,
  sprite: PixelSprite,
  x: number,
  y: number,
  scale: number,
): void {
  disableSmoothing(ctx);
  const s = Math.max(1, Math.floor(scale));
  const rows = sprite.grid;
  for (let row = 0; row < rows.length; row++) {
    const cells = rows[row];
    if (!cells) continue;
    for (let col = 0; col < cells.length; col++) {
      const idx = cells[col];
      if (idx === undefined || idx === TRANSPARENT) continue;
      const color = sprite.palette[idx];
      if (color === undefined) continue; // guard noUncheckedIndexedAccess
      ctx.fillStyle = color;
      ctx.fillRect(x + col * s, y + row * s, s, s);
    }
  }
}

/**
 * Bake a sprite into a freshly-sized offscreen `<canvas>` and return it.
 * The canvas is exactly `width*scale` × `height*scale` device pixels — ready
 * to hand to Phaser's `textures.addCanvas(key, canvas)`.
 *
 * Returns an `HTMLCanvasElement`; requires a DOM (browser / jsdom).
 */
export function makeSpriteCanvas(
  sprite: PixelSprite,
  scale: number,
): HTMLCanvasElement {
  const s = Math.max(1, Math.floor(scale));
  const canvas = document.createElement("canvas");
  canvas.width = spriteWidth(sprite) * s;
  canvas.height = spriteHeight(sprite) * s;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("makeSpriteCanvas: 2D context unavailable");
  }
  disableSmoothing(ctx);
  renderPixelSprite(ctx, sprite, 0, 0, s);
  return canvas;
}

/**
 * Build a vertical sky gradient for a phase's weather mood (core/03 §3):
 * the phase `sky` color fades into a softened variant for a simple atmosphere.
 * Returns a `CanvasGradient` the caller can use as a `fillStyle`.
 *
 * @param ctx   context the gradient is created against
 * @param phase the current (revealed) phase type
 * @param w     scene width in device pixels (unused for vertical; kept for API symmetry)
 * @param h     scene height in device pixels
 */
export function makeWeatherGradient(
  ctx: AnyCanvas2D,
  phase: PhaseType,
  _w: number,
  h: number,
): CanvasGradient {
  const tint = PHASE_TINT[phase];
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, tint.sky);
  g.addColorStop(1, mixToward(tint.sky, "#ffffff", 0.35));
  return g;
}

/**
 * Paint a phase's translucent mood wash over a region of the context. Call
 * this AFTER drawing the scene so the overlay tints everything beneath it.
 */
export function applyPhaseOverlay(
  ctx: AnyCanvas2D,
  phase: PhaseType,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.fillStyle = PHASE_TINT[phase].overlay;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/**
 * Linearly blend hex color `from` toward hex color `to` by `t` in [0,1].
 * Pure, deterministic. Accepts `#rgb` or `#rrggbb`; returns `#rrggbb`.
 * Used by the gradient helper; exported for theming convenience.
 */
export function mixToward(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(a.r + (b.r - a.r) * k);
  const g = Math.round(a.g + (b.g - a.g) * k);
  const bl = Math.round(a.b + (b.b - a.b) * k);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    const r = h[0] ?? "0";
    const g = h[1] ?? "0";
    const b = h[2] ?? "0";
    h = `${r}${r}${g}${g}${b}${b}`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return {
    r: Number.isNaN(r) ? 0 : r,
    g: Number.isNaN(g) ? 0 : g,
    b: Number.isNaN(b) ? 0 : b,
  };
}

function toHex(n: number): string {
  const v = Math.min(255, Math.max(0, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}
