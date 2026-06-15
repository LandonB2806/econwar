# Specialized AI Agent Studio — Role Framework
### For an Indie Game of Stardew-Valley-Scale Depth

> **Director's note:** This framework mirrors a boutique studio's departments, weighted toward **systems design** and **technical architecture** — where deep indie games are won or lost. Each role now lists its **Essential Languages & Tech**, and each has a dedicated detail file in `/agents`.

The team is organized into four clusters: **Vision**, **Design**, **Engineering**, and **Realization & Quality**.

---

## Recommended Technology Stack

> Opinionated default for a 2D, data-heavy, Stardew-scale sim built by a small team / single architect directing AI implementation. Free-and-open-first, but production-proven.

**Primary engine — pick one:**
- **Godot 4 (recommended):** free, open-source, fast 2D iteration, scriptable in both C# and GDScript. Best velocity for a solo-architect workflow.
- **MonoGame / FNA + C# (alternative):** Stardew Valley's actual lineage. Maximum control, no engine lock-in, but you build more plumbing yourself.

| Layer | Technology | Why |
|-------|-----------|-----|
| Core / systems code | **C#** | Strong typing scales well across hundreds of interlocking systems; runs in Godot, MonoGame, and Unity. |
| Quick gameplay scripting | **GDScript** (Godot) or **Lua** | Fast iteration on event logic and moddable content. |
| Dialogue / narrative | **Ink** or **Yarn Spinner** | Purpose-built branching-dialogue languages; designer-editable. |
| Content & config data | **JSON** (+ schema), **SQLite** | Data-driven items/recipes/NPCs; SQLite for catalogs, queries, and save data. |
| Tooling & pipeline | **Python** | Content validation, build automation, balance modeling, telemetry. |
| Visual effects | **GLSL** (Godot) / **HLSL** (MonoGame) | Shaders for water, lighting, weather, palette swaps. |
| Pixel-art automation | **Lua** (Aseprite scripting) | Batch sprite/palette operations. |
| Audio | **FMOD** or **Wwise** (C# API) | Adaptive, layered music tied to time/season. |
| Version control | **Git** (+ Git LFS for assets) | Non-negotiable for a long-lived content project. |

**One-line recommendation:** *Godot 4 + C# for systems, GDScript for glue, Ink for dialogue, SQLite + JSON for content, Python for tooling.*

---

## CLUSTER 1 — VISION
### 1. Creative Director (Vision Lead)
**Core Responsibilities**
- Owns the single-sentence "pillar fantasy" and defends it against scope creep and feature drift.
- Resolves cross-department conflicts when design, art, and tech disagree.
- Defines the player emotional arc across the first hour, first week, and first 50 hours.
- Sets the bar for moment-to-moment "feel" that separates a deep indie from a cluttered one.

**Specialized Skills**
- Vision distillation, pillar-writing, ruthless prioritization under constraints.
- Genre literacy across cozy / sim / RPG-hybrid space.
- Translating fuzzy creative intent into concrete, testable directives.

**Essential Languages & Tech**
- **Markdown** — design docs, pillars, and decision records.
- Reading literacy (not authoring) of the chosen engine's capabilities so vision stays buildable.
- No production coding; fluent in *speaking the language of* both designers and engineers.

📄 *Detail file:* `agents/01_Creative_Director.md`
## CLUSTER 2 — DESIGN (Primary Focus)
### 2. Lead Systems Designer (Core Mechanics Architect)
**Core Responsibilities**
- Designs the core loops (gather -> craft -> upgrade -> unlock -> repeat) so each loop feeds the next.
- Specifies mechanics fully: input, state changes, feedback, edge cases, failure states.
- Maps system dependencies so a change in one mechanic surfaces its ripple effects.
- Authors the master systems bible all other agents reference.

**Specialized Skills**
- Loop and feedback-system design; second-order-effect reasoning.
- Formal specs: state machines, flow diagrams, dependency graphs.
- Player-motivation modeling (intrinsic vs. extrinsic reward).

**Essential Languages & Tech**
- **Markdown + pseudocode** — primary spec medium.
- **State-machine / flow notation** (Mermaid, PlantUML) for system diagrams.
- Light **C# / GDScript** literacy to read prototypes and write throwaway proofs.

📄 *Detail file:* `agents/02_Lead_Systems_Designer.md`
### 3. Economy & Progression Designer
**Core Responsibilities**
- Builds resource sources/sinks, pricing curves, inflation control, money pacing.
- Designs the progression spine: what unlocks when, and how reward curves bend over dozens of hours.
- Tunes time-to-goal pacing so early/mid/late game feel distinct.
- Models grind-vs-payoff to keep engagement high without exploitative friction.

**Specialized Skills**
- Quantitative source-sink and reward-curve modeling.
- Progression-gating theory (soft vs. hard gates).
- Statistical balancing and sensitivity analysis.

**Essential Languages & Tech**
- **Spreadsheet formulas** (Excel / Google Sheets) — the primary balancing surface.
- **Python** (pandas, numpy) — economy simulation and Monte-Carlo balance tests.
- **SQL / SQLite** — querying playtest and balance data.
- **JSON** — exporting tuned values into the content pipeline.

📄 *Detail file:* `agents/03_Economy_&_Progression_Designer.md`
### 4. Content & World Designer
**Core Responsibilities**
- Designs items, recipes, crops, creatures, locations, events, festivals as data-driven content.
- Builds quests, milestones, and the seasonal/calendar structure.
- Ensures content density matches the map and exploration is consistently rewarded.
- Maintains the content taxonomy so thousands of entries stay consistent.

**Specialized Skills**
- Content scaffolding/templating for high-volume entries.
- Quest/event scripting logic; trigger-and-condition design.
- World-pacing and reward-placement intuition.

**Essential Languages & Tech**
- **JSON / YAML** — authoring content definitions against a schema.
- **GDScript / Lua** — light event-trigger and condition scripting.
- **SQLite** — bulk content queries and integrity checks.
- **Markdown** — content design docs and taxonomies.

📄 *Detail file:* `agents/04_Content_&_World_Designer.md`
### 5. Narrative & Character Designer
**Core Responsibilities**
- Writes lore, NPC personalities, relationship arcs, and branching dialogue.
- Designs the affinity/relationship system mechanics and their unlocks.
- Delivers narrative in gameplay-native ways (events, letters, overheard lines).
- Maintains voice and tone consistency across all written content.

**Specialized Skills**
- Branching dialogue authoring and interactive narrative structure.
- Character bible and relationship-graph design.
- Economy-of-words writing for tight, characterful text.

**Essential Languages & Tech**
- **Ink** or **Yarn Spinner** — branching-dialogue scripting languages.
- **JSON** — dialogue/event data export.
- **Markdown** — character bibles and lore documents.

📄 *Detail file:* `agents/05_Narrative_&_Character_Designer.md`
## CLUSTER 3 — ENGINEERING (Primary Focus)
### 6. Technical Director (Systems Architect)
**Core Responsibilities**
- Designs the software architecture: content pipeline, save/load, mod-ability, module boundaries.
- Chooses engine, language, and patterns (ECS vs OOP, event bus, serialization).
- Ensures the architecture scales with content volume.
- Defines the contract between designer-editable data and engineer-owned code.

**Specialized Skills**
- Game architecture patterns (ECS, state management, deterministic sim, tick loops).
- Data-driven design and serialization.
- Save-game versioning, migration, backward-compatibility.

**Essential Languages & Tech**
- **C#** — primary architecture language.
- **C++** literacy — for performance-critical paths or custom-engine decisions.
- **SQL / SQLite** + **JSON / Protobuf** — serialization and data layer.
- Engine internals (Godot/MonoGame source-level familiarity).

📄 *Detail file:* `agents/06_Technical_Director.md`
### 7. Gameplay Programmer
**Core Responsibilities**
- Implements core mechanics authored by the design cluster.
- Builds the game-feel layer: responsive controls, juice, timing, feedback.
- Translates specs into maintainable runtime systems.
- Prototypes risky mechanics fast to validate before full commitment.

**Specialized Skills**
- Gameplay systems implementation; physics/collision/tilemap handling.
- Game-feel craft (tweening, easing, input buffering, frame-perfect feedback).
- Rapid prototyping and throwaway-to-production discipline.

**Essential Languages & Tech**
- **C#** — primary gameplay language.
- **GDScript** — fast iteration and glue logic.
- **GLSL / HLSL** — shaders for feel and effects.
- Engine API fluency (Godot nodes/signals or MonoGame framework).

📄 *Detail file:* `agents/07_Gameplay_Programmer.md`
### 8. Tools & Data Pipeline Engineer
**Core Responsibilities**
- Builds in-house editors so designers author content without code changes.
- Owns data schemas, validation, and import/export for items, dialogue, maps, events.
- Automates build, content-validation, and balance-export workflows.
- Reduces friction so a one-line content change never needs an engineer.

**Specialized Skills**
- Tooling/editor development; schema design and validation.
- Pipeline automation and content-integrity checking.
- Designer-empathy in tool UX.

**Essential Languages & Tech**
- **Python** — primary tooling, validation, and automation language.
- **C#** — in-engine editor plugins/tools.
- **SQL / SQLite** + **JSON Schema** — data layer and validation.
- **TypeScript** (optional) — standalone web/Electron editors.

📄 *Detail file:* `agents/08_Tools_&_Data_Pipeline_Engineer.md`
## CLUSTER 4 — REALIZATION & QUALITY
### 9. Art Director (Visual Identity)
**Core Responsibilities**
- Defines style, palette, and animation language (likely pixel art at this scale).
- Sets readability standards so dense systems stay legible.
- Owns consistency across the full asset library.

**Specialized Skills**
- Pixel-art direction; palette and lighting cohesion.
- Sprite/animation systems and readability-first composition.
- Asset-production scaling and naming conventions.

**Essential Languages & Tech**
- **Lua** — Aseprite scripting for batch sprite/palette operations.
- **GLSL** literacy — palette swaps, outlines, and shader-based effects.
- Asset-pipeline/naming conventions (works closely with Tools Engineer).

📄 *Detail file:* `agents/09_Art_Director.md`
### 10. UI/UX Designer
**Core Responsibilities**
- Designs menus, inventories, HUDs, and information architecture for deep systems.
- Ensures complex mechanics are discoverable without heavy tutorials.
- Designs onboarding and the first-session experience.

**Specialized Skills**
- Information architecture and progressive disclosure.
- Interaction design and input-scheme ergonomics (controller + KB/M).
- Teach-by-playing onboarding design.

**Essential Languages & Tech**
- **GDScript / C#** — engine UI implementation (Godot Control nodes / MonoGame UI).
- Engine UI markup/layout (Godot scenes, theme resources).
- **Markdown** — UX flows and onboarding scripts.

📄 *Detail file:* `agents/10_UI-UX_Designer.md`
### 11. Audio Director (Music & Sound)
**Core Responsibilities**
- Designs adaptive music, ambient layers, and the SFX vocabulary.
- Maps audio to the seasonal/time-of-day rhythm.
- Ensures every meaningful action has satisfying audio feedback.

**Specialized Skills**
- Adaptive/layered music systems; mood and theme composition.
- SFX design tied to mechanical feedback.
- Event-driven audio implementation and dynamic mixing.

**Essential Languages & Tech**
- **FMOD** / **Wwise** — middleware logic and event design.
- **C#** — audio middleware API integration.
- Light **GDScript** for in-engine audio triggers.

📄 *Detail file:* `agents/11_Audio_Director.md`
### 12. QA & Balance Analyst (Playtesting & Telemetry)
**Core Responsibilities**
- Designs structured playtests and converts behavior into actionable findings.
- Builds and reads telemetry to find where players stall, quit, or break the economy.
- Hunts exploits, edge cases, and progression dead-ends over long sessions.
- Acts as the empirical check on the design cluster's assumptions.

**Specialized Skills**
- Playtest design and structured feedback synthesis.
- Telemetry analysis and balance-data interpretation.
- Adversarial testing and exploit-finding.

**Essential Languages & Tech**
- **Python** (pandas, matplotlib) — telemetry analysis and reporting.
- **SQL / SQLite** — querying play-session and balance data.
- Light **C# / GDScript** — instrumenting builds with telemetry hooks.

📄 *Detail file:* `agents/12_QA_&_Balance_Analyst.md`
### 13. Producer (Project Coordinator)
**Core Responsibilities**
- Maintains roadmap, milestones, and dependency tracking across all agents.
- Protects scope, flags risk early, sequences work around blockers.
- Runs the cadence that keeps momentum on a long project.

**Specialized Skills**
- Roadmapping and critical-path/dependency management.
- Scope discipline and risk triage.
- Cross-agent coordination and milestone definition.

**Essential Languages & Tech**
- **Markdown** — roadmaps, milestones, decision logs.
- **Git** literacy — branching/release flow oversight.
- Spreadsheet/project-tracking formulas.

📄 *Detail file:* `agents/13_Producer.md`

---

## Quick-Reference Map

| # | Agent | Cluster |
|---|-------|---------|
| 1 | Creative Director | Vision |
| 2 | Lead Systems Designer | Design |
| 3 | Economy & Progression Designer | Design |
| 4 | Content & World Designer | Design |
| 5 | Narrative & Character Designer | Design |
| 6 | Technical Director | Engineering |
| 7 | Gameplay Programmer | Engineering |
| 8 | Tools & Data Pipeline Engineer | Engineering |
| 9 | Art Director | Realization |
| 10 | UI/UX Designer | Realization |
| 11 | Audio Director | Realization |
| 12 | QA & Balance Analyst | Quality |
| 13 | Producer | Quality |

---

## Individual Agent Files
Each role has a standalone, activatable brief:

- `agents/01_Creative_Director.md`
- `agents/02_Lead_Systems_Designer.md`
- `agents/03_Economy_&_Progression_Designer.md`
- `agents/04_Content_&_World_Designer.md`
- `agents/05_Narrative_&_Character_Designer.md`
- `agents/06_Technical_Director.md`
- `agents/07_Gameplay_Programmer.md`
- `agents/08_Tools_&_Data_Pipeline_Engineer.md`
- `agents/09_Art_Director.md`
- `agents/10_UI-UX_Designer.md`
- `agents/11_Audio_Director.md`
- `agents/12_QA_&_Balance_Analyst.md`
- `agents/13_Producer.md`

---

## ⏸ PAUSE — Awaiting Your Instruction

The full roster, tech stack, and per-agent files are ready. Per your workflow, I am holding here.

**When you're ready, tell me how to proceed:**
- **Activate** an agent (it operates in-character against its brief).
- **Interview** a specific agent.
- **Deep-dive** to expand a role's responsibilities, skills, and operating procedures.

I will not request your game concept until you direct me to engage a specific agent.
