/** Screen 1 — Lobby / Department Select.
 * Pick a nickname + 1 of 5 department banners, then start a solo game. */
import { useState } from "react";
import { CONTENT } from "@econwar/shared";
import type { DepartmentId } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { DeptIcon, LobbyBackdrop } from "../game/index.js";
import { useT } from "../i18n/index.js";
import { Settings } from "../settings/Settings.js";

export function Lobby() {
  const t = useT();
  const start = useGameStore((s) => s.start);
  const [nickname, setNickname] = useState("");
  const [dept, setDept] = useState<DepartmentId | null>(null);

  const canStart = dept !== null;

  return (
    <div className="app app--lobby">
      <LobbyBackdrop />
      <div className="lobby-topbar">
        <Settings />
      </div>
      <div className="hero-sign center">
        <h1 className="pixel">{t("app.title")}</h1>
        <p className="muted">{t("lobby.tagline")}</p>
      </div>

      <div className="panel panel--notice">
        <h2 className="pixel">{t("lobby.join")}</h2>

        <div className="field">
          <label htmlFor="nick">{t("lobby.player_name")}</label>
          <input
            id="nick"
            value={nickname}
            maxLength={20}
            placeholder={t("lobby.name_placeholder")}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <label className="section-label">{t("lobby.choose_dept")}</label>
        <div className="dept-grid">
          {CONTENT.departments.map((d) => (
            <button
              key={d.id}
              type="button"
              className={
                "dept-card" + (dept === d.id ? " dept-card--selected" : "")
              }
              style={{ background: d.color }}
              aria-pressed={dept === d.id}
              onClick={() => setDept(d.id)}
            >
              <div className="dept-card__head">
                <DeptIcon dept={d.id} scale={2} />
                <div className="dept-card__name">{d.name}</div>
              </div>
              <div className="dept-card__th">{d.nameTh}</div>
              <div className="dept-card__style">{d.playStyle}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={!canStart}
        onClick={() =>
          canStart && start({ nickname, department: dept as DepartmentId })
        }
      >
        {canStart ? t("lobby.start") : t("lobby.pick_dept")}
      </button>
    </div>
  );
}
