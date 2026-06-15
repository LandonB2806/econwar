/**
 * RegionMapScene — EconWar's "living pixel town": Thailand's 4 regions as four
 * districts in a 2×2 map. Each district is a small SCENE (hero landmark + its
 * own supporting context: skyline / hills / sea / fields) so a first-time player
 * can name it at a glance (CR-01 #3 / Feedback F-2), each in its sub-palette.
 *
 * ANTI-LEAK (golden rule #5): the weather/season reveals the true economic
 * phase, so the map stays on a NEUTRAL cozy wash during the hidden steps. The
 * wash is drawn UNDER the landmark + label so it tints the sky/ground for mood
 * without ever dimming the thing you're meant to read. The true phase tint only
 * appears once `revealedPhase` is set (at settlement). The scene only renders
 * what the registry is told — it never reads hidden state directly.
 */
import Phaser from "phaser";
import { CONTENT } from "@econwar/shared";
import type { PhaseType, RegionId } from "@econwar/shared";
import {
  BASE_PALETTE,
  PHASE_TINT,
  REGION_PALETTE,
  REGION_SPRITE,
  makeSpriteCanvas,
} from "../art/index.js";

const VIRTUAL_W = 640;
const VIRTUAL_H = 360;
const MOTIF_SCALE = 7;

/** 2×2 layout: region id → grid cell. */
const CELL: Record<RegionId, { col: 0 | 1; row: 0 | 1 }> = {
  central: { col: 0, row: 0 },
  north: { col: 1, row: 0 },
  south: { col: 0, row: 1 },
  northeast: { col: 1, row: 1 },
};

const PIXEL_FONT = '"Pixelify Sans", monospace';

interface DistrictRefs {
  weather: Phaser.GameObjects.Rectangle;
  ring: Phaser.GameObjects.Rectangle;
}

export class RegionMapScene extends Phaser.Scene {
  private districts = new Map<RegionId, DistrictRefs>();
  private moodLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("region-map");
  }

  preload(): void {
    for (const region of CONTENT.regions) {
      const key = `motif-${region.id}`;
      if (!this.textures.exists(key)) {
        this.textures.addCanvas(
          key,
          makeSpriteCanvas(REGION_SPRITE[region.id], MOTIF_SCALE),
        );
      }
    }
  }

  create(): void {
    const cellW = VIRTUAL_W / 2;
    const cellH = (VIRTUAL_H - 26) / 2;

    for (const region of CONTENT.regions) {
      const pal = REGION_PALETTE[region.id];
      const { col, row } = CELL[region.id];
      const x0 = col * cellW;
      const y0 = row * cellH;
      const cx = x0 + cellW / 2;
      const groundY = y0 + cellH * 0.7;

      // sky backdrop
      this.add.rectangle(x0, y0, cellW, cellH, hex(pal.sky)).setOrigin(0, 0);

      // ground / sea band
      const isSea = region.id === "south";
      const bandColor = isSea ? hex(pal.primary) : hex(pal.ground);
      this.add
        .rectangle(x0, groundY, cellW, cellH * 0.3 + 2, bandColor)
        .setOrigin(0, 0);

      // drifting cloud (one, subtle)
      const cloud = this.add
        .rectangle(x0 + 24, y0 + 18, 34, 9, 0xffffff, 0.7)
        .setOrigin(0, 0);
      this.tweens.add({
        targets: cloud,
        x: x0 + cellW + 30,
        duration: 11000,
        repeat: -1,
        onRepeat: () => cloud.setX(x0 - 40),
      });

      // per-district supporting scene (drawn behind the hero landmark)
      this.drawContext(region.id, x0, y0, cellW, cellH, groundY, pal);

      // weather wash — UNDER the landmark so the landmark stays legible
      const weather = this.add
        .rectangle(x0, y0, cellW, cellH, 0xffffff, 0)
        .setOrigin(0, 0);

      // soft shadow + hero landmark
      this.add
        .ellipse(cx, groundY + 4, MOTIF_SCALE * 13, MOTIF_SCALE * 3, 0x000000, 0.18)
        .setOrigin(0.5, 0.5);
      const motif = this.add
        .image(cx, groundY + 2, `motif-${region.id}`)
        .setOrigin(0.5, 1);
      bob(this, motif, groundY + 2);

      // allocation highlight ring (hidden by default)
      const ring = this.add
        .rectangle(x0 + 2, y0 + 2, cellW - 4, cellH - 4)
        .setOrigin(0, 0)
        .setStrokeStyle(3, hex(BASE_PALETTE.gold))
        .setVisible(false);

      // bilingual label on a small plate (top-left), above everything
      const labelText = `${region.name} · ${region.nameTh}`;
      const label = this.add
        .text(x0 + 8, y0 + 7, labelText, {
          fontFamily: PIXEL_FONT,
          fontSize: "11px",
          color: BASE_PALETTE.parchment,
        })
        .setOrigin(0, 0);
      this.add
        .rectangle(
          x0 + 5,
          y0 + 5,
          label.width + 10,
          label.height + 6,
          hex(BASE_PALETTE.woodDark),
          0.78,
        )
        .setOrigin(0, 0)
        .setDepth(label.depth - 1);

      this.districts.set(region.id, { weather, ring });
    }

    // mood strip
    this.add
      .rectangle(0, VIRTUAL_H - 26, VIRTUAL_W, 26, hex(BASE_PALETTE.woodDark))
      .setOrigin(0, 0);
    this.moodLabel = this.add
      .text(VIRTUAL_W / 2, VIRTUAL_H - 13, "", {
        fontFamily: PIXEL_FONT,
        fontSize: "10px",
        color: BASE_PALETTE.parchment,
      })
      .setOrigin(0.5, 0.5);

    this.applyState();
    this.registry.events.on("changedata", this.applyState, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off("changedata", this.applyState, this);
    });
  }

  /** Draw the region-specific context that makes each district unmistakable. */
  private drawContext(
    id: RegionId,
    x0: number,
    y0: number,
    cellW: number,
    cellH: number,
    groundY: number,
    pal: { sky: string; ground: string; primary: string; accent: string; shade: string },
  ): void {
    const g = this.add.graphics();
    const shade = hex(pal.shade);
    const accent = hex(pal.accent);

    if (id === "central") {
      // a skyline: a few flanking towers with lit windows
      const towers = [
        { x: x0 + 36, w: 34, h: 70 },
        { x: x0 + 80, w: 26, h: 48 },
        { x: x0 + cellW - 70, w: 38, h: 84 },
        { x: x0 + cellW - 30, w: 22, h: 40 },
      ];
      for (const tw of towers) {
        g.fillStyle(shade, 1);
        g.fillRect(tw.x, groundY - tw.h, tw.w, tw.h);
        g.fillStyle(accent, 1);
        for (let wy = groundY - tw.h + 6; wy < groundY - 6; wy += 10) {
          for (let wx = tw.x + 5; wx < tw.x + tw.w - 5; wx += 9) {
            g.fillRect(wx, wy, 4, 5);
          }
        }
      }
    } else if (id === "north") {
      // layered rolling green hills + pine triangles
      g.fillStyle(accent, 1);
      g.fillEllipse(x0 + cellW * 0.3, groundY + 16, cellW * 0.7, cellH * 0.5);
      g.fillStyle(hex(pal.primary), 1);
      g.fillEllipse(x0 + cellW * 0.75, groundY + 20, cellW * 0.7, cellH * 0.45);
      g.fillStyle(shade, 1);
      for (const px of [x0 + 30, x0 + cellW - 44, x0 + cellW - 24]) {
        g.fillTriangle(px, groundY - 6, px - 9, groundY + 10, px + 9, groundY + 10);
      }
    } else if (id === "south") {
      // sea waves + a little fishing boat
      g.lineStyle(2, hex(pal.shade), 0.6);
      for (let wy = groundY + 12; wy < y0 + cellH - 6; wy += 12) {
        for (let wx = x0 + 8; wx < x0 + cellW - 16; wx += 26) {
          g.beginPath();
          g.arc(wx + 8, wy, 6, Math.PI, 0, false);
          g.strokePath();
        }
      }
      const bx = x0 + 30;
      const by = groundY + 8;
      g.fillStyle(shade, 1);
      g.fillTriangle(bx, by, bx + 26, by, bx + 20, by + 9);
      g.fillStyle(accent, 1);
      g.fillTriangle(bx + 12, by - 16, bx + 13, by - 1, bx + 24, by - 1);
    } else if (id === "northeast") {
      // rice rows in perspective + a sun
      g.fillStyle(hex(BASE_PALETTE.gold), 0.9);
      g.fillCircle(x0 + cellW - 34, y0 + 30, 12);
      g.fillStyle(accent, 1);
      let rowY = groundY + 10;
      let inset = 6;
      while (rowY < y0 + cellH - 6) {
        g.fillRect(x0 + inset, rowY, cellW - inset * 2, 3);
        rowY += 9;
        inset += 6;
      }
    }
  }

  private applyState = (): void => {
    const phase = this.registry.get("revealedPhase") as PhaseType | null;
    const allocated =
      (this.registry.get("allocated") as Record<RegionId, boolean> | null) ??
      null;

    for (const region of CONTENT.regions) {
      const refs = this.districts.get(region.id);
      if (!refs) continue;
      if (phase) {
        refs.weather.setFillStyle(hex(PHASE_TINT[phase].sky), 0.26);
      } else {
        refs.weather.setFillStyle(hex(BASE_PALETTE.gold), 0.05);
      }
      refs.ring.setVisible(Boolean(allocated && allocated[region.id]));
    }

    if (this.moodLabel) {
      this.moodLabel.setText(
        phase
          ? `Season revealed: ${phase} · ${PHASE_TINT[phase].mood}`
          : "The coming season is hidden · read the regions and invest.",
      );
    }
  };
}

function hex(s: string): number {
  return Phaser.Display.Color.HexStringToColor(s).color;
}

function bob(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.Image,
  baseY: number,
): void {
  scene.tweens.add({
    targets: obj,
    y: baseY - 4,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

export const REGION_MAP_VIRTUAL = { width: VIRTUAL_W, height: VIRTUAL_H };
