import { describe, expect, it } from "vitest";
import { advance, createGame, currentPhaseType, shufflePhaseOrder } from "../src/index.js";
import { PHASES_PER_GAME, PHASE_TYPES, STARTING_CAPITAL_SATANG } from "@econwar/shared";

describe("stateMachine", () => {
  it("seeds equal starting capital and a hidden, complete phase order", () => {
    const g = createGame("g", "solo", 7, [
      { id: "p1", nickname: "P1", department: "government" },
    ]);
    expect(g.players[0]!.money).toBe(STARTING_CAPITAL_SATANG);
    expect(g.phaseOrder).toHaveLength(PHASES_PER_GAME);
    expect(new Set(g.phaseOrder)).toEqual(new Set(PHASE_TYPES));
  });

  it("shuffle is deterministic per seed", () => {
    expect(shufflePhaseOrder(123)).toEqual(shufflePhaseOrder(123));
  });

  it("runs the round loop then ends after the final phase", () => {
    let g = createGame("g", "solo", 7, [
      { id: "p1", nickname: "P1", department: "government" },
    ]);
    const steps: string[] = [];
    // Drive 4 phases through the loop.
    for (let phase = 0; phase < PHASES_PER_GAME; phase++) {
      // lobby->reveal happens once; thereafter settlement->reveal.
      while (g.step !== "settlement" && g.step !== "game_over") {
        steps.push(g.step);
        g = advance(g);
      }
      expect(g.step).toBe("settlement");
      g = advance(g); // settlement -> next phase reveal OR game_over
    }
    expect(g.step).toBe("game_over");
    expect(currentPhaseType).toBeTypeOf("function");
  });
});
