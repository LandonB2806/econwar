/** Small shared presentational bits used across screens. */
import { getDepartment } from "@econwar/shared";
import type { DepartmentId, GamePhaseStep } from "@econwar/shared";
import { useT } from "../i18n/index.js";

/** Department color swatch dot. */
export function DeptDot({ dept }: { dept: DepartmentId }) {
  const def = getDepartment(dept);
  return (
    <span
      className="dept-dot"
      style={{ background: def.color }}
      title={def.name}
    />
  );
}

const PHASE_COUNT = 4;

/** Four phase pips: done / current / upcoming. */
export function PhasePips({ phaseIndex }: { phaseIndex: number }) {
  const t = useT();
  return (
    <div
      className="phase-pips"
      aria-label={t("phase.aria", { n: phaseIndex + 1 })}
    >
      {Array.from({ length: PHASE_COUNT }, (_, i) => (
        <span
          key={i}
          className={
            "pip" +
            (i < phaseIndex ? " pip--done" : "") +
            (i === phaseIndex ? " pip--current" : "")
          }
          title={t("phase.label", { n: i + 1 })}
        />
      ))}
    </div>
  );
}

const STEP_ORDER: GamePhaseStep[] = [
  "indicator_reveal",
  "vote",
  "controller_action",
  "allocation",
  "settlement",
];

/** Horizontal step tracker for the 5-step round loop. */
export function StepTrack({ step }: { step: GamePhaseStep }) {
  const t = useT();
  const activeIdx = STEP_ORDER.indexOf(step);
  return (
    <div className="step-track">
      {STEP_ORDER.map((id, i) => (
        <span
          key={id}
          className={
            "step-chip" +
            (i === activeIdx ? " step-chip--active" : "") +
            (activeIdx >= 0 && i < activeIdx ? " step-chip--done" : "")
          }
        >
          {t(`step.${id}`)}
        </span>
      ))}
    </div>
  );
}
