import { describe, expect, it } from "vitest";
import { project } from "@econwar/shared";
import type { ByRegion, GameState, ProjectionData } from "@econwar/shared";
import { createGame } from "../src/index.js";

function tilt(): ByRegion<bigint> {
  return { central: 12000n, north: 9700n, south: 9700n, northeast: 9700n };
}

function alloc(c: bigint): ByRegion<bigint> {
  return { central: c, north: 0n, south: 0n, northeast: 0n };
}

const base: GameState = createGame("g1", "multi", 1, [
  { id: "p1", nickname: "P1", department: "government" },
  { id: "p2", nickname: "P2", department: "ir" },
]);

const data: ProjectionData = {
  allocations: { p1: alloc(50_000_000n), p2: alloc(60_000_000n) },
  controllerTilt: tilt(),
};

describe("project() — anti-leak boundary (golden rule #5)", () => {
  it("hides phase type, controller tilt, and rivals' allocations before SETTLE", () => {
    const state = { ...base, step: "allocation" as const, settled: false };
    const view = project(state, "p1", data);

    expect(view.settled).toBe(false);
    expect(view.phaseType).toBeNull();
    expect(view.controllerTilt).toBeNull();
    expect(view.allAllocations).toBeNull();

    // Viewer may see their own allocation, but not the rival's anywhere.
    expect(view.ownAllocation).toEqual(alloc(50_000_000n));
    const serialized = JSON.stringify(view, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
    expect(serialized).not.toContain("60000000"); // p2's allocation must not leak
  });

  it("reveals hidden truth once settled === true", () => {
    const state = { ...base, step: "settlement" as const, settled: true };
    const view = project(state, "p1", data);

    expect(view.settled).toBe(true);
    expect(view.phaseType).toBe(state.phaseOrder[0]);
    expect(view.controllerTilt).not.toBeNull();
    expect(view.allAllocations).not.toBeNull();
    expect(view.allAllocations?.p2).toEqual(alloc(60_000_000n));
  });
});
