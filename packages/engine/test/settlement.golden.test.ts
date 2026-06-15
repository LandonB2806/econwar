import { describe, expect, it } from "vitest";
import { settlePhase } from "../src/index.js";
import { REGION_IDS } from "@econwar/shared";
import { caseToInputs, caseToState, loadCases } from "./goldenLoader.js";

describe("settlePhase — golden settlement cases (the contract)", () => {
  const cases = loadCases();

  it("has cases to run", () => {
    expect(cases.length).toBeGreaterThan(0);
  });

  for (const c of cases) {
    it(`reproduces golden case: ${c.name}`, () => {
      const state = caseToState(c);
      const inputs = caseToInputs(c);
      const result = settlePhase(state, inputs, c.seed);

      expect(result.event.id).toBe(c.expected.eventId);
      expect(result.leaderboard).toEqual(c.expected.leaderboard);

      for (const ps of result.players) {
        const exp = c.expected.players[ps.playerId]!;
        expect(ps.endMoney.toString(), `${ps.playerId}.endMoney`).toBe(
          exp.endMoney,
        );
        expect(
          ps.grossAfterMarket.toString(),
          `${ps.playerId}.grossAfterMarket`,
        ).toBe(exp.grossAfterMarket);
        expect(ps.taxPaid.toString(), `${ps.playerId}.taxPaid`).toBe(
          exp.taxPaid,
        );
        expect(ps.taxReceived.toString(), `${ps.playerId}.taxReceived`).toBe(
          exp.taxReceived,
        );
        expect(ps.pcEnd, `${ps.playerId}.pcEnd`).toBe(exp.pcEnd);
        for (const r of REGION_IDS) {
          expect(
            ps.regionResults[r].finalValue.toString(),
            `${ps.playerId}.${r}`,
          ).toBe(exp.regionResults[r]);
        }
      }
    });
  }

  it("is deterministic: same inputs + seed → identical result", () => {
    const c = cases[0]!;
    const a = settlePhase(caseToState(c), caseToInputs(c), c.seed);
    const b = settlePhase(caseToState(c), caseToInputs(c), c.seed);
    expect(JSON.stringify(a, (_k, v) => (typeof v === "bigint" ? v.toString() : v))).toBe(
      JSON.stringify(b, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
    );
  });
});
