# Draft: LRE Runtime + LIR Compiler Implementation

## Requirements (confirmed)
- Build the Lattice IR (LIR) and Lattice Runtime Environment (LRE) for the standalone React app at `apps/`
- Architecture pipeline: UI WorkflowDocument → ExecIR (lowering) → LRE Runtime execution
- PlanIR is optional / deferred; ExecIR is the required executable format
- Runtime provides explicit state memory ($vars, $tmp, $ctx, $in), not LLM context memory
- Per-node micro-prompts, schema validation, repair packets, model escalation

## Technical Decisions
- **IR types**: New `core/ir/` module — shared contract between compiler and runtime
- **Lowering**: New compiler stage `core/compiler/lower/` with `LowererRegistry` keyed by UI node type
- **Runtime**: `core/runtime/` — plain classes (not Zustand), with event subscriptions for UI observability
- **LLM layer**: `core/llm/` — provider-agnostic `LLMProvider` interface + adapters
- **Prompt templates**: `core/prompts/` — static TypeScript registry with versioned IDs
- **Existing emitters preserved**: Old pipeline remains for "export to .claude/commands" etc.
- **New ExecIR emitter optional**: For debugging/portability, not required for runtime

## Research Findings
- **Oracle consultation**: Confirms separate `core/ir/`, `core/runtime/`, `core/llm/`, `core/prompts/` modules
- **Oracle on state**: Runtime-internal StateStore with subscribe(), thin Zustand adapter for UI
- **Oracle on mapping**: LowererRegistry pattern — one UI node can lower to multiple ExecIR ops
- **Oracle on MVP**: LLM_WRITE + SWITCH/when + JSON Schema validation + repair loop + event stream

## Architecture (from Oracle)
```
core/
  ir/                    ← ExecIR types (shared contract)
    exec-ir.ts
    plan-ir.ts           ← optional/deferred
    schemas.ts
  compiler/              ← existing + new lowering
    lower/               ← NEW: WorkflowDocument → ExecIR
      registry.ts        ← LowererRegistry keyed by UI node type
      lowerers/          ← per-node-type lowerers
    emitters/            ← EXISTING: export targets
    analyzer.ts          ← EXISTING
    pipeline.ts          ← EXISTING + new compileToExecIR()
  runtime/               ← NEW: LRE
    runner.ts            ← graph walker
    state-store.ts       ← $vars/$tmp/$ctx/$in
    prompt-compiler.ts   ← template → micro-prompt
    validator.ts         ← JSON Schema + invariants
    repair-engine.ts     ← repair packets + fix-only re-prompt
    escalation-engine.ts ← model class upgrade
  llm/                   ← NEW: provider-agnostic LLM
    types.ts             ← LLMProvider interface
    adapters/            ← OpenAI, Claude, Mock, Disabled
  prompts/               ← NEW: prompt templates
    registry.ts          ← PromptTemplateRegistry
    templates/           ← versioned template definitions
```

## Decisions (from user interview)
- **LLM Provider**: OpenAI API first (GPT-4o-mini as SMALL_EXEC, GPT-4o as MEDIUM_PLAN)
- **UI Observability**: YES — build execution panel with live state viewer
- **Node Coverage v1**: Extended MVP (~11 nodes: start, end, prompt, ifElse, switch, subAgent, mcp, httpRequest, variableStore, dataTransform, parallel)
- **API Key Management**: Environment variables only (via .env / Vite import.meta.env)
- **PlanIR**: Fully deferred — ExecIR types only in v1

## Additional Decisions (round 2)
- **Test Strategy**: TDD — vitest already exists, write tests first for each component
- **Execution Panel**: Full debug panel — node highlighting on canvas, state inspector, validation results, repair attempts, model calls log
- **External Calls**: Real browser fetch for MCP/HTTP nodes (subject to CORS). No mock/proxy layer.

## Additional Decisions (round 3 — Metis gap resolution)
- **SubAgent**: Single LLM call (same as prompt node, semantically distinct). NOT multi-turn or recursive.
- **Branching**: Deterministic data comparison only. evaluationTarget = $vars path, conditions = simple comparisons. No LLM in control flow.
- **Parallel**: DEFERRED to v2. Drop to 10 node types in MVP.
- **prompt node**: → LLM_WRITE op. Config prompt → instruction. Output → $vars.{nodeId}.result.
- **Data flow**: Each node writes $vars.{nodeId}.result. Downstream reads upstream nodeId. Auto-wired by lowerer from edges.
- **Repair budget**: Max 3 attempts per op execution.
- **Escalation UX**: MVP = execution fails with detailed error. No interactive escalation.
- **dataTransform**: JMESPath library, deterministic, no LLM.
- **httpRequest**: GET/POST + JSON body + URL interpolation. No auth.
- **Runtime execution**: Dynamic graph walk via edges, NOT pre-computed executionOrder.

## Final Node Coverage (10 nodes)
1. start → START op
2. end → END op
3. prompt → LLM_WRITE op
4. subAgent → LLM_WRITE op (semantically distinct)
5. ifElse → SWITCH op (2 branches, deterministic)
6. switch → SWITCH op (N branches, deterministic)
7. mcp → TOOL_CALL op
8. httpRequest → TOOL_CALL op
9. variableStore → state write/read op
10. dataTransform → PACK/deterministic transform op

## Open Questions
- (none remaining — all gaps resolved)

## Scope Boundaries
- INCLUDE: ExecIR types, lowering compiler, LRE runtime, LLM provider abstraction (OpenAI), prompt template system
- INCLUDE: Execution panel UI with live state viewer
- INCLUDE: ~11 node types in lowering coverage
- INCLUDE: Standalone React app only (apps/)
- EXCLUDE: VSCode extension integration
- EXCLUDE: PlanIR (fully deferred)
- EXCLUDE: Claude API adapter (future)
- EXCLUDE: Browser-based API key management (env vars only)
