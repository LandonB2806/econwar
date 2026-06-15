/**
 * Player settings (CR-01 #5): background-music volume + mute, language, and a
 * light/dark theme. Persisted to localStorage so they survive reloads (this is
 * the real app, not a sandboxed artifact). The theme is mirrored onto
 * <html data-theme> so CSS variables switch; the locale drives i18n (CR-01 #1);
 * volume/mute drive the audio manager (CR-01 #4).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "en" | "th";
export type Theme = "light" | "dark";

interface SettingsState {
  locale: Locale;
  theme: Theme;
  /** 0..1 */
  musicVolume: number;
  muted: boolean;
  setLocale: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  setMusicVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
}

/** Apply the theme to <html> so the CSS token block switches. */
export function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}

function detectLocale(): Locale {
  if (typeof navigator !== "undefined" && /^th/i.test(navigator.language)) {
    return "th";
  }
  return "en";
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: detectLocale(),
      theme: "light",
      musicVolume: 0.5,
      muted: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setMusicVolume: (musicVolume) =>
        set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set({ muted: !get().muted }),
    }),
    {
      name: "econwar.settings",
      onRehydrateStorage: () => (state) => {
        // Apply the persisted theme as soon as it loads.
        applyTheme(state?.theme ?? "light");
      },
    },
  ),
);

// Apply the initial theme synchronously at module load (before first paint).
applyTheme(useSettings.getState().theme);
