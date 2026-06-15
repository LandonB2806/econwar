/**
 * Loads + validates the data-driven content JSON once, and exposes typed
 * lookup helpers. If any JSON drifts from the schema, this throws at import
 * time — failing fast rather than mis-settling a game.
 */
import regionsFile from "./content/regions.json" with { type: "json" };
import phasesFile from "./content/phases.json" with { type: "json" };
import departmentsFile from "./content/departments.json" with { type: "json" };
import abilitiesFile from "./content/abilities.json" with { type: "json" };
import eventDeckFile from "./content/eventDeck.json" with { type: "json" };

import {
  regionsFileSchema,
  phasesFileSchema,
  departmentsFileSchema,
  abilitiesFileSchema,
  eventDeckFileSchema,
} from "./schema.js";
import type {
  AbilityDef,
  AbilityId,
  Content,
  DepartmentDef,
  DepartmentId,
  EventDef,
  PhaseDef,
  PhaseType,
  RegionDef,
  RegionId,
} from "./types.js";

const regions = regionsFileSchema.parse(regionsFile).regions as RegionDef[];
const phases = phasesFileSchema.parse(phasesFile).phases as PhaseDef[];
const departments = departmentsFileSchema.parse(departmentsFile)
  .departments as DepartmentDef[];
const abilities = abilitiesFileSchema.parse(abilitiesFile)
  .abilities as AbilityDef[];
const events = eventDeckFileSchema.parse(eventDeckFile).events as EventDef[];

export const CONTENT: Content = {
  regions,
  phases,
  departments,
  abilities,
  events,
};

const regionById = new Map(regions.map((r) => [r.id, r]));
const phaseByType = new Map(phases.map((p) => [p.type, p]));
const departmentById = new Map(departments.map((d) => [d.id, d]));
const abilityById = new Map(abilities.map((a) => [a.id, a]));

export function getRegion(id: RegionId): RegionDef {
  const r = regionById.get(id);
  if (!r) throw new Error(`Unknown region: ${id}`);
  return r;
}

export function getPhase(type: PhaseType): PhaseDef {
  const p = phaseByType.get(type);
  if (!p) throw new Error(`Unknown phase: ${type}`);
  return p;
}

export function getDepartment(id: DepartmentId): DepartmentDef {
  const d = departmentById.get(id);
  if (!d) throw new Error(`Unknown department: ${id}`);
  return d;
}

export function getAbility(id: AbilityId): AbilityDef {
  const a = abilityById.get(id);
  if (!a) throw new Error(`Unknown ability: ${id}`);
  return a;
}

export const EVENT_DECK: readonly EventDef[] = events;
