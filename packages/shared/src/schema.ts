/**
 * Zod schemas validate all external/data-driven input at the boundary:
 * content JSON on load, and player intents on the server. The engine itself
 * assumes already-valid data.
 */
import { z } from "zod";

export const regionIdSchema = z.enum([
  "central",
  "north",
  "south",
  "northeast",
]);
export const phaseTypeSchema = z.enum([
  "boom",
  "recession",
  "recovery",
  "slowdown",
]);
export const departmentIdSchema = z.enum([
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
]);
export const abilityIdSchema = z.enum([
  "gov_tax",
  "ir_peek",
  "soc_marketmove",
  "pa_rebalance",
  "pg_foresight",
]);
export const abilityKindSchema = z.enum([
  "TAX",
  "GLOBAL_REGION_MULT",
  "REGION_MULT",
  "INFO",
  "REBALANCE",
]);
export const eventTargetSchema = z.union([
  regionIdSchema,
  z.literal("all"),
  z.literal("none"),
]);

const bp = z.number().int().nonnegative();
const byPhase = z.object({
  boom: bp,
  recession: bp,
  recovery: bp,
  slowdown: bp,
});
const byRegionNum = z.object({
  central: bp,
  north: bp,
  south: bp,
  northeast: bp,
});

export const regionDefSchema = z.object({
  id: regionIdSchema,
  name: z.string(),
  nameTh: z.string(),
  character: z.string(),
  modifier: byPhase,
});

export const phaseDefSchema = z.object({
  type: phaseTypeSchema,
  theme: z.string(),
  baseEffect: byRegionNum,
});

export const departmentDefSchema = z.object({
  id: departmentIdSchema,
  name: z.string(),
  nameTh: z.string(),
  color: z.string(),
  playStyle: z.string(),
  abilityId: abilityIdSchema,
  pcRate: byPhase,
});

export const abilityDefSchema = z.object({
  id: abilityIdSchema,
  department: departmentIdSchema,
  name: z.string(),
  kind: abilityKindSchema,
  pcCost: z.number().int().nonnegative(),
  magnitudeBp: z.number().int().nonnegative(),
  needsTargetPlayer: z.boolean(),
  needsTargetRegion: z.boolean(),
  description: z.string(),
});

export const eventDefSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: eventTargetSchema,
  multiplierBp: z.number().int().nonnegative(),
  weight: z.number().int().positive(),
});

/** Wrappers matching the on-disk JSON shape ({ "$comment", regions: [...] }). */
export const regionsFileSchema = z.object({ regions: z.array(regionDefSchema) });
export const phasesFileSchema = z.object({ phases: z.array(phaseDefSchema) });
export const departmentsFileSchema = z.object({
  departments: z.array(departmentDefSchema),
});
export const abilitiesFileSchema = z.object({
  abilities: z.array(abilityDefSchema),
});
export const eventDeckFileSchema = z.object({ events: z.array(eventDefSchema) });

/* ---- Player-intent schemas (used server-side at intake) ---- */

export const allocationIntentSchema = z.object({
  playerId: z.string().min(1),
  amounts: byRegionNum, // satang as JSON numbers at the wire; converted to bigint at intake
});

export const voteIntentSchema = z.object({
  voterId: z.string().min(1),
  candidateId: z.string().min(1),
});

export const abilityIntentSchema = z.object({
  actorId: z.string().min(1),
  abilityId: abilityIdSchema,
  targetPlayerId: z.string().min(1).optional(),
  targetRegion: regionIdSchema.optional(),
});
