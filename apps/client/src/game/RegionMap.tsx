/**
 * <RegionMap/> — mounts the Phaser RegionMapScene into the React tree and feeds
 * it data via the Phaser registry. StrictMode-safe: the game is created in an
 * effect and destroyed on cleanup, so the dev double-invoke nets one instance.
 *
 * `revealedPhase` is null during the hidden steps (cozy neutral wash) and set to
 * the true phase only at settlement — the scene turns that into weather.
 */
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import type { PhaseType, RegionId } from "@econwar/shared";
import { BASE_PALETTE } from "../art/index.js";
import { RegionMapScene, REGION_MAP_VIRTUAL } from "./RegionMapScene.js";

interface RegionMapProps {
  revealedPhase: PhaseType | null;
  allocated?: Record<RegionId, boolean>;
}

export function RegionMap({ revealedPhase, allocated }: RegionMapProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Create / destroy the Phaser game with the component's lifecycle.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: REGION_MAP_VIRTUAL.width,
      height: REGION_MAP_VIRTUAL.height,
      backgroundColor: BASE_PALETTE.parchment,
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [RegionMapScene],
    });
    game.registry.set("revealedPhase", revealedPhase ?? null);
    game.registry.set("allocated", allocated ?? null);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Create once on mount; data updates go through the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push data changes into the running game's registry.
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    game.registry.set("revealedPhase", revealedPhase ?? null);
    game.registry.set("allocated", allocated ?? null);
  }, [revealedPhase, allocated]);

  return <div className="region-map" ref={hostRef} />;
}
