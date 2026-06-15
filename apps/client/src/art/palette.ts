/**
 * EconWar palette tokens — the single source of color truth for the procedural
 * pixel world. THESE ARE LAW: the exact hex values come from DESIGN.md §2 and
 * override the "slightly desaturated" guidance in 03_Art_Direction_Stardew.md.
 * EconWar looks bright, saturated, warm, and alive — a Stardew summer.
 *
 * Two-currency rule (DESIGN.md §2): Money is ALWAYS gold (#FFC23C), Political
 * Capital is ALWAYS teal (#16C2B0). Never mix these hues for anything else.
 *
 * Plain data (hex strings) — no DOM, no Phaser. Keep in sync with styles.css.
 */

import type { RegionId, PhaseType, DepartmentId } from "@econwar/shared";

/* ------------------------------------------------------------------ *
 * Core UI palette — DESIGN.md §2. Mirrors the CSS custom properties in
 * styles.css (kept in sync by hand; CSS can't import TS).
 * ------------------------------------------------------------------ */

export interface BasePalette {
  /** warm golden paper (NOT the AI cream) */
  parchment: string;
  /** a touch deeper parchment for insets */
  parchmentDark: string;
  /** walnut frame */
  wood: string;
  /** outline / 2px borders */
  woodDark: string;
  /** lighter wood for top bevels */
  woodLight: string;
  /** warm dark brown text — never pure black */
  ink: string;
  /** softened ink for secondary text */
  inkSoft: string;
  /** bright cerulean daylight */
  sky: string;
  /** lush grass */
  leaf: string;
  /** coins, profit highlight, score — MONEY */
  gold: string;
  /** deeper gold for coin shadow / press */
  goldDeep: string;
  /** gains */
  profit: string;
  /** warm tomato losses */
  loss: string;
  /** the second currency — Political Capital, teal, deliberately NOT purple */
  pc: string;
  /** deeper teal for token shadow */
  pcDeep: string;
  /** soft drop-shadow under panels/sprites (rgba) — depth, never a glow */
  panelShadow: string;
  /** fully transparent */
  transparent: string;
}

export const BASE_PALETTE: BasePalette = {
  parchment: "#F4DFA8",
  parchmentDark: "#E7C982",
  wood: "#9C5A2D",
  woodDark: "#5E3417",
  woodLight: "#C17C42",
  ink: "#3A2418",
  inkSoft: "#6E5034",
  sky: "#57C4E5",
  leaf: "#5FB54A",
  gold: "#FFC23C",
  goldDeep: "#D8941C",
  profit: "#34C759",
  loss: "#FF5A47",
  pc: "#16C2B0",
  pcDeep: "#0E8E81",
  panelShadow: "rgba(94, 52, 23, 0.35)",
  transparent: "rgba(0,0,0,0)",
};

/* ------------------------------------------------------------------ *
 * Per-region sub-palettes — DESIGN.md §2 (each district is its own
 * vivid world). primary/accent are LAW; sky/ground/shade are warm
 * supports composed to keep each district reading distinctly.
 * ------------------------------------------------------------------ */

export interface RegionPalette {
  /** backdrop sky for the district scene */
  sky: string;
  /** ground / terrain base */
  ground: string;
  /** signature hue (motif) — DESIGN law */
  primary: string;
  /** secondary highlight that pops against primary — DESIGN law */
  accent: string;
  /** dark line / shadow for pixel outlines */
  shade: string;
}

export const REGION_PALETTE: Record<RegionId, RegionPalette> = {
  // Central — sunny gold + teal, optimistic & modern.
  central: {
    sky: "#9FE0F2",
    ground: "#E9B14A",
    primary: "#FFB627",
    accent: "#06AED5",
    shade: "#5E3417",
  },
  // North — lush green + temple gold, cool but bright.
  north: {
    sky: "#BFE3D2",
    ground: "#7CB98C",
    primary: "#3DA35D",
    accent: "#E0A458",
    shade: "#234A33",
  },
  // South — turquoise sea + sunset coral, hot coast.
  south: {
    sky: "#A6E7EC",
    ground: "#F0C58A",
    primary: "#00B4D8",
    accent: "#FF7F50",
    shade: "#0A4A55",
  },
  // Northeast — golden rice + field green, warm earth.
  northeast: {
    sky: "#F0E2A6",
    ground: "#D8B25A",
    primary: "#E9C46A",
    accent: "#8AB17D",
    shade: "#6B4A1E",
  },
};

/* ------------------------------------------------------------------ *
 * Department identity colors — DESIGN.md §2 / 03 §4. Sourced from
 * CONTENT.departments[].color (a runtime guard in index.ts asserts
 * these never drift). NOTE: politics_global is purple as a faction
 * identity color — that is allowed; purple GRADIENTS are banned (§0).
 * ------------------------------------------------------------------ */

export const DEPARTMENT_COLOR: Record<DepartmentId, string> = {
  government: "#b3262a", // deep red — pillar / seal
  ir: "#2a6fb3", // blue — globe / handshake
  sociology: "#2f9e44", // green — crowd / linked figures
  public_admin: "#868e96", // slate/grey — gear / ledger
  politics_global: "#7048e8", // purple — compass / world map
};

/* ------------------------------------------------------------------ *
 * Per-phase weather/season overlay — DESIGN.md §2. COLORFUL EVEN IN THE
 * DOWNTURNS: Recession is jewel-toned blue-violet DUSK (not grey),
 * Slowdown is warm amber/sepia haze (muted but WARM, not grey fog).
 * ------------------------------------------------------------------ */

export interface PhaseTint {
  /** replacement sky color for the mood */
  sky: string;
  /** translucent rgba wash over the scene */
  overlay: string;
  /** human-readable mood label */
  mood: string;
}

export const PHASE_TINT: Record<PhaseType, PhaseTint> = {
  // Boom — warm golden-hour, high saturation.
  boom: {
    sky: "#FFD56B",
    overlay: "rgba(255, 178, 39, 0.20)",
    mood: "golden-hour boom",
  },
  // Recovery — bright spring bloom, fresh pinks + greens, the lightest.
  recovery: {
    sky: "#CFEFC0",
    overlay: "rgba(255, 150, 190, 0.16)",
    mood: "spring bloom",
  },
  // Recession — rich blue-violet DUSK + rain sparkle, jewel-toned, NOT grey.
  recession: {
    sky: "#3E3A7A",
    overlay: "rgba(60, 50, 150, 0.30)",
    mood: "jewel-toned dusk",
  },
  // Slowdown — warm amber overcast / sepia haze, muted but WARM, NOT grey.
  slowdown: {
    sky: "#E7B36A",
    overlay: "rgba(196, 130, 60, 0.26)",
    mood: "warm amber haze",
  },
};
