/**
 * <PixelIcon/> — renders one procedural pixel sprite (from src/art) onto a tiny
 * canvas for use inside the React UI: department mascots on banners/candidates,
 * coins on the settlement screen, region motifs in lists. Keeps the menus and
 * the Phaser world visually unified (same sprite source).
 */
import { useEffect, useRef } from "react";
import {
  DEPARTMENT_SPRITE,
  REGION_SPRITE,
  SPRITE_COIN,
  SPRITE_PC_TOKEN,
  renderPixelSprite,
  spriteHeight,
  spriteWidth,
} from "../art/index.js";
import type { PixelSprite } from "../art/index.js";
import type { DepartmentId, RegionId } from "@econwar/shared";

interface PixelIconProps {
  sprite: PixelSprite;
  scale?: number;
  className?: string;
}

export function PixelIcon({ sprite, scale = 3, className }: PixelIconProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const s = Math.max(1, Math.floor(scale));
    canvas.width = spriteWidth(sprite) * s;
    canvas.height = spriteHeight(sprite) * s;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderPixelSprite(ctx, sprite, 0, 0, s);
  }, [sprite, scale]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export function DeptIcon({ dept, scale }: { dept: DepartmentId; scale?: number }) {
  return <PixelIcon sprite={DEPARTMENT_SPRITE[dept]} scale={scale ?? 3} />;
}

export function RegionIcon({ region, scale }: { region: RegionId; scale?: number }) {
  return <PixelIcon sprite={REGION_SPRITE[region]} scale={scale ?? 3} />;
}

export function CoinIcon({ scale }: { scale?: number }) {
  return <PixelIcon sprite={SPRITE_COIN} scale={scale ?? 2} />;
}

export function PcTokenIcon({ scale }: { scale?: number }) {
  return <PixelIcon sprite={SPRITE_PC_TOKEN} scale={scale ?? 2} />;
}
