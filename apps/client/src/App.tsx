/** App shell — routes between the Lobby and the in-game screens. The in-game
 * view maps the SoloGame's current FSM step to one of the 5 screens. */
import type { ReactElement } from "react";
import { useGameStore } from "./store.js";
import { getDepartment } from "@econwar/shared";
import { PhasePips, StepTrack } from "./components/common.js";
import { Wallet, DeptIcon } from "./game/index.js";
import { useT } from "./i18n/index.js";
import { useMusic } from "./audio/useMusic.js";
import { Settings } from "./settings/Settings.js";
import { Lobby } from "./components/Lobby.js";
import { IndicatorReveal } from "./components/IndicatorReveal.js";
import { VotingHall } from "./components/VotingHall.js";
import { ControllerAction } from "./components/ControllerAction.js";
import { Allocation } from "./components/Allocation.js";
import { Settlement } from "./components/Settlement.js";
import { GameOver } from "./components/GameOver.js";

function InGame() {
  const t = useT();
  const step = useGameStore((s) => s.getStep());
  const phaseIndex = useGameStore((s) => s.getPhaseIndex());
  const human = useGameStore((s) => s.getHuman());
  const reset = useGameStore((s) => s.reset);

  let screen: ReactElement;
  switch (step) {
    case "indicator_reveal":
      screen = <IndicatorReveal />;
      break;
    case "vote":
      screen = <VotingHall />;
      break;
    case "controller_action":
      screen = <ControllerAction />;
      break;
    case "allocation":
      screen = <Allocation />;
      break;
    case "settlement":
      screen = <Settlement />;
      break;
    case "game_over":
      screen = <GameOver />;
      break;
    default:
      screen = <IndicatorReveal />;
  }

  const dept = human ? getDepartment(human.department) : null;
  const isOver = step === "game_over";

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar__brand">
          <h1 className="pixel" style={{ fontSize: 18 }}>
            {t("app.title")}
          </h1>
          {!isOver && <PhasePips phaseIndex={phaseIndex} />}
        </div>
        <div className="row">
          {human && (
            <span className="hud__cell" title={dept?.name}>
              <DeptIcon dept={human.department} scale={2} />
              <span className="hud__name">{human.nickname}</span>
            </span>
          )}
          {human && <Wallet money={human.money} pc={human.pc} />}
          <Settings />
          <button type="button" className="btn btn--ghost" onClick={reset}>
            {t("app.quit")}
          </button>
        </div>
      </div>

      {!isOver && <StepTrack step={step} />}
      <div className="screen-gap" />
      {screen}
    </div>
  );
}

export function App() {
  useMusic(); // bind background music to settings + first interaction
  const screen = useGameStore((s) => s.screen);
  return screen === "lobby" ? <Lobby /> : <InGame />;
}
