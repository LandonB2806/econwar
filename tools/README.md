# tools/ — EconWar content & data pipeline

Standalone developer tooling. Nothing here ships in the engine, client, or
server. Scripts only **read** content; they never mutate it. Run with `tsx`
(already a root devDependency — no install needed).

---

## `validate-content.ts` — content-integrity gate

Validates the data-driven content JSON in
`packages/shared/src/content/` against the Zod schemas exported by
`@econwar/shared`, then runs cross-reference checks the schemas cannot express.
Backs CLAUDE.md golden rule #6 ("Data-driven content") and #7 ("Tests are the
contract").

### Run it

```bash
npx tsx tools/validate-content.ts
```

- **Exit 0** — all content valid (warnings are allowed and printed).
- **Non-zero exit** — at least one error; details printed in red.

### What it checks

**Schema (per file, via `@econwar/shared` Zod schemas)**
- `regions.json`, `phases.json`, `departments.json`, `abilities.json`,
  `eventDeck.json` each parsed against `regionsFileSchema`, `phasesFileSchema`,
  `departmentsFileSchema`, `abilitiesFileSchema`, `eventDeckFileSchema`.
  Every Zod issue is reported with its JSON path.

**Cross-reference integrity (beyond schema)**
- **Region completeness** — all 4 regions (`central`, `north`, `south`,
  `northeast`) present exactly once; no duplicates / unexpected ids.
- **Phase completeness** — all 4 phase types (`boom`, `recession`, `recovery`,
  `slowdown`) present exactly once.
- **Department completeness** — all 5 departments present exactly once.
- **`baseEffect` / `modifier` coverage** — every phase's `baseEffect` covers all
  4 regions; every region's `modifier` covers all 4 phases (schema guarantees
  the keys; this is defense-in-depth + the basis-point band check below).
- **Department ⇆ ability bijection** —
  - every `department.abilityId` exists in `abilities.json`;
  - that ability's `.department` points back to the same department;
  - no two departments claim the same ability;
  - no ability is orphaned (every ability is referenced by a department).
- **Ability → department validity** — every `ability.department` is a real
  department id; ability ids are unique.
- **Event deck** —
  - every `weight` is a positive integer;
  - total weight > 0 and the deck is non-empty;
  - every `target` is a valid region, `"all"`, or `"none"`;
  - event ids are unique.

**Basis-point sanity (warnings, non-fatal)**
- `phase.baseEffect`, `region.modifier`, and `event.multiplierBp` values outside
  the band **5000–20000 bp** (`10000 = ×1.0`) are flagged as warnings so wild
  tuning values surface without breaking the build.

### Output

- Warnings (yellow) print but do **not** fail the build.
- Errors (red) print and the process exits non-zero.
- Success prints a green `OK` summary with content counts
  (e.g. `4 regions, 4 phases, 5 departments, 5 abilities, 11 events`).

### Negative test (how to confirm it bites)

Temporarily break a reference — e.g. in `departments.json` set
`government`'s `"abilityId"` to `"gov_tax_typo"` — and re-run. The validator
reports:

```
department 'government': abilityId 'gov_tax_typo' does not exist in abilities.json.
ability 'gov_tax' is orphaned: no department references it.
```

and exits non-zero. Revert the edit and it returns to green. (Do not leave
broken content committed.)

---

## Suggested wiring (not applied — owner to add)

This tool deliberately does **not** edit root configs. To make it a CI / local
gate, the repo owner can add a script to the **root `package.json`** and chain
it before tests:

```jsonc
{
  "scripts": {
    "validate:content": "tsx tools/validate-content.ts",
    "pretest": "tsx tools/validate-content.ts"   // runs automatically before `npm test`
  }
}
```

In CI, run it as an explicit step before the Vitest/pytest jobs:

```yaml
- run: npx tsx tools/validate-content.ts   # fail fast on bad content
- run: npm test
```

Because the validator is a pure read with a clean exit code, it slots into any
pre-commit hook or CI stage without further setup.
