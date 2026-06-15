/**
 * Background music (CR-01 #4). A single looping <audio> element fed by the
 * uploaded track. Web-stack only (HTMLAudioElement) — no FMOD/Wwise. Playback
 * starts on the first user interaction (browsers block autoplay) and obeys the
 * volume/mute settings (CR-01 #5).
 */
import songUrl from "../../assets/audio/background_song.mp3";

let audio: HTMLAudioElement | null = null;
let started = false;

function el(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(songUrl);
    audio.loop = true;
    audio.preload = "auto";
  }
  return audio;
}

/** Apply current volume (0..1) and mute to the track. */
export function applyAudioSettings(volume: number, muted: boolean): void {
  const a = el();
  a.volume = Math.max(0, Math.min(1, volume));
  a.muted = muted;
  // If we've already started and the user un-mutes, make sure it's playing.
  if (started && !muted && a.paused) void a.play().catch(() => {});
}

/** Begin looping playback. Safe to call repeatedly; only the first takes effect. */
export function startMusic(): void {
  if (started) return;
  started = true;
  const a = el();
  void a.play().catch(() => {
    // Autoplay still blocked — will retry on the next interaction.
    started = false;
  });
}

/** Has playback been kicked off yet? */
export function musicStarted(): boolean {
  return started;
}
