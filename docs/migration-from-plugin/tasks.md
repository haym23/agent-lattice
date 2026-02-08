# Tasks: VSCode Plugin -> Standalone React App Migration (Phase 1)

**Input docs**:
- `feature-docs/migration-from-plugin/agent-lattice-tech-stack.docx`
- `feature-docs/migration-from-plugin/flowforge-vision.docx`
- `feature-docs/migration-from-plugin/flowforge-anyone.html` (product context only)

**Goal**: Deliver a standalone React app that preserves cc-wf-studio core value, removes VSCode host coupling, and validates a multi-target compiler foundation.

**Execution owner**: Sisyphus

## Format

- `- [ ] M### [P?] [Track] Task description`
- `[P]` means parallelizable if dependencies are met.

---

## Phase 0 - Baseline and Guardrails

- [X] M001 [Core] Capture baseline behavior in current extension (save/load/export, canvas interactions, AI refine flow smoke checks)
- [X] M002 [Core] Document non-negotiable compatibility targets (.claude output parity, workflow JSON compatibility)
- [X] M003 [Core] Define migration branch strategy, milestone tags, and rollback checkpoints

**Checkpoint**: Team can compare standalone behavior against extension baseline.

---

## Phase 1 - Standalone App Shell and Extraction

### Track A - Shell Setup (Vite + React + TS)

- [X] M010 [A] Create standalone app scaffold with Vite + React + TypeScript
- [X] M011 [P] [A] Add React Router routes: `/editor`, `/templates`, `/settings`
- [X] M012 [P] [A] Configure Biome, Vitest, React Testing Library, and CI scripts
- [X] M013 [A] Establish directory boundaries: `app/`, `core/`, `compiler/`, `adapters/`, `features/`

### Track B - Webview Extraction and VSCode Decoupling

- [X] M020 [B] Copy/move webview canvas component tree into standalone app without behavior changes
- [X] M021 [B] Copy/move Zustand stores and shared workflow types
- [X] M022 [B] Remove `postMessage` bridge usage and replace with direct service calls
- [X] M023 [B] Remove VSCode Extension API imports from runtime path
- [X] M024 [B] Isolate reusable logic from `src/extension/` into platform-agnostic modules
- [X] M025 [B] Delete/retire extension-only contribution and packaging artifacts for standalone build path

### Track C - Persistence Migration (FS -> IndexedDB)

- [X] M030 [C] Define `WorkflowRepository` interface (`load/save/list/delete`)
- [X] M031 [C] Implement IndexedDB repository via `idb`
- [X] M032 [P] [C] Add in-memory repository for tests
- [X] M033 [C] Port serialization/deserialization logic and schema validation
- [X] M034 [C] Add migration adapter for legacy workflow JSON variants

### Track D - Compiler Foundation (Multi-target)

- [X] M040 [D] Extract compiler into explicit pipeline (analyze -> normalize -> emit -> validate)
- [X] M041 [D] Keep existing `.claude` emitter behavior as parity target
- [X] M042 [D] Define target emitter interface and registry
- [X] M043 [D] Implement OpenAI Assistants JSON emitter (Phase 1 required)
- [X] M044 [D] Implement portable universal workflow JSON emitter (Phase 1 required)
- [X] M045 [D] Add snapshot tests comparing emitters across representative workflows

### Track E - Model Registry (Phase 1 minimal)

- [X] M050 [E] Define model capability schema (`tool_use`, `structured_output`, `vision`, `context_window`, format hints)
- [X] M051 [E] Add model registry loader and validation
- [X] M052 [E] Seed registry with Claude + GPT-4o
- [X] M053 [E] Wire model selector in toolbar to compiler inputs

### Track F - Node Library Expansion to 15-20

- [X] M060 [F] Define node contract (schema, ports, config UI contract, compiler handler contract)
- [X] M061 [F] Implement Core AI set: LLM Call, Prompt Template, System Instruction, Few-Shot Bank
- [X] M062 [F] Implement Logic set: Conditional Branch, Switch/Case, Loop, Error Handler
- [X] M063 [F] Implement Data set: Input Form, File Reader, API Call, JSON/CSV Parse
- [X] M064 [F] Implement Output set: Text Response, File Writer, Webhook Push
- [X] M065 [F] Implement Agent set: Sub-Agent Spawn, Human-in-the-Loop Gate
- [X] M066 [F] Ensure all new nodes are serializable and compilable in all Phase 1 emitters

### Track G - UI System Migration (Tailwind + Radix)

- [X] M070 [G] Introduce design tokens as CSS variables (color, spacing, radius, typography)
- [X] M071 [G] Add Tailwind CSS 4 configuration and token mapping
- [X] M072 [G] Migrate high-traffic editor UI from inline styles to tokenized classes
- [X] M073 [G] Standardize dialogs/menus/tabs on Radix primitives
- [X] M074 [G] Verify minimap/zoom/search UX parity with current canvas behavior

### Track H - i18n and Testing Hardening

- [X] M080 [H] Replace VSCode language dependency with `i18next`
- [X] M081 [H] Port existing locale resources and fallback strategy
- [X] M082 [H] Add unit tests for repositories, schema validation, and compiler pipeline
- [X] M083 [H] Add integration tests for save/load/compile happy paths
- [X] M084 [H] Add regression tests for `.claude` parity and multi-target output validity

---

## Dependency Order

1. M001-M003 (baseline)
2. M010-M013 (shell)
3. M020-M025 (decouple)
4. M030-M034 (persistence)
5. M040-M045 + M050-M053 (compiler + model registry)
6. M060-M066 (node expansion)
7. M070-M074 (UI system)
8. M080-M084 (i18n + hardening)

Parallel windows:
- M011, M012 can run after M010.
- M032 can run after M030.
- M050-M052 can run in parallel with M040-M042.
- M061-M065 can run in parallel once M060 is stable.

---

## Phase 1 Exit Criteria (Must Pass)

- [X] X001 No runtime coupling to VSCode extension APIs in standalone app
- [X] X002 Standalone app can create/save/load/delete workflows via IndexedDB
- [X] X003 Compiler emits valid `.claude`, OpenAI Assistants JSON, and portable JSON
- [X] X004 Model registry works with at least Claude and GPT-4o
- [X] X005 Node library reaches at least 15 production-usable node types
- [X] X006 CI quality gates pass (`format`, `lint`, `check`, `build`, `test`)

---

## Suggested Verification Commands per Milestone

```bash
npm run format
npm run lint
npm run check
npm run build
npm run test
```

Use milestone-specific smoke checks as each track lands (save/load, compile by target, model switch).

---

## Out of Scope for Phase 1

- Next.js backend migration
- Auth, PostgreSQL, queue runtime, live execution logs
- Real-time collaboration
- Plugin SDK and marketplace
- Desktop app and CLI packaging
