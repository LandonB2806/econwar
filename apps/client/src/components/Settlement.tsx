/** Screen 5 — Phase Settlement + Leaderboard. After settlement, show the
 * human's per-region gains/losses (coin-pop flavor) and the running leaderboard.
 * The "Next" here advances into the next phase (or game over). */
import { CONTENT, getDepartment } from "@econwar/shared";
import type { RegionId } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { formatBaht, formatDelta } from "../format.js";
import { DeptDot } from "./common.js";
import { RegionMap, CoinLedger } from "../game/index.js";
import { useT } from "../i18n/index.js";

const REGIONS: RegionId[] = ["central", "north", "south", "northeast"];

export function Settlement() {
  const t = useT();
  const settlement = useGameStore((s) => s.getLastSettlement());
  const human = useGameStore((s) => s.getHuman());
  const leaderboard = useGameStore((s) => s.getLeaderboard());
  const phaseIndex = useGameStore((s) => s.getPhaseIndex());
  const next = useGameStore((s) => s.next);

  const mine = settlement?.players.find((p) => p.playerId === human?.id);
  const isLastPhase = phaseIndex >= 3;

  const eventName = settlement?.event.name;
  const phaseType = settlement?.phaseType ?? null;

  // Highlight the regions the human actually invested in.
  const allocated = REGIONS.reduce(
    (acc, r) => {
      const rr = mine?.regionResults[r];
      acc[r] = Boolean(rr && rr.allocated > 0n);
      return acc;
    },
    {} as Record<RegionId, boolean>,
  );

  return (
    <>
      <div className="panel">
        <h2 className="pixel">{t("settle.title", { n: phaseIndex + 1 })}</h2>
        {phaseType && (
          <p className="muted">
            {t("settle.hidden_was", { phase: t(`phase.${phaseType}`) })}
            {eventName ? t("settle.event", { name: eventName }) : ""}
          </p>
        )}
        <RegionMap revealedPhase={phaseType} allocated={allocated} />

        {mine ? (
          <>
            {CONTENT.regions.map((r) => {
              const rr = mine.regionResults[r.id as RegionId];
              if (!rr || rr.allocated === 0n) return null;
              const delta = rr.finalValue - rr.allocated;
              return (
                <div key={r.id} className="settle-row">
                  <span>
                    {r.name} ({r.nameTh})
                  </span>
                  <span className="muted">
                    {formatBaht(rr.allocated)} {t("settle.to")}
                  </span>
                  <span className={delta >= 0n ? "delta-up" : "delta-down"}>
                    {formatBaht(rr.finalValue)} ({formatDelta(delta)})
                  </span>
                </div>
              );
            })}
            {(mine.taxPaid > 0n || mine.taxReceived > 0n) && (
              <div className="settle-row">
                <span>{t("settle.taxes")}</span>
                <span className="delta-down">
                  {mine.taxPaid > 0n ? `-${formatBaht(mine.taxPaid)}` : ""}
                </span>
                <span className="delta-up">
                  {mine.taxReceived > 0n
                    ? `+${formatBaht(mine.taxReceived)}`
                    : ""}
                </span>
              </div>
            )}
            <div className="settle-row" style={{ fontWeight: 800 }}>
              <span>{t("settle.net_worth")}</span>
              <span className="muted">
                {formatBaht(mine.startMoney)} {t("settle.to")}
              </span>
              <span
                className={
                  mine.endMoney >= mine.startMoney ? "delta-up" : "delta-down"
                }
              >
                {formatBaht(mine.endMoney)} (
                {formatDelta(mine.endMoney - mine.startMoney)})
              </span>
            </div>
            <p className="muted">
              {t("settle.pc_line", { a: mine.pcStart, b: mine.pcEnd })}
              {mine.pcSpent > 0 ? t("settle.spent", { n: mine.pcSpent }) : ""}
            </p>
            <h3 className="pixel" style={{ marginTop: "var(--s4)" }}>
              {t("settle.your_harvest")}
            </h3>
            <CoinLedger money={mine.endMoney} pc={mine.pcEnd} />
          </>
        ) : (
          <p className="muted">{t("settle.no_data")}</p>
        )}
      </div>

      <div className="panel">
        <h3 className="pixel">{t("settle.scoreboard")}</h3>
        <ol className="leaderboard">
          {leaderboard.map((row) => {
            const def = getDepartment(row.department);
            const isYou = row.playerId === human?.id;
            return (
              <li
                key={row.playerId}
                className={"lb-row" + (isYou ? " lb-row--you" : "")}
              >
                <span className="lb-rank">#{row.rank}</span>
                <DeptDot dept={row.department} />
                <span className="lb-name">
                  {row.nickname}
                  {isYou ? ` ${t("over.you")}` : ""}{" "}
                  <span className="muted">| {def.name}</span>
                </span>
                <span className="lb-money">{formatBaht(row.money)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={next}
      >
        {isLastPhase
          ? t("settle.final_result")
          : t("settle.begin_phase", { n: phaseIndex + 2 })}
      </button>
    </>
  );
}
