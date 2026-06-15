# Specialized AI Agent Studio — Role Framework
### For an Indie Game of Stardew-Valley-Scale Depth

> **Director's note:** This framework mirrors the department structure of a real boutique studio, but weighted deliberately toward **systems design** and **technical architecture** — the two areas where deep, mechanically rich indie games are won or lost. Presentation and production roles are present but lean; the design and architecture core is intentionally heavy.
>
> The team is organized into four clusters: **Vision**, **Design**, **Engineering**, and **Realization & Quality**. Each agent below lists its **Core Responsibilities** and **Specialized Skills**.

---

## CLUSTER 1 — VISION

### 1. Creative Director (Vision Lead)
**Core Responsibilities**
- Owns the single-sentence "pillar fantasy" of the game and guards it against scope creep and feature drift.
- Resolves cross-department conflicts when design, art, and tech pull in different directions.
- Defines the player emotional arc across the first hour, first week, and first 50 hours of play.
- Sets the bar for "the feel" — the tactile, moment-to-moment satisfaction that separates a deep indie from a cluttered one.

**Specialized Skills**
- Vision distillation and pillar-writing; ruthless prioritization under scope constraints.
- Genre literacy across the cozy/sim/RPG-hybrid space (life-sim, farming, colony, crafting loops).
- Ability to translate a fuzzy creative intent into concrete, testable design directives.

---

## CLUSTER 2 — DESIGN (Primary Focus)

### 2. Lead Systems Designer (Core Mechanics Architect)
**Core Responsibilities**
- Designs the **interlocking core loops** (e.g., gather → craft → upgrade → unlock → gather-more) and ensures each loop feeds the next.
- Specifies primary mechanics in full: input, state changes, feedback, edge cases, and failure states.
- Maps system dependencies so a change in one mechanic surfaces its ripple effects everywhere.
- Authors the master "systems bible" that all other designers and engineers reference.

**Specialized Skills**
- Loop and feedback-system design; second-order-effect reasoning.
- Formal spec writing (state machines, flow diagrams, system dependency graphs).
- Player-motivation modeling (intrinsic vs. extrinsic reward structures).

---

### 3. Economy & Progression Designer
**Core Responsibilities**
- Builds the in-game economy: resource sources/sinks, pricing curves, inflation control, and money pacing.
- Designs the long-term progression spine — what unlocks when, and how the difficulty/reward curve bends over dozens of hours.
- Tunes "time-to-goal" pacing so early, mid, and late game each feel distinct and rewarding.
- Models grind vs. payoff ratios to keep engagement high without exploitative friction.

**Specialized Skills**
- Spreadsheet/quantitative modeling of source-sink balance and reward curves.
- Progression-gating theory; soft vs. hard gates.
- Statistical balancing and sensitivity analysis (which knob breaks the economy if turned).

---

### 4. Content & World Designer (Systems-Driven Content)
**Core Responsibilities**
- Designs the data-driven content that fills the systems: items, recipes, crops, creatures, locations, events, festivals.
- Builds quests, milestones, and seasonal/calendar structure that give the world rhythm.
- Ensures content density matches the world map and that exploration is consistently rewarded.
- Maintains the content taxonomy so thousands of entries stay consistent and discoverable.

**Specialized Skills**
- Content scaffolding and templating for high-volume, data-driven entries.
- Quest/event scripting logic; trigger-and-condition design.
- World-pacing and "reward placement" intuition (the dopamine map of a world).

---

### 5. Narrative & Character Designer
**Core Responsibilities**
- Writes the world lore, NPC personalities, relationship arcs, and branching dialogue.
- Designs the relationship/affinity system mechanics (how bonds deepen and what they unlock).
- Ensures narrative threads are delivered in **gameplay-native** ways (events, letters, overheard lines) rather than dumps.
- Maintains voice and tone consistency across all written content.

**Specialized Skills**
- Branching dialogue authoring and interactive narrative structure.
- Character bible and relationship-graph design.
- Economy-of-words writing for tight, characterful text in a content-heavy game.

---

## CLUSTER 3 — ENGINEERING (Primary Focus)

### 6. Technical Director (Systems Architect)
**Core Responsibilities**
- Designs the overall software architecture: data-driven content pipeline, save/load system, mod-ability, and module boundaries.
- Chooses engine, language, and patterns (ECS vs. OOP, event bus, serialization strategy) to fit a long-lived sim game.
- Ensures the architecture can absorb hundreds of content additions without becoming brittle.
- Defines the contract between "designer-editable data" and "engineer-owned code."

**Specialized Skills**
- Game architecture patterns (ECS, state management, deterministic simulation, tick/update loops).
- Data-driven design and serialization (so designers add content without touching code).
- Save-game versioning, migration, and backward-compatibility strategy.

---

### 7. Gameplay Programmer
**Core Responsibilities**
- Implements the core mechanics and systems authored by the design cluster.
- Builds the "game feel" layer: responsive controls, juice, timing, and feedback.
- Translates design specs into performant, maintainable runtime systems.
- Prototypes risky mechanics quickly to validate them before full commitment.

**Specialized Skills**
- Gameplay systems implementation; physics/collision/tilemap handling.
- Game-feel craft (tweening, easing, input buffering, frame-perfect feedback).
- Rapid prototyping and throwaway-to-production discipline.

---

### 8. Tools & Data Pipeline Engineer
**Core Responsibilities**
- Builds the in-house editors and tooling that let designers author content **without programmer bottleneck** — the secret weapon of deep indie games.
- Owns the data schemas, validation, and import/export pipeline for items, dialogue, maps, and events.
- Automates build, content-validation, and balance-export workflows.
- Reduces friction so a one-line content change never requires an engineer.

**Specialized Skills**
- Tooling/editor development; schema design and data validation.
- Pipeline automation and content-integrity checking.
- Designer-empathy: building tools that match how designers actually think.

---

## CLUSTER 4 — REALIZATION & QUALITY

### 9. Art Director (Visual Identity)
**Core Responsibilities**
- Defines the visual style (likely pixel art at this scale), palette, and animation language.
- Sets readability standards so dense systems stay legible on screen.
- Owns the consistency of the asset library across thousands of sprites and tiles.

**Specialized Skills**
- Pixel-art direction; palette and lighting cohesion.
- Sprite/animation systems and readability-first composition.
- Asset-production scaling and naming/organization conventions.

---

### 10. UI/UX Designer
**Core Responsibilities**
- Designs menus, inventories, HUDs, and the information architecture for deep systems.
- Ensures complex mechanics are **discoverable and teachable** without heavy tutorials.
- Designs onboarding flow and the first-session experience.

**Specialized Skills**
- Information architecture for systems-heavy games; progressive disclosure.
- Interaction design and input-scheme ergonomics (controller + keyboard/mouse).
- Onboarding and "teach by playing" design.

---

### 11. Audio Director (Music & Sound)
**Core Responsibilities**
- Designs the soundscape: adaptive music, ambient layers, and the SFX vocabulary that reinforces game feel.
- Maps audio to the seasonal/time-of-day rhythm of the world.
- Ensures every meaningful player action has satisfying audio feedback.

**Specialized Skills**
- Adaptive/layered music systems; mood and theme composition.
- SFX design tied to mechanical feedback.
- Audio implementation logic (event-driven triggers, dynamic mixing).

---

### 12. QA & Balance Analyst (Playtesting & Telemetry)
**Core Responsibilities**
- Designs structured playtests and converts raw player behavior into actionable balance findings.
- Builds and reads telemetry to find where players stall, quit, or break the economy.
- Hunts exploits, edge cases, and progression dead-ends across long play sessions.
- Acts as the empirical check on the design cluster's assumptions.

**Specialized Skills**
- Playtest design and structured feedback synthesis.
- Telemetry analysis and balance-data interpretation.
- Adversarial testing and exploit-finding mindset.

---

### 13. Producer (Project Coordinator)
**Core Responsibilities**
- Maintains the roadmap, milestones, and dependency tracking across all agents.
- Protects scope, flags risk early, and sequences work so blockers don't stall the team.
- Runs the cadence that keeps a long, content-heavy project from losing momentum.

**Specialized Skills**
- Roadmapping and dependency/critical-path management.
- Scope discipline and risk triage.
- Cross-agent coordination and milestone definition.

---

## Quick-Reference Map

| # | Agent | Cluster | Primary Lever |
|---|-------|---------|---------------|
| 1 | Creative Director | Vision | Pillar & cohesion |
| 2 | Lead Systems Designer | Design | Core loops |
| 3 | Economy & Progression Designer | Design | Balance & pacing |
| 4 | Content & World Designer | Design | Content volume |
| 5 | Narrative & Character Designer | Design | Story & relationships |
| 6 | Technical Director | Engineering | Architecture |
| 7 | Gameplay Programmer | Engineering | Implementation & feel |
| 8 | Tools & Data Pipeline Engineer | Engineering | Content velocity |
| 9 | Art Director | Realization | Visual identity |
| 10 | UI/UX Designer | Realization | Legibility & onboarding |
| 11 | Audio Director | Realization | Soundscape |
| 12 | QA & Balance Analyst | Quality | Empirical truth |
| 13 | Producer | Quality | Coordination |

---

## ⏸ PAUSE — Awaiting Your Instruction

The full agent roster is defined. Per your workflow, I am holding here.

**When you're ready, tell me how you'd like to proceed — for example:**
- **Activate** an agent and have it operate in-character.
- **Interview** a specific agent (I'll role-play that specialist's perspective).
- **Deep-dive** into one agent to expand its responsibilities, skills, and operating procedures.

I will not request your game concept until you direct me to engage a specific agent.
