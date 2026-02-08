# Speckit Tasks: Migration to Standalone React App (Phase 1)

Source context:
- `feature-docs/migration-from-plugin/tasks.md`
- `feature-docs/migration-from-plugin/agent-lattice-tech-stack.docx`
- `feature-docs/migration-from-plugin/flowforge-vision.docx`

## Execution Contract

- Scope: Phase 1 only (foundation/extraction/multi-target compiler baseline)
- Owner: Sisyphus
- Task state: `todo | doing | done | blocked`
- Estimation unit: ideal engineer-days (`d`)
- Done rule: task is not complete unless acceptance criteria and verification commands pass

## Global Acceptance Criteria

- No runtime dependency on VSCode APIs in standalone app path
- Canvas + workflow state parity with extension baseline for core editing flows
- Persistence migrated to IndexedDB with stable schema + migration path
- Compiler emits valid `.claude`, OpenAI Assistants JSON, and portable JSON
- Model registry supports at minimum Claude + GPT-4o
- CI gates pass: `format`, `lint`, `check`, `build`, `test`

## Milestone Plan

### M0 - Baseline and Safety Nets

#### ST-001 - Capture baseline behavior
- Status: `todo`
- Estimate: `0.5d`
- Depends on: none
- Deliverables:
  - Baseline checklist for save/load/export and canvas interactions
  - Known-good sample workflows for regression checks
- Acceptance criteria:
  - Baseline flows are documented with pass/fail rubric
  - At least 3 representative workflows selected
- Verify:
  - Manual smoke checklist completed and stored in docs

#### ST-002 - Define compatibility targets
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-001
- Deliverables:
  - Compatibility contract doc for JSON schema + `.claude` output parity
- Acceptance criteria:
  - Contract includes required invariants and allowed deviations
- Verify:
  - Reviewer sign-off in migration docs

#### ST-003 - Migration branch strategy
- Status: `todo`
- Estimate: `0.25d`
- Depends on: none
- Deliverables:
  - Branching, checkpoint tags, rollback procedure
- Acceptance criteria:
  - Rollback can be executed at each milestone boundary
- Verify:
  - Strategy committed to docs and referenced by all tracks

### M1 - Standalone App Shell

#### ST-010 - Scaffold standalone app
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-001
- Deliverables:
  - Vite + React + TypeScript app booting locally
- Acceptance criteria:
  - App starts without extension host
  - Build is green in CI
- Verify:
  - `npm run build`

#### ST-011 - Add app routing
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-010
- Deliverables:
  - Routes: `/editor`, `/templates`, `/settings`
- Acceptance criteria:
  - Direct navigation works and routes render expected shells
- Verify:
  - `npm run test`

#### ST-012 - Tooling hardening
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-010
- Deliverables:
  - Biome + Vitest + RTL + CI scripts configured
- Acceptance criteria:
  - All quality scripts execute successfully
- Verify:
  - `npm run format && npm run lint && npm run check && npm run test`

#### ST-013 - Module boundaries
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-010
- Deliverables:
  - Directory architecture: `app/`, `core/`, `compiler/`, `adapters/`, `features/`
- Acceptance criteria:
  - Imports respect boundaries; no circular dependencies in new modules
- Verify:
  - `npm run check`

### M2 - Extraction and Decoupling

#### ST-020 - Port canvas UI tree
- Status: `todo`
- Estimate: `1.0d`
- Depends on: ST-010
- Deliverables:
  - React Flow editor components running in standalone app
- Acceptance criteria:
  - User can add/move/connect core nodes on canvas
- Verify:
  - Manual editor smoke + `npm run test`

#### ST-021 - Port state + shared types
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-020
- Deliverables:
  - Zustand stores and workflow/shared types integrated
- Acceptance criteria:
  - Graph mutations update store correctly and deterministically
- Verify:
  - Unit tests for core store actions

#### ST-022 - Remove postMessage bridge
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-021
- Deliverables:
  - Direct service layer replaces bridge request/response flow
- Acceptance criteria:
  - No runtime usage of VSCode bridge in standalone path
- Verify:
  - Search check + integration tests

#### ST-023 - Remove VSCode API runtime coupling
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-022
- Deliverables:
  - VSCode API imports removed from standalone runtime
- Acceptance criteria:
  - Standalone app builds and runs without extension host
- Verify:
  - `npm run build`

#### ST-024 - Extract extension logic into platform-agnostic modules
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-023
- Deliverables:
  - Shared logic moved to `core/` or `adapters/`
- Acceptance criteria:
  - Logic reused by standalone app without extension dependencies
- Verify:
  - Unit tests for extracted modules

### M3 - Persistence Migration

#### ST-030 - Define workflow repository contract
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-021
- Deliverables:
  - `WorkflowRepository` interface (`load/save/list/delete`)
- Acceptance criteria:
  - Interface supports current and future storage adapters
- Verify:
  - Type-check and adapter contract tests

#### ST-031 - Implement IndexedDB repository
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-030
- Deliverables:
  - `idb`-backed repository
- Acceptance criteria:
  - CRUD operations complete under realistic workflow sizes
- Verify:
  - Integration tests for repository CRUD

#### ST-032 - Add in-memory repository for tests
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-030
- Deliverables:
  - Deterministic in-memory adapter
- Acceptance criteria:
  - Tests can run without browser storage
- Verify:
  - Unit tests using in-memory adapter

#### ST-033 - Port serializer/deserializer + validation
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-031
- Deliverables:
  - Workflow serialization/deserialization in standalone path
- Acceptance criteria:
  - Round-trip preserves workflow semantics
- Verify:
  - Round-trip snapshot tests

#### ST-034 - Legacy JSON migration adapter
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-033
- Deliverables:
  - Migration from legacy variants to current schema
- Acceptance criteria:
  - Known legacy samples load without data loss
- Verify:
  - Fixture-based migration tests

### M4 - Compiler and Model Registry

#### ST-040 - Build compiler pipeline boundaries
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-024
- Deliverables:
  - Stages: analyze -> normalize -> emit -> validate
- Acceptance criteria:
  - Stage contracts are typed and testable in isolation
- Verify:
  - Unit tests by stage

#### ST-041 - Preserve `.claude` emitter parity
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-040
- Deliverables:
  - `.claude` emitter integrated into new pipeline
- Acceptance criteria:
  - Output parity with baseline for reference workflows
- Verify:
  - Snapshot diff tests against baseline fixtures

#### ST-042 - Add target registry
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-040
- Deliverables:
  - Pluggable emitter registration API
- Acceptance criteria:
  - Emitters selectable by target key; unknown target fails safely
- Verify:
  - Unit tests for registry behavior

#### ST-043 - Implement OpenAI Assistants emitter
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-042
- Deliverables:
  - Valid Assistants JSON output
- Acceptance criteria:
  - Emits schema-valid JSON for representative workflows
- Verify:
  - JSON schema tests + snapshots

#### ST-044 - Implement portable JSON emitter
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-042
- Deliverables:
  - Universal portable workflow output
- Acceptance criteria:
  - Output captures graph + metadata required for re-import
- Verify:
  - Re-import round-trip tests

#### ST-045 - Define model capability schema
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-040
- Deliverables:
  - Typed model capability interfaces + schema validation
- Acceptance criteria:
  - Required fields validated (`tool_use`, `structured_output`, `vision`, `context_window`)
- Verify:
  - Unit tests for valid/invalid model definitions

#### ST-046 - Seed registry with Claude + GPT-4o
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-045
- Deliverables:
  - Two model profiles and loader wiring
- Acceptance criteria:
  - Models are selectable and influence compile pathway
- Verify:
  - Integration test for model selection + compile

#### ST-047 - Toolbar model selection integration
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-046
- Deliverables:
  - UI selector bound to compiler request
- Acceptance criteria:
  - Switching model updates generated output deterministically
- Verify:
  - UI integration tests

### M5 - Node Library Expansion

#### ST-060 - Define node plugin contract (Phase 1 internal)
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-021, ST-040
- Deliverables:
  - Node schema + renderer + compiler handler contract
- Acceptance criteria:
  - New node types can be added without modifying core switch logic
- Verify:
  - Contract tests with mock node plugins

#### ST-061 - Implement Core AI node set
- Status: `todo`
- Estimate: `1.0d`
- Depends on: ST-060
- Deliverables:
  - LLM Call, Prompt Template, System Instruction, Few-Shot Bank
- Acceptance criteria:
  - Each node renders, configures, serializes, compiles
- Verify:
  - Node-level integration tests

#### ST-062 - Implement Logic node set
- Status: `todo`
- Estimate: `1.0d`
- Depends on: ST-060
- Deliverables:
  - Conditional, Switch/Case, Loop, Error Handler
- Acceptance criteria:
  - Branching and control-flow semantics preserved in compiler graph
- Verify:
  - Graph compile tests with branch fixtures

#### ST-063 - Implement Data node set
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-060
- Deliverables:
  - Input Form, File Reader, API Call, JSON/CSV Parse
- Acceptance criteria:
  - Data schema mapping validated per node config
- Verify:
  - Validation + serialization tests

#### ST-064 - Implement Output node set
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-060
- Deliverables:
  - Text Response, File Writer, Webhook Push
- Acceptance criteria:
  - Output node options compile consistently across targets
- Verify:
  - Multi-target fixture tests

#### ST-065 - Implement Agent node set
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-060
- Deliverables:
  - Sub-Agent Spawn, Human-in-the-Loop Gate
- Acceptance criteria:
  - Agent/human gate semantics represented in compile graph
- Verify:
  - Behavior tests with gating scenarios

#### ST-066 - Node expansion completion gate
- Status: `todo`
- Estimate: `0.25d`
- Depends on: ST-061, ST-062, ST-063, ST-064, ST-065
- Deliverables:
  - At least 15 production-usable node types
- Acceptance criteria:
  - Node inventory and coverage matrix published
- Verify:
  - Coverage report + compile smoke tests

### M6 - UI System + i18n + Hardening

#### ST-070 - Introduce design tokens + Tailwind
- Status: `todo`
- Estimate: `0.75d`
- Depends on: ST-020
- Deliverables:
  - CSS variables + Tailwind mapping for design system
- Acceptance criteria:
  - No critical editor surfaces rely on ad-hoc inline design primitives
- Verify:
  - Visual smoke checks + `npm run check`

#### ST-071 - Radix standardization
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-070
- Deliverables:
  - Dialog/menu/tab primitives standardized
- Acceptance criteria:
  - Keyboard and focus behavior pass accessibility smoke checks
- Verify:
  - UI tests + manual keyboard walkthrough

#### ST-072 - Replace VSCode locale dependence with i18next
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-023
- Deliverables:
  - `i18next` initialization, locale loading, fallback
- Acceptance criteria:
  - Existing locale resources function in standalone app
- Verify:
  - Locale switching tests

#### ST-073 - Regression and quality gate completion
- Status: `todo`
- Estimate: `0.5d`
- Depends on: ST-041, ST-043, ST-044, ST-066, ST-072
- Deliverables:
  - Full regression suite and CI gates green
- Acceptance criteria:
  - All global acceptance criteria satisfied
- Verify:
  - `npm run format && npm run lint && npm run check && npm run build && npm run test`

## Critical Path

ST-001 -> ST-010 -> ST-020 -> ST-021 -> ST-022 -> ST-023 -> ST-024 -> ST-040 -> ST-041 -> ST-042 -> ST-043 -> ST-044 -> ST-060 -> ST-061/62/63/64/65 -> ST-066 -> ST-073

## Parallel Work Lanes

- Lane 1 (Platform): ST-010/011/012/013
- Lane 2 (Extraction): ST-020/021/022/023/024
- Lane 3 (Persistence): ST-030/031/032/033/034
- Lane 4 (Compiler): ST-040/041/042/043/044/045/046/047
- Lane 5 (Node Library): ST-060/061/062/063/064/065/066
- Lane 6 (UX/i18n): ST-070/071/072

## Out of Scope (Phase 1)

- Next.js backend and runtime execution infrastructure
- Auth, DB, queueing, live execution logs, collaboration
- Plugin SDK, marketplace, enterprise features
- Desktop app and CLI packaging
