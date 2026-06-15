/** Screen 4 — Voting Hall. List the 5 candidates (one per department) and let
 * the human cast a vote, then step to elect the controller. */
import { useState } from "react";
import { getDepartment } from "@econwar/shared";
import { useGameStore } from "../store.js";
import { DeptIcon, PcTokenIcon } from "../game/index.js";
import { useT } from "../i18n/index.js";

export function VotingHall() {
  const t = useT();
  const candidates = useGameStore((s) => s.getCandidates());
  const human = useGameStore((s) => s.getHuman());
  const players = useGameStore((s) => s.getPlayers());
  const submitVote = useGameStore((s) => s.submitVote);
  const next = useGameStore((s) => s.next);

  const [picked, setPicked] = useState<string | null>(
    human ? human.id : null,
  );

  function confirm() {
    if (picked) submitVote(picked);
    next(); // tally runs inside step(); controller is elected
  }

  return (
    <>
      <div className="panel">
        <h2 className="pixel">{t("vote.title")}</h2>
        <p className="muted">{t("vote.body")}</p>

        <div>
          {candidates.map((c) => {
            const def = getDepartment(c.department);
            const isYou = human?.id === c.playerId;
            const player = players.find((p) => p.id === c.playerId);
            return (
              <button
                key={c.playerId}
                type="button"
                className={
                  "candidate" +
                  (picked === c.playerId ? " candidate--selected" : "")
                }
                aria-pressed={picked === c.playerId}
                onClick={() => setPicked(c.playerId)}
              >
                <span
                  className="candidate__swatch"
                  style={{ background: def.color }}
                >
                  <DeptIcon dept={c.department} scale={2} />
                </span>
                <span className="candidate__meta">
                  <div className="candidate__name">
                    {player?.nickname ?? def.name}{" "}
                    {isYou && (
                      <span className="badge badge--you">{t("vote.you")}</span>
                    )}
                  </div>
                  <div className="muted">
                    {def.name} | {def.playStyle}
                  </div>
                  <div className="row" style={{ gap: 4, marginTop: 2 }}>
                    <PcTokenIcon scale={2} />
                    <span className="pc" style={{ fontSize: 16 }}>
                      {player?.pc ?? 0} PC
                    </span>
                  </div>
                </span>
                {picked === c.playerId && (
                  <span className="badge">{t("vote.backed")}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={!picked}
        onClick={confirm}
      >
        {t("vote.cast")}
      </button>
    </>
  );
}
