/** Shared loader: turns the committed golden JSON into engine inputs. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  AbilityActivation,
  ByRegion,
  DepartmentId,
  GameState,
  PhaseInputs,
  PhaseType,
  PlayerState,
} from "@econwar/shared";
import { REGION_IDS } from "@econwar/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = resolve(__dirname, "../../../golden");

export interface GoldenCase {
  name: string;
  seed: number;
  phaseType: PhaseType;
  controllerId: string | null;
  controllerTilt: Record<string, string>;
  players: Array<{ id: string; department: DepartmentId; money: string; pc: number }>;
  allocations: Record<string, Record<string, string>>;
  abilities: AbilityActivation[];
  expected: {
    eventId: string;
    leaderboard: string[];
    players: Record<
      string,
      {
        endMoney: string;
        grossAfterMarket: string;
        taxPaid: string;
        taxReceived: string;
        pcEnd: number;
        regionResults: Record<string, string>;
      }
    >;
  };
}

export function loadCases(): GoldenCase[] {
  const raw = readFileSync(resolve(GOLDEN_DIR, "settlement_cases.json"), "utf8");
  return (JSON.parse(raw) as { cases: GoldenCase[] }).cases;
}

export function loadRngVector(): { seed: number; u32: number[] } {
  const raw = readFileSync(resolve(GOLDEN_DIR, "rng_vector.json"), "utf8");
  return JSON.parse(raw) as { seed: number; u32: number[] };
}

function toRegionMap(src: Record<string, string>): ByRegion<bigint> {
  const out = {} as ByRegion<bigint>;
  for (const r of REGION_IDS) out[r] = BigInt(src[r] ?? "0");
  return out;
}

export function caseToState(c: GoldenCase): GameState {
  const players: PlayerState[] = c.players.map((p) => ({
    id: p.id,
    nickname: p.id.toUpperCase(),
    department: p.department,
    money: BigInt(p.money),
    pc: p.pc,
  }));
  return {
    id: "golden",
    mode: "solo",
    seed: 0,
    phaseIndex: 0,
    phaseOrder: ["boom", "recession", "recovery", "slowdown"],
    step: "settlement",
    players,
    controllerId: c.controllerId,
    settled: false,
  };
}

export function caseToInputs(c: GoldenCase): PhaseInputs {
  const allocations: Record<string, ByRegion<bigint>> = {};
  for (const [id, m] of Object.entries(c.allocations)) {
    allocations[id] = toRegionMap(m);
  }
  return {
    phaseType: c.phaseType,
    allocations,
    controllerTilt: toRegionMap(c.controllerTilt),
    controllerId: c.controllerId,
    abilities: c.abilities,
  };
}
