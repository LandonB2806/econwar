/** Screen 3 — Portfolio / Allocation Panel. Split the human's money across the
 * 4 regions (sum ≤ money; shows remaining cash) and optionally fire the
 * department ability. submitAllocation + submitAbility, then step to settle. */
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { CONTENT, getAbility, getDepartment } from "@econwar/shared";
import type {
  AbilityActivation,
  ByRegion,
  RegionId,
  Satang,
} from "@econwar/shared";
import { useGameStore, ALL_REGIONS } from "../store.js";
import { formatBaht } from "../format.js";
import { CoinLedger, RegionIcon } from "../game/index.js";
import { useT } from "../i18n/index.js";

const SATANG_PER_BAHT = 100n;

function zeroAlloc(): ByRegion<Satang> {
  return { central: 0n, north: 0n, south: 0n, northeast: 0n };
}

export function Allocation() {
  const t = useT();
  const human = useGameStore((s) => s.getHuman());
  const players = useGameStore((s) => s.getPlayers());
  const submitAllocation = useGameStore((s) => s.submitAllocation);
  const submitAbility = useGameStore((s) => s.submitAbility);
  const next = useGameStore((s) => s.next);

  const money = human?.money ?? 0n;
  // Slider granularity: whole baht, so we never produce sub-satang values.
  const moneyBaht = Number(money / SATANG_PER_BAHT);

  // Allocation held in whole baht for the sliders (display-edge unit).
  const [bahtByRegion, setBahtByRegion] = useState<Record<RegionId, number>>({
    central: 0,
    north: 0,
    south: 0,
    northeast: 0,
  });

  const allocatedBaht = ALL_REGIONS.reduce(
    (sum, r) => sum + (bahtByRegion[r] ?? 0),
    0,
  );
  const remainingBaht = moneyBaht - allocatedBaht;
  const over = remainingBaht < 0;

  // ---- Ability state ----
  const dept = human ? getDepartment(human.department) : null;
  const ability = dept ? getAbility(dept.abilityId) : null;
  const canAfford = ability ? (human?.pc ?? 0) >= ability.pcCost : false;
  const [useAbility, setUseAbility] = useState(false);
  const [targetPlayerId, setTargetPlayerId] = useState<string>("");
  const [targetRegion, setTargetRegion] = useState<RegionId>("central");

  const rivals = useMemo(
    () => players.filter((p) => p.id !== human?.id),
    [players, human?.id],
  );

  function setRegionBaht(r: RegionId, value: number) {
    setBahtByRegion((prev) => ({ ...prev, [r]: Math.max(0, value) }));
  }

  function buildAbility(): AbilityActivation | null {
    if (!useAbility || !ability || !human) return null;
    const act: AbilityActivation = {
      actorId: human.id,
      abilityId: ability.id,
    };
    if (ability.needsTargetPlayer) {
      act.targetPlayerId = targetPlayerId || rivals[0]?.id;
    }
    if (ability.needsTargetRegion) {
      act.targetRegion = targetRegion;
    }
    return act;
  }

  function confirm() {
    if (over) return;
    const amounts = zeroAlloc();
    for (const r of ALL_REGIONS) {
      amounts[r] = BigInt(bahtByRegion[r] ?? 0) * SATANG_PER_BAHT;
    }
    submitAllocation(amounts);
    submitAbility(buildAbility());
    next(); // settlement runs inside step()
  }

  return (
    <>
      <div className="panel">
        <h2 className="pixel">{t("alloc.title")}</h2>
        <p className="muted">{t("alloc.body")}</p>

        {human && (
          <div className="ledger-wrap">
            <CoinLedger money={human.money} pc={human.pc} />
          </div>
        )}

        <div className={"cash-bar" + (over ? " cash-bar--over" : "")}>
          <span>
            {t("alloc.available")}
            <span className="money">{formatBaht(money)}</span>
          </span>
          <span>
            {over ? t("alloc.over_by") : t("alloc.cash_left")}
            <span className="num">
              {formatBaht(BigInt(Math.abs(remainingBaht)) * SATANG_PER_BAHT)}
            </span>
          </span>
        </div>

        {CONTENT.regions.map((r) => {
          const val = bahtByRegion[r.id] ?? 0;
          const pct = moneyBaht > 0 ? Math.min(100, (val / moneyBaht) * 100) : 0;
          return (
            <div
              key={r.id}
              className="alloc-row alloc-row--jar"
              style={{ "--jar-fill": `${pct}%` } as CSSProperties}
            >
              <div className="alloc-row__head">
                <span className="row alloc-row__title">
                  <RegionIcon region={r.id} scale={2} /> {r.name} ({r.nameTh}){" "}
                  <span className="muted">{r.character}</span>
                </span>
                <span className="money">
                  {formatBaht(BigInt(val) * SATANG_PER_BAHT)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={moneyBaht}
                step={Math.max(1, Math.floor(moneyBaht / 200))}
                value={val}
                onChange={(e) => setRegionBaht(r.id, Number(e.target.value))}
              />
              <input
                type="number"
                min={0}
                max={moneyBaht}
                value={val}
                onChange={(e) =>
                  setRegionBaht(r.id, Number(e.target.value) || 0)
                }
              />
            </div>
          );
        })}

        <div className="row">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() =>
              setBahtByRegion({ central: 0, north: 0, south: 0, northeast: 0 })
            }
          >
            {t("alloc.clear")}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              const each = Math.floor(moneyBaht / 4);
              setBahtByRegion({
                central: each,
                north: each,
                south: each,
                northeast: each,
              });
            }}
          >
            {t("alloc.split")}
          </button>
        </div>
      </div>

      {ability && (
        <div className="panel">
          <h3 className="pixel">
            {t("alloc.ability_title", { name: ability.name })}
          </h3>
          <p className="muted">{ability.description}</p>
          <p className="muted">
            {t("alloc.ability_cost", {
              cost: ability.pcCost,
              have: human?.pc ?? 0,
            })}
          </p>

          <label className="row ability-toggle">
            <input
              type="checkbox"
              checked={useAbility}
              disabled={!canAfford}
              onChange={(e) => setUseAbility(e.target.checked)}
              className="ability-toggle__box"
            />
            {canAfford ? t("alloc.use_ability") : t("alloc.not_enough_pc")}
          </label>

          {useAbility && ability.needsTargetPlayer && (
            <div className="field field--spaced">
              <label>{t("alloc.target_rival")}</label>
              <select
                value={targetPlayerId || rivals[0]?.id || ""}
                onChange={(e) => setTargetPlayerId(e.target.value)}
              >
                {rivals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname}
                  </option>
                ))}
              </select>
            </div>
          )}

          {useAbility && ability.needsTargetRegion && (
            <div className="field field--spaced">
              <label>{t("alloc.target_region")}</label>
              <select
                value={targetRegion}
                onChange={(e) => setTargetRegion(e.target.value as RegionId)}
              >
                {CONTENT.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.nameTh})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block"
        disabled={over}
        onClick={confirm}
      >
        {over ? t("alloc.reduce") : t("alloc.lock_in")}
      </button>
    </>
  );
}
