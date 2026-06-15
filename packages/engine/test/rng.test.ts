import { describe, expect, it } from "vitest";
import { makeRng, phaseSeed } from "../src/index.js";
import { loadRngVector } from "./goldenLoader.js";

describe("mulberry32 RNG — pinned golden vector", () => {
  it("reproduces the locked uint32 stream", () => {
    const v = loadRngVector();
    const rng = makeRng(v.seed);
    const got = v.u32.map(() => rng.nextU32());
    expect(got).toEqual(v.u32);
  });

  it("nextU32 stays within uint32 range", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 1000; i++) {
      const u = rng.nextU32();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThanOrEqual(0xffffffff);
      expect(Number.isInteger(u)).toBe(true);
    }
  });

  it("nextBelow(n) returns an integer in [0, n)", () => {
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = rng.nextBelow(7);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(7);
      expect(Number.isInteger(x)).toBe(true);
    }
  });

  it("phaseSeed is stable and phase-dependent", () => {
    expect(phaseSeed(12345, 0)).toBe(phaseSeed(12345, 0));
    expect(phaseSeed(12345, 0)).not.toBe(phaseSeed(12345, 1));
  });
});
