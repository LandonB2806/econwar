/**
 * Binds the background-music element to the settings store and to the first
 * user interaction (CR-01 #4). Mount once near the app root.
 */
import { useEffect } from "react";
import { useSettings } from "../settings/store.js";
import { applyAudioSettings, startMusic } from "./music.js";

export function useMusic(): void {
  const volume = useSettings((s) => s.musicVolume);
  const muted = useSettings((s) => s.muted);

  useEffect(() => {
    applyAudioSettings(volume, muted);
  }, [volume, muted]);

  useEffect(() => {
    const kick = () => startMusic();
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);
}
