/** Game-over screen — crowns the winner and shows the final leaderboard. */
import { getDepartment } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { formatBaht } from "../format.js";
import { DeptDot } from "./common.js";
import { useT } from "../i18n/index.js";

export function GameOver() {
  const t = useT();
  const winner = useGameStore((s) => s.getWinner());
  const human = useGameStore((s) => s.getHuman());
  const leaderboard = useGameStore((s) => s.getLeaderboard());
  const reset = useGameStore((s) => s.reset);

  const humanWon = winner?.id === human?.id;
  const winnerDef = winner ? getDepartment(winner.department) : null;

  return (
    <>
      <div className="panel winner-banner">
        <div className="trophy" aria-hidden="true">
          {humanWon ? t("over.trophy_win") : t("over.trophy_top")}
        </div>
        <h1 className="pixel" style={{ color: "var(--ink)" }}>
          {humanWon
            ? t("over.win")
            : t("over.winner", {
                name: winner?.nickname ?? t("over.winner_fallback"),
              })}
        </h1>
        {winner && winnerDef && (
          <p className="muted">
            {t("over.final_nw", {
              dept: winnerDef.name,
              money: formatBaht(winner.money),
            })}
          </p>
        )}
      </div>

      <div className="panel">
        <h3 className="pixel">{t("over.board")}</h3>
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
        onClick={reset}
      >
        {t("over.play_again")}
      </button>
    </>
  );
}
