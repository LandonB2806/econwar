/** Screen 4 (cont.) — Controller Action. If the human won the election, show a
 * tilt control (pick a region + magnitude) → submitControllerTilt. Otherwise a
 * bot controls the market and we just continue. */
import { useState } from "react";
import { CONTENT, MAX_TILT_BP, getDepartment } from "@econwar/shared";
import type { RegionId } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { useT } from "../i18n/index.js";

const MAX_TILT = Number(MAX_TILT_BP); // 2000 bp = +20%

export function ControllerAction() {
  const t = useT();
  const isController = useGameStore((s) => s.isHumanController());
  const controllerId = useGameStore((s) => s.getControllerId());
  const players = useGameStore((s) => s.getPlayers());
  const submitTilt = useGameStore((s) => s.submitControllerTilt);
  const next = useGameStore((s) => s.next);

  const [region, setRegion] = useState<RegionId | null>(null);
  const [magBp, setMagBp] = useState<number>(1000);

  const controller = players.find((p) => p.id === controllerId);

  function confirm() {
    if (isController) {
      submitTilt({ boostRegion: region, magnitudeBp: region ? magBp : 0 });
    }
    next();
  }

  if (!isController) {
    const def = controller ? getDepartment(controller.department) : null;
    return (
      <>
        <div className="panel">
          <h2 className="pixel">{t("controller.title")}</h2>
          <p className="muted">
            {t("controller.bot_body", {
              name: controller?.nickname ?? t("controller.bot_unknown"),
              dept: def ? ` (${def.name})` : "",
            })}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={confirm}
        >
          {t("controller.send")}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="panel">
        <h2 className="pixel">{t("controller.you_title")}</h2>
        <p className="muted">
          {t("controller.you_body", { max: (MAX_TILT / 100).toFixed(0) })}
        </p>

        <div className="region-grid">
          <button
            type="button"
            className={
              "candidate" + (region === null ? " candidate--selected" : "")
            }
            aria-pressed={region === null}
            onClick={() => setRegion(null)}
          >
            <span className="candidate__meta">
              <div className="candidate__name">{t("controller.neutral")}</div>
              <div className="muted">{t("controller.neutral_sub")}</div>
            </span>
          </button>
          {CONTENT.regions.map((r) => (
            <button
              key={r.id}
              type="button"
              className={
                "candidate" + (region === r.id ? " candidate--selected" : "")
              }
              aria-pressed={region === r.id}
              onClick={() => setRegion(r.id)}
            >
              <span className="candidate__meta">
                <div className="candidate__name">
                  {t("controller.boost", { name: r.name, nameTh: r.nameTh })}
                </div>
                <div className="muted">{r.character}</div>
              </span>
            </button>
          ))}
        </div>

        {region && (
          <div className="alloc-row">
            <div className="alloc-row__head">
              <span>{t("controller.magnitude")}</span>
              <strong>+{(magBp / 100).toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_TILT}
              step={100}
              value={magBp}
              onChange={(e) => setMagBp(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={confirm}
      >
        {t("controller.seal")}
      </button>
    </>
  );
}
