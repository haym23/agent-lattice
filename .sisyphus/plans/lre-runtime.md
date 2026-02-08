# LRE Runtime + LIR Compiler Implementation

## TL;DR

> **Quick Summary**: Implement the Lattice IR (ExecIR) type system, a lowering compiler that transforms UI WorkflowDocuments into executable IR, and the Lattice Runtime Environment (LRE) that executes them — with OpenAI integration, schema validation, repair loops, and a full debug execution panel UI.
> 
> **Deliverables**:
> - ExecIR type definitions (`core/ir/`)
> - LLM provider abstraction + OpenAI adapter + mock (`core/llm/`)
> - Prompt template registry (`core/prompts/`)
> - Lowering compiler for 10 node types (`core/compiler/lower/`)
> - LRE runtime engine: Runner, StateStore, Validator, RepairEngine, EscalationEngine (`core/runtime/`)
> - Full debug execution panel UI (execution log, node highlighting, state inspector, model calls log)
> - PlatformAdapter extension with `executeWorkflow()` method
> 
> **Estimated Effort**: Large (3-5 days)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 4 → Task 5 → Task 8 → Task 9 → Task 10

---

## Context

### Original Request
Build the Lattice IR and Lattice Runtime Environment for the standalone React app, as laid out in `docs/runtime/lir.md` and `docs/runtime/lre.md`. The system compiles visual workflow graphs (WorkflowDocument) down to ExecIR and then executes them via the LRE, which manages state, compiles micro-prompts per-node, validates LLM output, and handles repair/escalation.

### Interview Summary
**Key Discussions**:
- **LLM Provider**: OpenAI API first (GPT-4o-mini as SMALL_EXEC, GPT-4o as MEDIUM_PLAN), env vars for API keys
- **Node Coverage**: 10 nodes in MVP (start, end, prompt, subAgent, ifElse, switch, mcp, httpRequest, variableStore, dataTransform). Parallel deferred to v2.
- **SubAgent**: Single LLM call (not multi-turn agent loop or recursive workflow)
- **Branching**: Deterministic data comparison only (no LLM in control flow)
- **UI**: Full debug execution panel with node highlighting, state inspector, model calls log
- **PlanIR**: Fully deferred — ExecIR only
- **Tests**: TDD with vitest throughout

**Research Findings**:
- Oracle confirmed module separation: `core/ir/`, `core/runtime/`, `core/llm/`, `core/prompts/`
- Oracle: Runtime-internal StateStore with subscribe(), thin Zustand adapter for UI observability
- Oracle: LowererRegistry pattern — one UI node can expand to multiple ExecIR ops
- Metis: Runtime MUST walk graph dynamically via edges, NOT use pre-computed executionOrder
- Metis: `WorkflowNode.config` is `Record<string, unknown>` — lowerers must extract typed fields
- Metis: `openai` npm package works in browsers with `dangerouslyAllowBrowser: true`
- Metis: Diamond patterns (implicit joins) need explicit design — node executes once after ALL incoming edges satisfied

### Metis Review
**Identified Gaps** (addressed):
- SubAgent runtime behavior → Resolved: single LLM call
- ifElse/switch expression semantics → Resolved: deterministic data comparison
- Parallel node complexity → Resolved: deferred to v2
- Data flow between nodes → Resolved: `$vars.{nodeId}.result` auto-wired from edges
- Missing `executeWorkflow()` on PlatformAdapter → Will be added in Task 9
- Diamond join semantics → Runtime tracks incoming edge completion, fires node when ALL predecessors done

---

## Work Objectives

### Core Objective
Build a compile-and-execute pipeline that lowers visual workflow graphs to typed, deterministic ExecIR programs and executes them via the LRE runtime engine, with OpenAI LLM integration, per-node schema validation, repair loops, and real-time UI observability.

### Concrete Deliverables
- `apps/src/core/ir/types.ts` — ExecIR type definitions
- `apps/src/core/llm/` — LLM provider interface, OpenAI adapter, mock provider
- `apps/src/core/prompts/` — Prompt template registry + built-in templates
- `apps/src/core/compiler/lower/` — Lowering compiler (10 node types)
- `apps/src/core/runtime/` — Runner, StateStore, PromptCompiler, Validator, RepairEngine, EscalationEngine
- `apps/src/features/editor/execution/` — Debug execution panel UI components
- Updated `PlatformAdapter` interface + `WebPlatformAdapter` implementation

### Definition of Done
- [x] `npm run test` passes with all new tests green (in `apps/`)
- [x] `npm run build` succeeds (in `apps/`)
- [x] `npm run check` passes (in `apps/`)
- [x] Full pipeline integration test: WorkflowDocument → lower() → ExecIR → Runner.execute() → StateStore has final results
- [x] Execution panel renders and shows live state during workflow run

### Must Have
- ExecIR type definitions with all ops: START, END, LLM_WRITE, SWITCH, TOOL_CALL, VAR_SET, VAR_GET, TRANSFORM
- Lowering for 10 UI node types with UnsupportedNodeError for others
- Runtime graph walker with dynamic edge-based execution
- StateStore with `$vars`, `$tmp`, `$ctx`, `$in` namespaces and subscribe()
- JSON Schema validation on every LLM output
- Repair loop (max 3 attempts) with structured repair packets
- Model class escalation (SMALL_EXEC → MEDIUM_PLAN)
- OpenAI adapter with structured output mode
- Mock LLM provider for all unit tests
- Full debug execution panel in editor UI

### Must NOT Have (Guardrails)
- **G1**: `core/runtime/` MUST NOT import from `react`, `reactflow`, `zustand`, or `features/`
- **G2**: `core/ir/` MUST NOT import from `core/compiler/` or `core/runtime/`
- **G3**: `core/llm/` exports interfaces + adapters only. Runtime imports interface, never `openai` directly
- **G4**: Existing compiler files (`pipeline.ts`, `analyzer.ts`, `registry.ts`, emitters/*) MUST NOT be modified
- **G5**: ExecIR must be JSON-serializable. No functions, no class instances in IR.
- **G6**: StateStore MUST NOT use Zustand internally
- **G7**: One lowerer per WorkflowNodeType. LowererRegistry enforces no duplicates.
- **G8**: Every LLM call goes through PromptCompiler → LlmProvider → Validator. No raw fetch to OpenAI.
- **G9**: Repair attempts capped at 3 per op execution
- **G10**: API key from `import.meta.env.VITE_OPENAI_API_KEY` only. No localStorage, no hardcoding.
- **G11**: All LLM calls use structured output (JSON mode) where available
- **G12**: `$ctx` and `$in` namespaces are read-only. Runtime throws on write attempts.
- **G13**: PlanIR is fully deferred. Zero PlanIR code.
- **G14**: Out-of-scope nodes → lowerer throws `UnsupportedNodeError`, not silent skip
- **G15**: No streaming/SSE for LLM responses in MVP. Batch only.
- **G16**: No persistent execution history in MVP. StateStore is ephemeral per-run.
- **G17**: No `eval()` or `Function()` for expression evaluation
- **G18**: Do NOT modify `core/workflow/types.ts` schema in this plan

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.

### Test Decision
- **Infrastructure exists**: YES (vitest + jsdom + testing-library configured)
- **Automated tests**: TDD (Red-Green-Refactor)
- **Framework**: vitest

### If TDD Enabled

Each TODO follows RED-GREEN-REFACTOR:

**Task Structure:**
1. **RED**: Write failing test first
   - Test file: `[path].test.ts`
   - Test command: `npx vitest run [file]`
   - Expected: FAIL (test exists, implementation doesn't)
2. **GREEN**: Implement minimum code to pass
   - Command: `npx vitest run [file]`
   - Expected: PASS
3. **REFACTOR**: Clean up while keeping green
   - Command: `npx vitest run [file]`
   - Expected: PASS (still)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Core logic (IR, runtime, compiler)** | Bash (vitest) | Run tests, assert pass count, check coverage |
| **LLM integration** | Bash (vitest with mock) | Unit tests with MockLlmProvider; integration test with real API behind env flag |
| **UI components** | Playwright (playwright skill) | Navigate to editor, trigger execution, verify panel renders |
| **Build verification** | Bash (npm run build/check) | Build succeeds, no type errors |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: ExecIR type definitions (core/ir/)
├── Task 2: LLM provider interface + mock + OpenAI adapter (core/llm/)
└── Task 3: Prompt template registry + built-in templates (core/prompts/)

Wave 2 (After Wave 1):
├── Task 4: Lowering compiler + LowererRegistry (core/compiler/lower/)
├── Task 5: Runtime StateStore (core/runtime/state-store.ts)
├── Task 6: Runtime Validator + RepairEngine (core/runtime/validator.ts, repair-engine.ts)
└── Task 7: Runtime PromptCompiler (core/runtime/prompt-compiler.ts)

Wave 3 (After Wave 2):
├── Task 8: Runtime Runner (core/runtime/runner.ts) — graph walker
├── Task 9: PlatformAdapter extension + WebPlatformAdapter wiring
└── Task 10: Execution debug panel UI

Wave 4 (After Wave 3):
└── Task 11: Full pipeline integration test + build verification
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3, 4, 5, 6, 7 | 2, 3 |
| 2 | None | 6, 7, 8 | 1, 3 |
| 3 | 1 | 7, 8 | 2 |
| 4 | 1 | 8, 11 | 5, 6, 7 |
| 5 | 1 | 8 | 4, 6, 7 |
| 6 | 1, 2 | 8 | 4, 5, 7 |
| 7 | 1, 2, 3 | 8 | 4, 5, 6 |
| 8 | 4, 5, 6, 7 | 9, 11 | None |
| 9 | 8 | 10, 11 | None |
| 10 | 9 | 11 | None |
| 11 | 8, 9, 10 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 2, 3 | task(category="unspecified-high") — parallel, each independent |
| 2 | 4, 5, 6, 7 | task(category="ultrabrain") — logic-heavy lowering + runtime |
| 3 | 8, 9, 10 | 8,9 = task(category="ultrabrain"), 10 = task(category="visual-engineering") |
| 4 | 11 | task(category="deep") — integration testing |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

- [x] 1. ExecIR Type Definitions

  **What to do**:
  - Create `apps/src/core/ir/types.ts` with all ExecIR types:
    - `ExecProgram`: top-level container with `execir_version`, `entry_node`, `nodes[]`, `edges[]`
    - `ExecNode`: union type for all ops. Each node has `id`, `op`, `inputs`, `outputs`
    - Op types: `START`, `END`, `LLM_WRITE`, `SWITCH`, `TOOL_CALL`, `VAR_SET`, `VAR_GET`, `TRANSFORM`
    - `ExecEdge`: `from`, `to`, `when` condition (deterministic expression)
    - `WhenCondition`: expression AST for deterministic evaluation (`{ op: 'eq' | 'neq' | 'contains' | 'regex' | 'always', left: string, right: string }`)
    - `StateRef`: typed reference to `$vars.*`, `$tmp.*`, `$ctx.*`, `$in.*`
    - `OutputSchema`: JSON Schema definition for LLM output validation
    - `RetryPolicy`: `{ strategy: 'PATCH_JSON_FROM_ERROR' | 'FULL_RETRY', max_attempts: number }`
    - `EscalationPolicy`: `{ on: string[], to_model_class: ModelClass }`
    - `ModelClass`: `'SMALL_EXEC' | 'MEDIUM_PLAN' | 'LARGE_JUDGE'`
    - `ValidatorDef`: `{ type: 'json_schema' | 'invariant', schema?: string, expr?: string }`
    - `InputProjection`: `{ ref: string, pick?: string[], truncate_items?: number, truncate_chars?: number }`
  - Create `apps/src/core/ir/index.ts` barrel export
  - Write tests: `apps/src/core/ir/types.test.ts`
    - Test type guards / constructors for each ExecNode variant
    - Test StateRef parsing (validates `$vars.x.y` format)
    - Test WhenCondition is JSON-serializable
    - Test ExecProgram with all op types can be serialized to JSON and back

  **Must NOT do**:
  - Import from ANY other `core/` module (zero dependencies)
  - Include PlanIR types
  - Include runtime execution types (traces, events) — those go in `core/runtime/`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Type-heavy design work, foundational module, no UI or complex logic
  - **Skills**: []
    - No special skills needed — pure TypeScript type definitions
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 3, 4, 5, 6, 7
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `apps/src/core/workflow/types.ts:1-59` — Type-only module pattern with const arrays, type unions, and interfaces. Follow this exact structure for ExecIR types.
  - `apps/src/core/compiler/types.ts:1-33` — How compiler types are structured (input/output interfaces, analyzed graph)

  **API/Type References** (contracts to implement against):
  - `docs/runtime/lir.md:120-162` — ExecIR spec: node structure, ops, inputs/outputs, validators, retry_policy, escalation
  - `docs/runtime/lir.md:179-198` — State reference namespaces: `$vars.*`, `$tmp.*`, `$ctx.*`, `$in.*`
  - `docs/runtime/lir.md:199-207` — Operation types: deterministic (TOOL_CALL, PACK, MERGE, SWITCH, MAP) + LLM (LLM_EXTRACT, LLM_CLASSIFY, LLM_CHOOSE, LLM_WRITE)
  - `docs/runtime/lir.md:339-463` — Full ExecIR JSON example showing all field shapes

  **Test References** (testing patterns to follow):
  - `apps/src/core/compiler/pipeline.test.ts` — Test file naming and structure convention
  - `apps/src/core/models/registry.test.ts` — Simple unit test pattern

  **WHY Each Reference Matters**:
  - `workflow/types.ts` → Follow the same pattern of const arrays + type union + type guard function for ExecIR ops
  - `lir.md:339-463` → The JSON examples are the ground truth for what ExecIR fields look like. Types must match these shapes exactly.

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file created: `apps/src/core/ir/types.test.ts`
  - [x] Tests cover: ExecProgram serialization roundtrip, StateRef validation, WhenCondition JSON-serializable, each op variant constructible
  - [x] `npx vitest run src/core/ir/types.test.ts` → PASS

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: ExecIR types compile and export correctly
    Tool: Bash
    Preconditions: Task code written
    Steps:
      1. Run: npx vitest run src/core/ir/types.test.ts --reporter=verbose
      2. Assert: All tests pass (0 failures)
      3. Run: npx tsc --noEmit -p tsconfig.app.json
      4. Assert: No type errors
    Expected Result: All type tests pass, TypeScript compiles cleanly
    Evidence: Terminal output captured

  Scenario: ExecIR has zero imports from other core modules
    Tool: Bash (grep)
    Preconditions: types.ts written
    Steps:
      1. Run: grep -r "from '../../" src/core/ir/ || echo "CLEAN"
      2. Assert: Output is "CLEAN" (no relative imports outside ir/)
      3. Run: grep -r "from '../" src/core/ir/ || echo "CLEAN"
      4. Assert: Output is "CLEAN"
    Expected Result: Zero external imports
    Evidence: grep output captured
  ```

  **Commit**: YES
  - Message: `feat(ir): add ExecIR type definitions`
  - Files: `src/core/ir/types.ts`, `src/core/ir/index.ts`, `src/core/ir/types.test.ts`
  - Pre-commit: `npx vitest run src/core/ir/`

---

- [x] 2. LLM Provider Interface + Mock + OpenAI Adapter

  **What to do**:
  - Create `apps/src/core/llm/types.ts`:
    - `ModelClass`: `'SMALL_EXEC' | 'MEDIUM_PLAN' | 'LARGE_JUDGE'` (re-export from ir/types or define shared)
    - `LlmRequest`: `{ modelClass: ModelClass, messages: LlmMessage[], responseFormat?: JsonSchema, temperature?: number }`
    - `LlmMessage`: `{ role: 'system' | 'user' | 'assistant', content: string }`
    - `LlmResponse`: `{ content: string, parsed?: unknown, usage: { promptTokens: number, completionTokens: number }, modelUsed: string }`
    - `LlmProvider` interface: `{ chat(request: LlmRequest): Promise<LlmResponse> }`
  - Create `apps/src/core/llm/mock-provider.ts`:
    - `MockLlmProvider` that returns configurable deterministic responses
    - Constructor takes `Map<string, LlmResponse>` or response factory function
    - Records all calls for test assertions (`getCalls(): LlmRequest[]`)
  - Create `apps/src/core/llm/openai-provider.ts`:
    - `OpenAiProvider` implementing `LlmProvider`
    - Maps `ModelClass` → OpenAI model ID: `SMALL_EXEC → gpt-4o-mini`, `MEDIUM_PLAN → gpt-4o`, `LARGE_JUDGE → gpt-4o`
    - Uses `openai` npm package with `dangerouslyAllowBrowser: true`
    - API key from `import.meta.env.VITE_OPENAI_API_KEY`
    - Uses `response_format: { type: 'json_object' }` when `responseFormat` provided
    - Error handling: rate limit (429) → exponential backoff (max 3 retries), auth error → clear `MissingApiKeyError`
  - Create `apps/src/core/llm/index.ts` barrel export
  - Install `openai` npm package: `npm install openai`
  - Write tests for mock provider and OpenAI provider (unit tests with mock, integration test behind env flag)

  **Must NOT do**:
  - Import from `core/runtime/` or `core/compiler/`
  - Implement streaming — batch responses only
  - Store API key in localStorage

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Provider abstraction pattern, npm package integration, error handling
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 6, 7, 8
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/src/core/models/registry.ts:1-51` — Registry pattern with get/list. Follow for model class mapping.
  - `apps/src/services/platform-adapter.ts:1-30` — Interface pattern for platform abstraction. Follow same style for LlmProvider.

  **API/Type References**:
  - `docs/runtime/lre.md:192-206` — Model classes: SMALL_EXEC, MEDIUM_PLAN, LARGE_JUDGE and escalation semantics
  - `docs/runtime/lir.md:147-155` — Retry policy and escalation policy shapes

  **External References**:
  - OpenAI SDK browser usage: The `openai` npm package v4+ supports browser with `dangerouslyAllowBrowser: true` option
  - OpenAI structured output: Use `response_format: { type: 'json_object' }` for JSON mode

  **WHY Each Reference Matters**:
  - `models/registry.ts` → The model class → OpenAI model ID mapping follows the same registry pattern
  - `platform-adapter.ts` → LlmProvider interface should follow the same async-first, interface-driven style

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/llm/mock-provider.test.ts`
  - [x] Test file: `apps/src/core/llm/openai-provider.test.ts`
  - [x] Mock provider tests: configurable responses, call recording, deterministic behavior
  - [x] OpenAI provider tests: model class mapping, error handling (mocked fetch)
  - [x] `npx vitest run src/core/llm/` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: MockLlmProvider returns configured response
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/llm/mock-provider.test.ts --reporter=verbose
      2. Assert: All tests pass
    Expected Result: Mock provider is deterministic and configurable
    Evidence: Test output

  Scenario: OpenAI provider maps model classes correctly
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/llm/openai-provider.test.ts --reporter=verbose
      2. Assert: SMALL_EXEC maps to gpt-4o-mini, MEDIUM_PLAN maps to gpt-4o
      3. Assert: Missing API key throws MissingApiKeyError
    Expected Result: Provider correctly maps model classes and handles errors
    Evidence: Test output

  Scenario: openai package installed correctly
    Tool: Bash
    Steps:
      1. Run: node -e "require('openai')" (in apps/standalone)
      2. Assert: No error
    Expected Result: Package is importable
    Evidence: Command output
  ```

  **Commit**: YES
  - Message: `feat(llm): add LLM provider interface with OpenAI adapter and mock`
  - Files: `src/core/llm/types.ts`, `src/core/llm/mock-provider.ts`, `src/core/llm/openai-provider.ts`, `src/core/llm/index.ts`, `package.json`
  - Pre-commit: `npx vitest run src/core/llm/`

---

- [x] 3. Prompt Template Registry + Built-in Templates

  **What to do**:
  - Create `apps/src/core/prompts/types.ts`:
    - `PromptTemplate`: `{ id: string, version: string, systemPrompt: string, userPromptTemplate: string, outputSchema?: object }`
    - `PromptTemplateRegistry` class (follows EmitterRegistry pattern): `register()`, `get()`, `list()`
  - Create `apps/src/core/prompts/registry.ts`:
    - `PromptTemplateRegistry` implementation with Map storage
    - `createDefaultPromptRegistry()` factory that registers built-in templates
  - Create `apps/src/core/prompts/templates/` with built-in templates:
    - `llm-write-v1.ts`: General-purpose LLM generation template. System: "You are a task executor. Follow the instruction precisely. Respond in JSON." User: renders instruction + input data.
    - `llm-classify-v1.ts`: Classification template (for future use, define now). System: "Classify the input into exactly one of the given labels." User: renders input + labels.
    - `repair-v1.ts`: Repair template. System: "Fix the JSON output based on the error description." User: renders previous output + error + schema.
  - Create `apps/src/core/prompts/index.ts` barrel export
  - Write tests for registry (register, get, duplicate rejection, list) and template rendering

  **Must NOT do**:
  - Import from `core/runtime/` or `core/compiler/`
  - Load templates from filesystem at runtime (static TS imports only)
  - Build template versioning/migration system

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Registry pattern implementation, template string design
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 7, 8
  - **Blocked By**: Task 1 (needs ExecIR types for OutputSchema reference)

  **References**:

  **Pattern References**:
  - `apps/src/core/compiler/registry.ts:1-35` — EmitterRegistry pattern: Map storage, register(), emit(). Follow this EXACTLY for PromptTemplateRegistry.

  **API/Type References**:
  - `docs/runtime/lir.md:228-241` — Prompt template binding requirements: templates are "compiler intrinsics", user prompts compile into safe templates
  - `docs/runtime/lir.md:477-521` — Step C: How prompt compilation works. Template + resolved inputs → micro-prompt payload.

  **WHY Each Reference Matters**:
  - `registry.ts` → The PromptTemplateRegistry should be a near-identical pattern to EmitterRegistry
  - `lir.md:477-521` → Shows exact shape of compiled prompts: system rules, allowed IDs, output schema, user data

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/prompts/registry.test.ts`
  - [x] Tests: register + get, duplicate ID rejection, list all, get unknown throws
  - [x] `npx vitest run src/core/prompts/` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Prompt registry manages templates
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/prompts/registry.test.ts --reporter=verbose
      2. Assert: register, get, list, duplicate-rejection tests pass
    Expected Result: Registry follows EmitterRegistry pattern correctly
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(prompts): add prompt template registry with built-in templates`
  - Files: `src/core/prompts/types.ts`, `src/core/prompts/registry.ts`, `src/core/prompts/templates/*.ts`, `src/core/prompts/index.ts`
  - Pre-commit: `npx vitest run src/core/prompts/`

---

- [x] 4. Lowering Compiler + LowererRegistry

  **What to do**:
  - Create `apps/src/core/compiler/lower/types.ts`:
    - `Lowerer` interface: `{ nodeType: WorkflowNodeType, lower(node: WorkflowNode, context: LoweringContext): ExecIrFragment }`
    - `LoweringContext`: `{ workflow: WorkflowDocument, graph: AnalyzedGraph, allNodes: Map<string, WorkflowNode>, incomingEdges: Map<string, WorkflowEdge[]>, outgoingEdges: Map<string, WorkflowEdge[]> }`
    - `ExecIrFragment`: `{ nodes: ExecNode[], edges: ExecEdge[], requiredTemplates: string[] }`
  - Create `apps/src/core/compiler/lower/registry.ts`:
    - `LowererRegistry` class following EmitterRegistry pattern: `register()`, `lower()`, `has()`
    - Enforces no duplicate node type registrations
    - Throws `UnsupportedNodeError` for unregistered types
  - Create individual lowerers in `apps/src/core/compiler/lower/lowerers/`:
    - `start-lowerer.ts`: start → START op (no-op entry point)
    - `end-lowerer.ts`: end → END op (no-op exit point)
    - `prompt-lowerer.ts`: prompt → LLM_WRITE op. Extracts `config.prompt` as instruction. Binds `llm-write-v1` template. Output → `$vars.{nodeId}.result`. Adds JSON Schema validator + retry policy (max 3).
    - `sub-agent-lowerer.ts`: subAgent → LLM_WRITE op. Same as prompt but uses `config.prompt` + `config.description` as context. Single LLM call.
    - `if-else-lowerer.ts`: ifElse → SWITCH op with 2 branches. Extracts `config.evaluationTarget` as `$vars` path. Branches have deterministic `when` conditions (string equality).
    - `switch-lowerer.ts`: switch → SWITCH op with N branches. Same pattern as ifElse but N-way.
    - `mcp-lowerer.ts`: mcp → TOOL_CALL op. Extracts `config.serverId`, `config.toolName`. Args from config parameters.
    - `http-request-lowerer.ts`: httpRequest → TOOL_CALL op. Extracts `config.method`, `config.url`, `config.responseFormat`. URL supports `{{$vars.x}}` interpolation.
    - `variable-store-lowerer.ts`: variableStore → VAR_SET or VAR_GET op based on `config.operation`.
    - `data-transform-lowerer.ts`: dataTransform → TRANSFORM op. Extracts `config.transformationType` and `config.expression`.
  - Create `apps/src/core/compiler/lower/index.ts`:
    - `createDefaultLowererRegistry()` factory that registers all 10 lowerers
    - `lowerToExecIR(workflow: WorkflowDocument): ExecProgram` — main entry point
      - Calls `analyzeGraph()` from existing analyzer
      - Validates: exactly 1 start node, no cycles, no unreachable nodes
      - Iterates nodes, calls lowerer for each
      - Assembles ExecProgram with entry_node, merged nodes, merged edges
  - Write comprehensive tests for each lowerer + the registry + the main `lowerToExecIR()` function

  **Must NOT do**:
  - Modify existing `core/compiler/pipeline.ts`, `analyzer.ts`, `registry.ts`, or any emitter
  - Add LLM-based branching logic
  - Handle parallel node (throw UnsupportedNodeError)
  - Import from `core/runtime/`

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex logic — graph traversal, node-to-op mapping, context assembly, edge wiring. Requires careful design.
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI in this task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Tasks 8, 11
  - **Blocked By**: Task 1 (needs ExecIR types)

  **References**:

  **Pattern References**:
  - `apps/src/core/compiler/registry.ts:1-35` — EmitterRegistry: Map-based registry with register() + type-keyed lookup. LowererRegistry MUST follow this pattern.
  - `apps/src/core/compiler/analyzer.ts:1-126` — analyzeGraph() function that produces AnalyzedGraph. Lowerer MUST consume this output for executionOrder, cycles, unreachable detection.
  - `apps/src/core/nodes/catalog.ts:1-176` — Node catalog with all 20 node types and their defaultConfig shapes. Lowerers must handle these exact config shapes.

  **API/Type References**:
  - `apps/src/core/ir/types.ts` (from Task 1) — ExecNode, ExecEdge, ExecProgram types to produce
  - `apps/src/core/workflow/types.ts:1-59` — WorkflowNode, WorkflowEdge, WorkflowDocument types consumed as input
  - `docs/runtime/lir.md:330-463` — Step B: Full ExecIR lowering example showing how UI blocks map to ExecIR nodes with explicit inputs/outputs/validators

  **Test References**:
  - `apps/src/core/compiler/pipeline.test.ts` — Existing compiler test patterns (snapshot testing, input/output verification)

  **WHY Each Reference Matters**:
  - `catalog.ts` → Each lowerer must know the exact shape of `defaultConfig` for its node type
  - `analyzer.ts` → The lowering entry point calls `analyzeGraph()` first; don't rewrite graph analysis
  - `lir.md:330-463` → The canonical example of lowering; follow this structure for field names and shapes

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/compiler/lower/registry.test.ts`
  - [x] Test file: `apps/src/core/compiler/lower/lowerers/*.test.ts` (per lowerer)
  - [x] Test file: `apps/src/core/compiler/lower/index.test.ts` (lowerToExecIR integration)
  - [x] Tests: Each lowerer produces correct ExecIR ops for sample input
  - [x] Tests: UnsupportedNodeError for `skill`, `flow`, `codex`, `branch`, `parallel`, `delay`, `webhookTrigger`, `codeExecutor`, `batchIterator`, `askUserQuestion`
  - [x] Tests: Reject workflows with cycles, multiple starts, unreachable nodes
  - [x] Tests: Linear workflow (start→prompt→end) produces valid ExecProgram
  - [x] Tests: Branching workflow (start→ifElse→two branches→end) produces correct SWITCH + edges
  - [x] `npx vitest run src/core/compiler/lower/` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Lowering a minimal workflow produces valid ExecIR
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/compiler/lower/index.test.ts --reporter=verbose
      2. Assert: Linear workflow test passes — ExecProgram has 3 nodes (START, LLM_WRITE, END)
      3. Assert: Branching workflow test passes — SWITCH op with correct edge conditions
      4. Assert: Unsupported node test passes — UnsupportedNodeError thrown
    Expected Result: All lowering tests pass
    Evidence: Test output

  Scenario: Existing compiler tests still pass (no regressions)
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/compiler/pipeline.test.ts --reporter=verbose
      2. Assert: All existing tests pass (0 failures)
    Expected Result: No regressions in existing compiler
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(compiler): add lowering compiler for 10 node types`
  - Files: `src/core/compiler/lower/**`
  - Pre-commit: `npx vitest run src/core/compiler/`

---

- [x] 5. Runtime StateStore

  **What to do**:
  - Create `apps/src/core/runtime/state-store.ts`:
    - `StateStore` class managing 4 namespaces: `$vars` (read-write), `$tmp` (read-write), `$ctx` (read-only), `$in` (read-only)
    - Methods: `get(ref: string): unknown` — resolves `$vars.nodeId.result` → value via dot-path traversal
    - Methods: `set(ref: string, value: unknown): void` — writes to `$vars` or `$tmp`. Throws `ReadOnlyNamespaceError` for `$ctx`/`$in`.
    - Methods: `snapshot(): StateSnapshot` — returns immutable copy of all state
    - Methods: `subscribe(listener: StateListener): () => void` — event subscription, returns unsubscribe function
    - `StateListener`: `(event: StateEvent) => void`
    - `StateEvent`: union of `{ type: 'variable-set', namespace: string, path: string, value: unknown }`, `{ type: 'snapshot', state: StateSnapshot }`
    - Constructor takes initial `$in` and `$ctx` values
    - All state internally stored as nested plain objects
    - Namespace validation: only `$vars`, `$tmp`, `$ctx`, `$in` prefixes allowed
  - Create `apps/src/core/runtime/types.ts` for shared runtime types:
    - `ExecutionStatus`: `'idle' | 'running' | 'completed' | 'failed' | 'cancelled'`
    - `NodeExecutionStatus`: `'pending' | 'running' | 'completed' | 'skipped' | 'failed'`
    - `ExecutionEvent`: union type for all events (node-started, node-completed, node-failed, variable-set, execution-completed, execution-failed)
    - `ExecutionResult`: `{ status: ExecutionStatus, finalState: StateSnapshot, events: ExecutionEvent[], error?: Error }`
  - Write comprehensive tests for StateStore

  **Must NOT do**:
  - Import Zustand, React, or ReactFlow
  - Allow writes to `$ctx` or `$in` namespaces
  - Use `eval()` for path resolution

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Core data structure with path resolution, namespace enforcement, event system
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Task 1 (needs ExecIR types for StateRef)

  **References**:

  **Pattern References**:
  - `apps/src/core/workflow/types.ts:1-59` — Type-only module convention

  **API/Type References**:
  - `docs/runtime/lir.md:179-198` — State namespaces: `$vars.*`, `$tmp.*`, `$ctx.*`, `$in.*` with read/write semantics
  - `docs/runtime/lre.md:108-122` — Runtime state model: explicit state, namespace descriptions, data passing via `$vars`
  - `docs/runtime/lir.md:253-273` — How "runtime memory" works: node outputs → state → later node inputs

  **WHY Each Reference Matters**:
  - `lir.md:179-198` → Defines the exact namespace semantics (read-only vs read-write) that StateStore must enforce
  - `lre.md:108-122` → Confirms "no hidden memory" design principle

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/runtime/state-store.test.ts`
  - [x] Tests: set/get on `$vars` and `$tmp` — write then read roundtrip
  - [x] Tests: get from `$in` — read succeeds with initial values
  - [x] Tests: set on `$ctx` or `$in` throws `ReadOnlyNamespaceError`
  - [x] Tests: dot-path resolution (`$vars.nodeA.result.name` → nested value)
  - [x] Tests: subscribe receives events on set
  - [x] Tests: snapshot returns immutable copy (mutations don't affect original)
  - [x] Tests: invalid namespace prefix throws error
  - [x] `npx vitest run src/core/runtime/state-store.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: StateStore manages namespaces correctly
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/state-store.test.ts --reporter=verbose
      2. Assert: All namespace tests pass (read-write, read-only, path resolution, subscribe)
    Expected Result: StateStore correctly enforces namespace semantics
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(runtime): add StateStore with namespace management and event subscriptions`
  - Files: `src/core/runtime/state-store.ts`, `src/core/runtime/types.ts`, `src/core/runtime/state-store.test.ts`
  - Pre-commit: `npx vitest run src/core/runtime/`

---

- [x] 6. Runtime Validator + RepairEngine

  **What to do**:
  - Create `apps/src/core/runtime/validator.ts`:
    - `Validator` class with `validate(output: unknown, node: ExecNode): ValidationResult`
    - `ValidationResult`: `{ valid: boolean, errors: ValidationError[] }`
    - `ValidationError`: `{ type: 'schema' | 'invariant', message: string, path?: string }`
    - JSON Schema validation: use a lightweight validator (consider `ajv` or manual implementation for basic schemas)
    - Invariant validation: evaluate invariant expressions (e.g., `$out.id in $in.candidates[*].id`) — for MVP, support basic membership checks
  - Create `apps/src/core/runtime/repair-engine.ts`:
    - `RepairEngine` class with `attemptRepair(node: ExecNode, previousOutput: unknown, errors: ValidationError[], provider: LlmProvider): Promise<RepairResult>`
    - `RepairResult`: `{ repaired: boolean, output?: unknown, attempts: number }`
    - Generates structured repair packet: `{ error: string, previous_output: unknown, expected_schema: object }`
    - Uses the `repair-v1` prompt template
    - Respects `retry_policy.max_attempts` (cap at 3)
    - Each repair attempt re-invokes LLM with the repair packet as context
  - Create `apps/src/core/runtime/escalation-engine.ts`:
    - `EscalationEngine` class with `shouldEscalate(node: ExecNode, error: ValidationError): EscalationDecision`
    - `EscalationDecision`: `{ escalate: boolean, toModelClass?: ModelClass }`
    - Reads `node.escalation.on[]` conditions and matches against error types
    - Returns the target `model_class` from escalation policy
  - Install `ajv` for JSON Schema validation: `npm install ajv`
  - Write tests for validator, repair engine, escalation engine

  **Must NOT do**:
  - Import from React/Zustand/features
  - Implement streaming repair
  - Allow unlimited repair attempts

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Schema validation logic, repair packet generation, LLM re-invocation. Core reliability mechanism.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 7)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1 (ExecIR types), 2 (LlmProvider interface)

  **References**:

  **API/Type References**:
  - `docs/runtime/lir.md:209-251` — Validation and repair requirements: JSON Schema, invariants, repair packets, "fix-only" re-prompting
  - `docs/runtime/lir.md:245-251` — Escalation policies: which failures trigger, to which model_class
  - `docs/runtime/lre.md:168-186` — Validator types, repair flow, re-invocation with minimal prompt
  - `docs/runtime/lir.md:506-522` — Repair packet example: error + allowed_ids + previous_output

  **External References**:
  - ajv library: JSON Schema validator for JavaScript/TypeScript

  **WHY Each Reference Matters**:
  - `lir.md:209-251` → Defines the exact validation/repair contract. RepairEngine must generate structured packets matching this spec.
  - `lir.md:506-522` → Concrete repair packet example to implement against

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/runtime/validator.test.ts`
  - [x] Test file: `apps/src/core/runtime/repair-engine.test.ts`
  - [x] Test file: `apps/src/core/runtime/escalation-engine.test.ts`
  - [x] Tests: Validator accepts valid JSON matching schema
  - [x] Tests: Validator rejects invalid JSON with specific error messages
  - [x] Tests: Validator checks invariant (membership check)
  - [x] Tests: RepairEngine calls LLM with repair packet, returns repaired output
  - [x] Tests: RepairEngine caps at max_attempts
  - [x] Tests: EscalationEngine returns correct model class for matching error conditions
  - [x] `npx vitest run src/core/runtime/validator.test.ts src/core/runtime/repair-engine.test.ts src/core/runtime/escalation-engine.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Validator and repair work end-to-end
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/validator.test.ts --reporter=verbose
      2. Assert: Schema validation + invariant tests pass
      3. Run: npx vitest run src/core/runtime/repair-engine.test.ts --reporter=verbose
      4. Assert: Repair attempt tests pass (with MockLlmProvider)
    Expected Result: Validation and repair logic is correct
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(runtime): add Validator, RepairEngine, and EscalationEngine`
  - Files: `src/core/runtime/validator.ts`, `src/core/runtime/repair-engine.ts`, `src/core/runtime/escalation-engine.ts`, tests
  - Pre-commit: `npx vitest run src/core/runtime/`

---

- [x] 7. Runtime PromptCompiler

  **What to do**:
  - Create `apps/src/core/runtime/prompt-compiler.ts`:
    - `PromptCompiler` class that transforms ExecNode + resolved inputs → LlmRequest
    - Constructor takes `PromptTemplateRegistry`
    - Method: `compile(node: ExecNode, resolvedInputs: Record<string, unknown>): LlmRequest`
      - Looks up `node.prompt_template` in registry
      - Renders system prompt from template
      - Renders user prompt by interpolating resolved inputs into template
      - Applies input projection: `pick` fields, `truncate_items`, `truncate_chars`
      - Sets `responseFormat` from node's `output_schema`
      - Sets `modelClass` from node's `model_class`
    - Method: `compileRepair(node: ExecNode, repairPacket: RepairPacket): LlmRequest`
      - Uses `repair-v1` template
      - Includes previous output + error + expected schema
  - Write tests for prompt compilation with various node configurations

  **Must NOT do**:
  - Make any LLM calls (that's the provider's job)
  - Import from React/Zustand
  - Use `eval()` for template rendering — use string interpolation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Template rendering + input projection logic. Moderate complexity.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5, 6)
  - **Blocks**: Task 8
  - **Blocked By**: Tasks 1 (ExecIR types), 2 (LlmRequest type), 3 (PromptTemplateRegistry)

  **References**:

  **API/Type References**:
  - `docs/runtime/lir.md:228-241` — Prompt template binding: templates are "compiler intrinsics", per-node binding
  - `docs/runtime/lir.md:235-241` — Input projection: `pick`, `truncate_items`, `truncate_chars`
  - `docs/runtime/lir.md:477-521` — Step C: Full prompt compilation example showing resolved inputs → compiled prompt payload → model output → validation

  **WHY Each Reference Matters**:
  - `lir.md:477-521` → This IS the PromptCompiler's job. The example shows exactly what the compiler produces. Follow it step-by-step.

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/runtime/prompt-compiler.test.ts`
  - [x] Tests: compile() produces correct system + user messages
  - [x] Tests: Input projection (pick, truncate) reduces data correctly
  - [x] Tests: responseFormat set from output_schema
  - [x] Tests: compileRepair() uses repair template with error context
  - [x] `npx vitest run src/core/runtime/prompt-compiler.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: PromptCompiler renders micro-prompts correctly
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/prompt-compiler.test.ts --reporter=verbose
      2. Assert: All compilation and projection tests pass
    Expected Result: Prompt compilation matches LIR spec examples
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(runtime): add PromptCompiler for micro-prompt generation`
  - Files: `src/core/runtime/prompt-compiler.ts`, `src/core/runtime/prompt-compiler.test.ts`
  - Pre-commit: `npx vitest run src/core/runtime/`

---

- [x] 8. Runtime Runner (Graph Walker)

  **What to do**:
  - Create `apps/src/core/runtime/runner.ts`:
    - `Runner` class — the core graph execution engine
    - Constructor takes: `{ provider: LlmProvider, promptCompiler: PromptCompiler, validator: Validator, repairEngine: RepairEngine, escalationEngine: EscalationEngine }`
    - Method: `execute(program: ExecProgram, input: Record<string, unknown>, context?: Record<string, unknown>): Promise<ExecutionResult>`
      - Creates StateStore with `$in` = input, `$ctx` = context (or defaults: `{ timestamp, executionId }`)
      - Starts at `entry_node`, walks edges dynamically
      - For each node, dispatches to op handler:
        - `START`: no-op, follow edge
        - `END`: stop execution, set status to completed
        - `LLM_WRITE`: resolve inputs from state → PromptCompiler.compile() → LlmProvider.chat() → Validator.validate() → if invalid, RepairEngine.attemptRepair() → if still invalid, EscalationEngine.shouldEscalate() → if escalate, retry with upgraded model class → write output to state
        - `SWITCH`: resolve evaluationTarget from state → evaluate WhenConditions on outgoing edges → follow matching edge
        - `TOOL_CALL`: resolve args from state → execute tool (browser fetch for HTTP, or MCP handler) → write response to state
        - `VAR_SET`: write value to state
        - `VAR_GET`: read value from state (passthrough for explicit reads)
        - `TRANSFORM`: resolve inputs → apply JMESPath expression → write result to state (requires `jmespath` npm package or manual implementation)
      - Emits ExecutionEvents via StateStore.subscribe pattern
      - Tracks per-node status (pending → running → completed/failed/skipped)
      - Handles diamond joins: node fires only when ALL incoming edges' source nodes are completed
      - Abort support: accepts AbortSignal, checks before each node execution
    - Method: `abort(): void` — cancels execution via AbortController
    - Install `jmespath` if not already available for TRANSFORM ops
  - Create `apps/src/core/runtime/tool-executor.ts`:
    - `ToolExecutor` class for TOOL_CALL ops
    - For `httpRequest`: uses browser `fetch()` with method, URL (with `{{$vars.x}}` interpolation), JSON body
    - For `mcp`: makes HTTP POST to configured MCP endpoint URL
    - Returns JSON response stored in state
  - Create `apps/src/core/runtime/index.ts` barrel export with factory:
    - `createRunner(provider: LlmProvider): Runner` — wires up all runtime components with defaults
  - Write comprehensive tests for Runner with MockLlmProvider

  **Must NOT do**:
  - Import from React/Zustand/features
  - Use pre-computed executionOrder for execution (MUST walk edges dynamically)
  - Allow unlimited execution (add global timeout: 5 minutes default)
  - Implement streaming LLM calls

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Most complex task in the plan. Graph walking, op dispatch, async flow, diamond joins, abort handling, error recovery. Requires careful state management.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Wave 2)
  - **Blocks**: Tasks 9, 11
  - **Blocked By**: Tasks 4, 5, 6, 7 (needs lowering, state store, validator, prompt compiler)

  **References**:

  **Pattern References**:
  - `apps/src/core/compiler/analyzer.ts:92-125` — findUnreachable uses BFS graph walk pattern. Runner's dynamic graph walk follows similar adjacency-list traversal.

  **API/Type References**:
  - `docs/runtime/lre.md:47-58` — Core idea: nodes=instructions, edges=control flow, state=memory, validators=type system, retries=exception handling
  - `docs/runtime/lre.md:62-76` — Architecture overview: LIR → LRE Runtime → Prompt Compiler → Validators → Repair → Escalation
  - `docs/runtime/lre.md:124-137` — Control flow: deterministic `when` conditions evaluated by runtime
  - `docs/runtime/lre.md:141-165` — Core operations: deterministic ops + LLM ops
  - `docs/runtime/lir.md:339-463` — Full ExecIR example showing node execution flow
  - `docs/runtime/lir.md:477-521` — Per-node prompt compilation and validation flow

  **WHY Each Reference Matters**:
  - `lre.md:47-58` → The Runner IS this mental model. Each concept maps to a method.
  - `lir.md:339-463` → Walk through this example step by step. The Runner must produce equivalent behavior.
  - `analyzer.ts:92-125` → Adjacency list + BFS pattern reusable for dynamic graph walking

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/core/runtime/runner.test.ts`
  - [x] Test file: `apps/src/core/runtime/tool-executor.test.ts`
  - [x] Tests: Linear execution (START → LLM_WRITE → END) with MockLlmProvider
  - [x] Tests: Branching execution (SWITCH takes correct branch based on state)
  - [x] Tests: LLM validation failure triggers repair (mock returns invalid then valid)
  - [x] Tests: Repair exhaustion (3 attempts) → execution fails with detailed error
  - [x] Tests: Escalation triggers model class upgrade on configured failure
  - [x] Tests: Diamond join (node waits for all predecessors)
  - [x] Tests: Abort cancels execution mid-run
  - [x] Tests: TOOL_CALL via ToolExecutor (mocked fetch)
  - [x] Tests: VAR_SET and VAR_GET state operations
  - [x] Tests: TRANSFORM applies JMESPath expression
  - [x] `npx vitest run src/core/runtime/runner.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Runner executes a linear workflow
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/runner.test.ts --reporter=verbose
      2. Assert: Linear execution test passes — START → LLM_WRITE → END with state populated
      3. Assert: Branching test passes — correct branch taken
      4. Assert: Repair test passes — validation failure triggers repair loop
    Expected Result: Runner correctly walks graph and executes ops
    Evidence: Test output

  Scenario: All runtime tests pass together
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/ --reporter=verbose
      2. Assert: All runtime tests pass (state-store, validator, repair, prompt-compiler, runner)
    Expected Result: Entire runtime module is correct
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat(runtime): add Runner graph walker with op dispatch and repair loops`
  - Files: `src/core/runtime/runner.ts`, `src/core/runtime/tool-executor.ts`, `src/core/runtime/index.ts`, tests
  - Pre-commit: `npx vitest run src/core/runtime/`

---

- [x] 9. PlatformAdapter Extension + WebPlatformAdapter Wiring

  **What to do**:
  - Extend `apps/src/services/platform-adapter.ts`:
    - Add `executeWorkflow(workflow: WorkflowDocument, input?: Record<string, unknown>): Promise<ExecutionResult>` to `PlatformAdapter` interface
    - Add `subscribeToExecution(listener: ExecutionListener): () => void` for UI observability
    - `ExecutionListener`: re-export from runtime types
  - Update `apps/src/services/web-adapter.ts`:
    - Implement `executeWorkflow()`:
      1. Call `lowerToExecIR(workflow)` from lowering compiler
      2. Create OpenAI provider (or mock if no API key)
      3. Create runner via `createRunner(provider)`
      4. Call `runner.execute(program, input)`
      5. Return ExecutionResult
    - Implement `subscribeToExecution()`:
      - Returns unsubscribe function
      - Bridges runtime events to caller
    - Handle missing API key: if `import.meta.env.VITE_OPENAI_API_KEY` is not set, throw clear error before execution
  - Create Zustand execution store in `apps/src/features/editor/executionStore.ts`:
    - Bridges runtime events to React UI
    - State: `executionStatus`, `currentNodeId`, `nodeStatuses: Map<string, NodeExecutionStatus>`, `stateSnapshot`, `events: ExecutionEvent[]`, `modelCalls: ModelCallLog[]`
    - Actions: `startExecution(workflow)`, `abort()`, subscribes to PlatformAdapter execution events
  - Write tests for WebPlatformAdapter.executeWorkflow() integration

  **Must NOT do**:
  - Modify existing PlatformAdapter methods (only ADD new ones)
  - Import `openai` directly in web-adapter (use the LlmProvider interface)
  - Store execution results persistently

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration wiring, Zustand store creation, interface extension. Moderate complexity.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 8)
  - **Blocks**: Tasks 10, 11
  - **Blocked By**: Task 8 (needs Runner)

  **References**:

  **Pattern References**:
  - `apps/src/services/platform-adapter.ts:1-30` — Existing PlatformAdapter interface. Add `executeWorkflow()` following the same pattern.
  - `apps/src/services/web-adapter.ts:1-57` — Existing WebPlatformAdapter. Follow same patterns for new method implementation.
  - `apps/src/features/editor/workflowStore.ts:1-105` — Existing Zustand store pattern. Follow for executionStore.

  **WHY Each Reference Matters**:
  - `platform-adapter.ts` → The interface is the integration seam. New methods must fit the existing pattern.
  - `web-adapter.ts` → Shows how to wire core logic into the adapter layer.
  - `workflowStore.ts` → Zustand store pattern for the execution store.

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/services/web-adapter-execute.test.ts`
  - [x] Tests: executeWorkflow() calls lowering + runner + returns result
  - [x] Tests: Missing API key → clear error before execution starts
  - [x] Tests: executionStore tracks status transitions correctly
  - [x] `npx vitest run src/services/web-adapter-execute.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: WebPlatformAdapter executes workflow end-to-end
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/services/web-adapter-execute.test.ts --reporter=verbose
      2. Assert: Lowering + execution + result capture all work together
    Expected Result: Full adapter integration works
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `feat: wire execution pipeline into PlatformAdapter and Zustand store`
  - Files: `src/services/platform-adapter.ts`, `src/services/web-adapter.ts`, `src/features/editor/executionStore.ts`, tests
  - Pre-commit: `npx vitest run src/services/`

---

- [x] 10. Execution Debug Panel UI

  **What to do**:
  - Create `apps/src/features/editor/execution/` directory with:
    - `ExecutionPanel.tsx`: Main container panel (side panel or bottom panel in editor layout)
      - Shows when execution is active or has results
      - Contains sub-components: ExecutionLog, StateInspector, ModelCallsLog
      - Subscribes to executionStore for live updates
    - `ExecutionLog.tsx`: Ordered list of execution events
      - Each event: timestamp, op type, node ID, status badge (pending/running/completed/failed/skipped)
      - Color-coded: green=completed, red=failed, yellow=running, gray=skipped
    - `StateInspector.tsx`: JSON tree viewer showing `$vars`, `$tmp`, `$ctx` contents
      - Updates live as execution progresses
      - Expandable/collapsible tree nodes
      - Highlight recently-changed values
    - `ModelCallsLog.tsx`: List of LLM API calls
      - Each call: model used, prompt summary, response summary, token usage, validation result
      - Repair attempts shown as sub-items under their parent call
    - `ExecutionControls.tsx`: Run/Stop buttons
      - "Run" button triggers `executionStore.startExecution(workflow)`
      - "Stop" button triggers `executionStore.abort()`
      - Disabled states based on execution status
  - Update `apps/src/features/editor/EditorPage.tsx`:
    - Add ExecutionPanel to editor layout (resizable side panel)
    - Add node highlighting: active node gets `executing` CSS class, completed gets `completed` class, failed gets `failed` class
    - Wire node status from executionStore to React Flow node styling
  - Add CSS styles for execution states (node glow/border colors)
  - Write component tests for ExecutionPanel, ExecutionLog, StateInspector

  **Must NOT do**:
  - Import `core/runtime/` directly in UI components (go through executionStore)
  - Build step-by-step debugging (pause/resume/step) — defer to v2
  - Build validation detail panel — defer to v2
  - Build persistent execution history viewer — defer to v2

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component creation, CSS styling, layout integration, real-time updates. This is the only UI task in the plan.
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Designing the execution panel layout, state inspector tree, color coding, responsive design
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for component tests (using testing-library)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (after Task 9)
  - **Blocks**: Task 11
  - **Blocked By**: Task 9 (needs executionStore)

  **References**:

  **Pattern References**:
  - `apps/src/features/editor/EditorPage.tsx` — Existing editor page layout. Add execution panel as sibling to canvas.
  - `apps/src/features/editor/CompilePreviewDialog.tsx:1-56` — Existing Radix UI Dialog pattern. May inform panel styling.
  - `apps/src/features/editor/workflowStore.ts:1-105` — Zustand store consumption pattern in editor components.
  - `apps/src/features/editor/GenericWorkflowNode.tsx` — Existing node component. Add CSS classes for execution state.
  - `apps/src/features/editor/WorkflowCanvas.tsx` — Canvas component. Wire node status styling here.

  **WHY Each Reference Matters**:
  - `EditorPage.tsx` → Layout integration point. The execution panel goes here.
  - `GenericWorkflowNode.tsx` → Node highlighting (executing/completed/failed CSS classes) applied here.
  - `WorkflowCanvas.tsx` → Canvas-level integration for node status coloring.

  **Acceptance Criteria**:

  **TDD:**
  - [x] Test file: `apps/src/features/editor/execution/ExecutionPanel.test.tsx`
  - [x] Tests: ExecutionPanel renders without errors
  - [x] Tests: ExecutionLog shows events in order
  - [x] Tests: StateInspector renders state tree
  - [x] Tests: Run button triggers execution, Stop button aborts
  - [x] `npx vitest run src/features/editor/execution/` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Execution panel renders in editor
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running on localhost:5173
    Steps:
      1. Navigate to: http://localhost:5173/editor
      2. Wait for: canvas visible (timeout: 5s)
      3. Assert: ExecutionPanel container exists in DOM
      4. Assert: Run button is visible and enabled
      5. Screenshot: .sisyphus/evidence/task-10-panel-render.png
    Expected Result: Execution panel renders in editor layout
    Evidence: .sisyphus/evidence/task-10-panel-render.png

  Scenario: Node highlighting works during execution
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, workflow with start→prompt→end nodes on canvas
    Steps:
      1. Navigate to: http://localhost:5173/editor
      2. Click: Run button
      3. Wait for: node with class "executing" visible (timeout: 5s)
      4. Wait for: execution complete (all nodes have "completed" class, timeout: 30s)
      5. Assert: Start node has "completed" class
      6. Assert: End node has "completed" class
      7. Screenshot: .sisyphus/evidence/task-10-node-highlighting.png
    Expected Result: Nodes visually indicate execution state
    Evidence: .sisyphus/evidence/task-10-node-highlighting.png
  ```

  **Commit**: YES
  - Message: `feat(editor): add execution debug panel with live state inspection`
  - Files: `src/features/editor/execution/*.tsx`, `src/features/editor/EditorPage.tsx` (modified), `src/features/editor/GenericWorkflowNode.tsx` (modified)
  - Pre-commit: `npx vitest run src/features/editor/`

---

- [x] 11. Full Pipeline Integration Test + Build Verification

  **What to do**:
  - Create `apps/src/core/runtime/integration.test.ts`:
    - Full pipeline test: create a WorkflowDocument manually → lower to ExecIR → execute with MockLlmProvider → verify final state
    - Test scenarios:
      1. **Linear**: start → prompt → end. Mock returns valid JSON. Assert `$vars.{promptNodeId}.result` populated.
      2. **Branching**: start → ifElse → branchA(prompt) → end, branchB(prompt) → end. Mock returns valid JSON. Assert only correct branch executed.
      3. **Tool call**: start → httpRequest → end. Mock fetch returns JSON. Assert response in state.
      4. **Validation + repair**: start → prompt → end. First mock response invalid, second valid. Assert repair was attempted.
      5. **Variable store**: start → variableStore(set) → prompt(reads var) → end. Assert variable available to prompt.
  - Run full test suite: `npm run test` (all tests pass)
  - Run build: `npm run build` (no type errors)
  - Run lint/check: `npm run check` (no format/lint issues)

  **Must NOT do**:
  - Use real OpenAI API in integration tests (MockLlmProvider only)
  - Skip any failing tests — all must pass

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Integration testing requires understanding all components together. Deep verification.
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None (final)
  - **Blocked By**: Tasks 8, 9, 10

  **References**:

  **Pattern References**:
  - `apps/src/core/workflow/integration.test.ts` — Existing integration test pattern for workflow module

  **WHY Each Reference Matters**:
  - `integration.test.ts` → Follow the same test structure for runtime integration tests

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Full pipeline integration test passes
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/runtime/integration.test.ts --reporter=verbose
      2. Assert: All 5 integration scenarios pass
    Expected Result: Complete compile→execute pipeline works
    Evidence: Test output

  Scenario: Full test suite passes
    Tool: Bash
    Preconditions: All tasks completed
    Steps:
      1. Run: npm run test (in apps/)
      2. Assert: All tests pass (0 failures)
      3. Run: npm run build
      4. Assert: Build succeeds (exit code 0)
      5. Run: npm run check
      6. Assert: No lint/format issues
    Expected Result: Entire project builds and tests cleanly
    Evidence: Terminal output for all 3 commands

  Scenario: No regressions in existing tests
    Tool: Bash (vitest)
    Steps:
      1. Run: npx vitest run src/core/compiler/pipeline.test.ts --reporter=verbose
      2. Assert: All existing compiler tests pass
      3. Run: npx vitest run src/core/workflow/ --reporter=verbose
      4. Assert: All existing workflow tests pass
    Expected Result: Zero regressions
    Evidence: Test output
  ```

  **Commit**: YES
  - Message: `test: add full pipeline integration tests for LRE runtime`
  - Files: `src/core/runtime/integration.test.ts`
  - Pre-commit: `npm run test`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(ir): add ExecIR type definitions` | core/ir/* | vitest run src/core/ir/ |
| 2 | `feat(llm): add LLM provider interface with OpenAI adapter and mock` | core/llm/*, package.json | vitest run src/core/llm/ |
| 3 | `feat(prompts): add prompt template registry with built-in templates` | core/prompts/* | vitest run src/core/prompts/ |
| 4 | `feat(compiler): add lowering compiler for 10 node types` | core/compiler/lower/* | vitest run src/core/compiler/ |
| 5 | `feat(runtime): add StateStore with namespace management` | core/runtime/state-store.*, core/runtime/types.ts | vitest run src/core/runtime/ |
| 6 | `feat(runtime): add Validator, RepairEngine, and EscalationEngine` | core/runtime/validator.*, repair.*, escalation.* | vitest run src/core/runtime/ |
| 7 | `feat(runtime): add PromptCompiler for micro-prompt generation` | core/runtime/prompt-compiler.* | vitest run src/core/runtime/ |
| 8 | `feat(runtime): add Runner graph walker with op dispatch` | core/runtime/runner.*, tool-executor.*, index.ts | vitest run src/core/runtime/ |
| 9 | `feat: wire execution pipeline into PlatformAdapter` | services/*, features/editor/executionStore.ts | vitest run src/services/ |
| 10 | `feat(editor): add execution debug panel with live state inspection` | features/editor/execution/*, EditorPage.tsx, GenericWorkflowNode.tsx | vitest run src/features/editor/ |
| 11 | `test: add full pipeline integration tests` | core/runtime/integration.test.ts | npm run test |

---

## Success Criteria

### Verification Commands
```bash
# In apps/ directory:
npm run test       # All tests pass (existing + new)
npm run build      # TypeScript compiles, Vite builds successfully
npm run check      # Biome lint + format passes
```

### Final Checklist
- [x] All "Must Have" features present
- [x] All "Must NOT Have" guardrails respected (G1-G18)
- [x] All 11 tasks have passing tests
- [x] Existing compiler/workflow tests still pass (zero regressions)
- [x] Full pipeline integration test: WorkflowDocument → ExecIR → Runner → StateStore ✓
- [x] Execution panel renders in editor with live state during execution
- [x] OpenAI adapter callable with real API key (manual verification after env setup)
