/**
 * Settings panel (CR-01 #5): a gear button that opens a modal with three live
 * controls — background-music volume + mute, language (TH/EN), and light/dark
 * theme. All persist via the settings store (localStorage). Reachable from the
 * lobby and in-game (mount the <Settings/> button wherever needed).
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "./store.js";
import { useT } from "../i18n/index.js";

export function Settings() {
  const t = useT();
  const [open, setOpen] = useState(false);

  const locale = useSettings((s) => s.locale);
  const theme = useSettings((s) => s.theme);
  const musicVolume = useSettings((s) => s.musicVolume);
  const muted = useSettings((s) => s.muted);
  const setLocale = useSettings((s) => s.setLocale);
  const setTheme = useSettings((s) => s.setTheme);
  const setMusicVolume = useSettings((s) => s.setMusicVolume);
  const toggleMuted = useSettings((s) => s.toggleMuted);

  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={t("settings.open")}
        title={t("settings.open")}
        onClick={() => setOpen(true)}
      >
        ⚙
      </button>

      {open &&
        createPortal(
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("settings.title")}
          >
            <div className="modal__head">
              <h2 className="pixel" style={{ margin: 0 }}>
                {t("settings.title")}
              </h2>
              <button
                type="button"
                className="icon-btn"
                aria-label={t("settings.close")}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Background music */}
            <div className="setting">
              <span className="setting__label">{t("settings.music")}</span>
              <div className="setting__row">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(musicVolume * 100)}
                  aria-label={t("settings.volume")}
                  onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                />
                <span className="num" style={{ width: 48, textAlign: "right" }}>
                  {Math.round(musicVolume * 100)}%
                </span>
                <span className="seg">
                  <button
                    type="button"
                    aria-pressed={muted}
                    onClick={() => toggleMuted()}
                  >
                    {t("settings.mute")}
                  </button>
                </span>
              </div>
            </div>

            {/* Language */}
            <div className="setting">
              <span className="setting__label">{t("settings.language")}</span>
              <div className="seg">
                <button
                  type="button"
                  aria-pressed={locale === "en"}
                  onClick={() => setLocale("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  aria-pressed={locale === "th"}
                  onClick={() => setLocale("th")}
                >
                  ไทย
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="setting">
              <span className="setting__label">{t("settings.theme")}</span>
              <div className="seg">
                <button
                  type="button"
                  aria-pressed={theme === "light"}
                  onClick={() => setTheme("light")}
                >
                  {t("settings.light")}
                </button>
                <button
                  type="button"
                  aria-pressed={theme === "dark"}
                  onClick={() => setTheme("dark")}
                >
                  {t("settings.dark")}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
        )}
    </>
  );
}
