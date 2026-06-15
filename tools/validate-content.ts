/**
 * EconWar content-integrity validator (Tools & Data Pipeline).
 *
 * Enforces CLAUDE.md golden rule #6 ("Data-driven content") and #7 ("Tests are
 * the contract") at the data layer: every content JSON is validated against its
 * Zod schema from @econwar/shared, then cross-referenced for relational
 * integrity the schema alone cannot express (bijections, completeness, sane
 * basis-point bands).
 *
 * Run:  npx tsx tools/validate-content.ts
 * Exit: 0 on success (warnings allowed), non-zero on any error.
 *
 * This tool only READS content; it never mutates it. It lives outside
 * packages/ so it can be wired as a pre-test / CI gate without touching the
 * shipped engine or shared package.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { schema } from "@econwar/shared";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(HERE, "../packages/shared/src/content");

const REGIONS = ["central", "north", "south", "northeast"] as const;
const PHASES = ["boom", "recession", "recovery", "slowdown"] as const;
const DEPARTMENTS = [
  "government",
  "ir",
  "sociology",
  "public_admin",
  "politics_global",
] as const;

/** Basis-point band considered "sane" for tuning values (10000 = x1.0). */
const BP_LOW = 5000;
const BP_HIGH = 20000;

// ---- reporting -------------------------------------------------------------

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ---- load + schema-validate ------------------------------------------------

function loadJson(file: string): unknown {
  const path = resolve(CONTENT_DIR, file);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    err(`[${file}] could not read/parse JSON: ${(e as Error).message}`);
    return undefined;
  }
}

/** Parse `raw` with `s`; on failure record every Zod issue and return null. */
function parse<T>(file: string, s: z.ZodType<T>, raw: unknown): T | null {
  if (raw === undefined) return null;
  const r = s.safeParse(raw);
  if (r.success) return r.data;
  for (const issue of r.error.issues) {
    const where = issue.path.length ? issue.path.join(".") : "(root)";
    err(`[${file}] schema: ${where} — ${issue.message}`);
  }
  return null;
}

const regions = parse(
  "regions.json",
  schema.regionsFileSchema,
  loadJson("regions.json"),
);
const phases = parse(
  "phases.json",
  schema.phasesFileSchema,
  loadJson("phases.json"),
);
const departments = parse(
  "departments.json",
  schema.departmentsFileSchema,
  loadJson("departments.json"),
);
const abilities = parse(
  "abilities.json",
  schema.abilitiesFileSchema,
  loadJson("abilities.json"),
);
const eventDeck = parse(
  "eventDeck.json",
  schema.eventDeckFileSchema,
  loadJson("eventDeck.json"),
);

// ---- helpers ---------------------------------------------------------------

/** Report ids that are missing, duplicated, or unexpected vs an exact set. */
function checkExactSet(
  label: string,
  expected: readonly string[],
  actual: string[],
): void {
  const seen = new Map<string, number>();
  for (const id of actual) seen.set(id, (seen.get(id) ?? 0) + 1);
  for (const [id, n] of seen) {
    if (n > 1) err(`${label}: '${id}' appears ${n} times (must be exactly once).`);
    if (!expected.includes(id)) err(`${label}: unexpected id '${id}'.`);
  }
  for (const id of expected) {
    if (!seen.has(id)) err(`${label}: missing required id '${id}'.`);
  }
}

/** Warn for any basis-point value outside the sane band. */
function bpBand(label: string, value: number): void {
  if (value < BP_LOW || value > BP_HIGH) {
    warn(
      `${label}: ${value}bp is outside the sane band ${BP_LOW}–${BP_HIGH} (10000 = x1.0).`,
    );
  }
}

// ---- cross-reference checks ------------------------------------------------

// Regions: all 4 present exactly once; modifier covers all 4 phases (schema
// guarantees the keys, so this is a defense-in-depth + bp band check).
if (regions) {
  checkExactSet(
    "regions",
    REGIONS,
    regions.regions.map((r) => r.id),
  );
  for (const r of regions.regions) {
    for (const p of PHASES) bpBand(`region '${r.id}'.modifier.${p}`, r.modifier[p]);
  }
}

// Phases: all 4 phase types present exactly once; baseEffect covers all 4
// regions; bp band on each effect.
if (phases) {
  checkExactSet(
    "phases",
    PHASES,
    phases.phases.map((p) => p.type),
  );
  for (const p of phases.phases) {
    for (const reg of REGIONS) {
      bpBand(`phase '${p.type}'.baseEffect.${reg}`, p.baseEffect[reg]);
    }
  }
}

// Departments: all 5 present exactly once.
if (departments) {
  checkExactSet(
    "departments",
    DEPARTMENTS,
    departments.departments.map((d) => d.id),
  );
}

// Abilities: ids unique; every ability.department is a real department.
if (abilities) {
  const seen = new Set<string>();
  for (const a of abilities.abilities) {
    if (seen.has(a.id)) err(`abilities: duplicate ability id '${a.id}'.`);
    seen.add(a.id);
    if (!DEPARTMENTS.includes(a.department as (typeof DEPARTMENTS)[number])) {
      err(`ability '${a.id}': department '${a.department}' is not a real department.`);
    }
  }
}

// Department <-> ability bijection:
//  - every department.abilityId exists in abilities.json
//  - that ability's .department points back to the same department
//  - no two departments claim the same ability
//  - every ability is claimed by exactly one department (no orphans)
if (departments && abilities) {
  const abilityById = new Map(abilities.abilities.map((a) => [a.id, a]));
  const claimedBy = new Map<string, string>(); // abilityId -> departmentId

  for (const d of departments.departments) {
    const a = abilityById.get(d.abilityId);
    if (!a) {
      err(
        `department '${d.id}': abilityId '${d.abilityId}' does not exist in abilities.json.`,
      );
      continue;
    }
    if (a.department !== d.id) {
      err(
        `bijection broken: department '${d.id}' -> ability '${a.id}', but that ability's department is '${a.department}'.`,
      );
    }
    const prev = claimedBy.get(d.abilityId);
    if (prev) {
      err(
        `ability '${d.abilityId}' is claimed by both '${prev}' and '${d.id}' (must be 1:1).`,
      );
    }
    claimedBy.set(d.abilityId, d.id);
  }

  for (const a of abilities.abilities) {
    if (!claimedBy.has(a.id)) {
      err(`ability '${a.id}' is orphaned: no department references it.`);
    }
  }
}

// Event deck: positive integer weights (schema enforces int+positive, so this
// double-checks intent), total weight > 0, multiplierBp band, valid targets.
if (eventDeck) {
  const validTargets = new Set<string>([...REGIONS, "all", "none"]);
  let totalWeight = 0;
  const ids = new Set<string>();
  for (const e of eventDeck.events) {
    if (ids.has(e.id)) err(`eventDeck: duplicate event id '${e.id}'.`);
    ids.add(e.id);
    if (!Number.isInteger(e.weight) || e.weight <= 0) {
      err(`event '${e.id}': weight must be a positive integer (got ${e.weight}).`);
    } else {
      totalWeight += e.weight;
    }
    if (!validTargets.has(e.target)) {
      err(`event '${e.id}': invalid target '${e.target}'.`);
    }
    bpBand(`event '${e.id}'.multiplierBp`, e.multiplierBp);
  }
  if (eventDeck.events.length === 0) {
    err("eventDeck: deck is empty (need at least one event).");
  } else if (totalWeight <= 0) {
    err(`eventDeck: total weight must be > 0 (got ${totalWeight}).`);
  }
}

// ---- summary ---------------------------------------------------------------

function counts(): string {
  const parts = [
    `${regions?.regions.length ?? 0} regions`,
    `${phases?.phases.length ?? 0} phases`,
    `${departments?.departments.length ?? 0} departments`,
    `${abilities?.abilities.length ?? 0} abilities`,
    `${eventDeck?.events.length ?? 0} events`,
  ];
  return parts.join(", ");
}

console.log(`${DIM}Validating content in ${CONTENT_DIR}${RESET}`);

if (warnings.length) {
  console.log(`\n${YELLOW}${warnings.length} warning(s):${RESET}`);
  for (const w of warnings) console.log(`  ${YELLOW}!${RESET} ${w}`);
}

if (errors.length) {
  console.log(`\n${RED}${errors.length} error(s):${RESET}`);
  for (const e of errors) console.log(`  ${RED}x${RESET} ${e}`);
  console.log(
    `\n${RED}FAIL${RESET} — content is invalid. Checked: ${counts()}.`,
  );
  process.exit(1);
}

console.log(
  `\n${GREEN}OK${RESET} — all content valid. Checked: ${counts()}.` +
    (warnings.length ? ` (${warnings.length} warning(s))` : ""),
);
process.exit(0);
