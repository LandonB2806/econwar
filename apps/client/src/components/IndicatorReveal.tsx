/** Screen 2 (part) — Region Map hub shown during the Indicator Reveal step.
 * The 4 regions as tiles + the regional-character hints. The TRUE phase is
 * hidden; the player must infer it. */
import { CONTENT } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { RegionMap, RegionIcon } from "../game/index.js";
import { useT } from "../i18n/index.js";

export function IndicatorReveal() {
  const t = useT();
  const next = useGameStore((s) => s.next);

  return (
    <>
      <div className="panel">
        <h2 className="pixel">{t("reveal.title")}</h2>
        <p className="muted">{t("reveal.body")}</p>
        <ul className="indicator-list notice-grid">
          <li>
            <strong>{t("reveal.notice_prices_t")}</strong>
            <span>{t("reveal.notice_prices_b")}</span>
          </li>
          <li>
            <strong>{t("reveal.notice_bank_t")}</strong>
            <span>{t("reveal.notice_bank_b")}</span>
          </li>
          <li>
            <strong>{t("reveal.notice_bus_t")}</strong>
            <span>{t("reveal.notice_bus_b")}</span>
          </li>
          <li>
            <strong>{t("reveal.notice_mood_t")}</strong>
            <span>{t("reveal.notice_mood_b")}</span>
          </li>
        </ul>
      </div>

      <div className="panel">
        <h3 className="pixel">{t("reveal.regions_title")}</h3>
        <RegionMap revealedPhase={null} />
        <ul className="region-legend">
          {CONTENT.regions.map((r) => (
            <li key={r.id} className="region-legend__item">
              <RegionIcon region={r.id} scale={2} />
              <span>
                <strong>
                  {r.name} ({r.nameTh})
                </strong>
                <br />
                <span className="muted">{r.character}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className="btn btn--primary btn--block" onClick={next}>
        {t("reveal.to_voting")}
      </button>
    </>
  );
}
