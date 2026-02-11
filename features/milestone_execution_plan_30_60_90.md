# Agent Lattice Milestone Execution Plan (30/60/90)

This plan translates roadmap priorities into concrete, testable work.

Use this file as the execution board for implementation.

## 30-Day Milestone: Stabilize Core

### Objective

Ship a real execution path with durable event replay, then remove workflow persistence UX friction.

### Epic 30-P0-1: Real Provider Execution Path

Owner: Backend/Runtime  
Priority: P0

- [x] Define provider-selection contract (`env`, fallback behavior, explicit errors).
- [x] Replace local stub provider in server run path with real provider wiring.
- [x] Route provider events through AI SDK mapping pipeline.
- [x] Populate real usage fields (`modelUsed`, `promptTokens`, `completionTokens`) in event payloads.
- [x] Map provider failures to canonical workflow events (timeout, auth, rate limit, malformed output).
- [x] Add integration test for end-to-end real-provider execution (mocked network allowed in CI).

Done when:

- [x] End-to-end run uses real provider path.
- [x] Streamed LLM events contain non-placeholder usage values.

---

### Epic 30-P0-2: Durable Event Store + Replay

Owner: Backend/Infra  
Priority: P0

- [ ] Select storage backend (SQLite local-first or Postgres shared env).
- [ ] Define schema for run events (`runId`, `seq`, `timestamp`, `type`, `payload`, redaction metadata).
- [ ] Add indexes for replay-critical queries (`runId`, `seq`, `timestamp`).
- [ ] Persist each emitted event before SSE fan-out.
- [ ] Implement replay query (`seq > lastSeq ORDER BY seq ASC`).
- [ ] Add run metadata persistence (`status`, `startedAt`, `endedAt`, `error`).
- [ ] Implement restart-time recovery for replay and run lookup.
- [ ] Add retention policy and pruning job for stale events.

Done when:

- [ ] Server restart does not break replay continuity.
- [ ] Reconnect from `lastSeq` replays deterministically.

---

### Epic 30-P0-3: SSE Correctness Hardening

Owner: Backend/Runtime  
Priority: P0

- [ ] Enforce monotonic sequence validation for streamed events.
- [ ] Standardize SSE frame format (`id`, `event`, `data`) across all event types.
- [ ] Handle listener cleanup on disconnect to prevent leaks.
- [ ] Add bounded buffering for slow subscribers.
- [ ] Add integration tests for live stream, replay stream, reconnect, and missing run IDs.
- [ ] Add burst test to verify ordered delivery under high event volume.

Done when:

- [ ] SSE integration suite passes for reconnect + burst scenarios.
- [ ] No duplicate or out-of-order events under test load.

---

### Epic 30-P0-4: Workflow Save/Load UX Reliability

Owner: Web/Frontend  
Priority: P0

- [ ] Define persistence semantics: `Save` updates existing ID; `Save As` creates new ID.
- [ ] Add workflow name normalization and collision handling rules.
- [ ] Clarify action controls (`Save`, `Save As`, `Refresh`, `Load`) and helper text.
- [ ] Add visible status states (`dirty`, `saving`, `saved`, `load failed`).
- [ ] Prevent duplicate entries in workflow list.
- [ ] Ensure `Refresh` and `Load` semantics are explicit and non-overlapping.
- [ ] Add tests for duplicate prevention, stale list refresh, selected workflow load behavior.

Done when:

- [ ] Issues in `bugs/apps_web_workflow_loading_issues.md` are reproducibly resolved.
- [ ] Persistence behavior is deterministic across refresh and reload.

---

### Epic 30-P1-1: Security Baseline (Minimum Guardrails)

Owner: Security + Runtime  
Priority: P1

- [ ] Define node-level permission model (default deny; explicit allow).
- [ ] Enforce tool allow-list at runtime execution boundary.
- [ ] Add prompt-injection boundary checks for tool inputs and outputs.
- [ ] Standardize and enforce redaction policy for sensitive event payload fields.
- [ ] Add tests for blocked unsafe calls and sensitive-field redaction.

Done when:

- [ ] Unsafe tool execution fails closed with explicit errors.
- [ ] Security regression tests pass in CI.

---

### Epic 30-P1-2: Foundation Ops Readiness

Owner: Platform/DevEx  
Priority: P1

- [ ] Write operator runbook (provider config, event store config, replay troubleshooting).
- [ ] Add CI integration job for server flow (execution + persistence + SSE replay).
- [ ] Instrument baseline metrics (run started/completed/failed, replay served, reconnect count).
- [ ] Add quick diagnostic script/checklist for run-debug triage.

Done when:

- [ ] Team can stand up and diagnose core flow from docs alone.

---

### 30-Day Exit Criteria

- [ ] Real provider execution path is live.
- [ ] Durable replay survives server restart.
- [ ] SSE reconnect correctness is verified.
- [ ] Workflow save/load UX regressions are closed.
- [ ] Baseline security guardrails are enforced.

## 60-Day Milestone: Complete Core Semantics

### Objective

Reach full node/compiler/runtime coverage, deterministic lifecycle behavior, and first production-grade target integrations.

### Epic 60-P0-1: Full Node Execution Coverage

Owner: Compiler + Runtime  
Priority: P0

- [ ] Build node coverage matrix (`catalog -> lowerer -> runtime op -> tests`).
- [ ] Implement missing lowerers for active production node types.
- [ ] Implement missing runtime handlers for active production node types.
- [ ] Add compile-time validation for unsupported config combinations.
- [ ] Add migration support for legacy workflow documents where required.
- [ ] Add coverage tests for each node type (compile + execute).

Done when:

- [ ] Every production node compiles and executes without feature gaps.

---

### Epic 60-P0-2: Validation + Repair Completeness

Owner: Runtime  
Priority: P0

- [ ] Define schema contract for each LLM-emitting node.
- [ ] Add invariant validators (cross-field, enum, required output).
- [ ] Standardize repair packet format.
- [ ] Implement deterministic retry strategy with bounded attempts.
- [ ] Emit repair breadcrumbs for observability.
- [ ] Add failure-path tests (invalid output, repair success, repair exhaustion).

Done when:

- [ ] Validation failures consistently route through repair policy.

---

### Epic 60-P0-3: Temporal-Style Lifecycle Semantics

Owner: Backend/Runtime  
Priority: P0

- [ ] Define formal run state machine (`queued`, `running`, `completed`, `failed`, `cancelled`).
- [ ] Persist stage-level checkpoints.
- [ ] Implement deterministic retry transitions and retry ceilings.
- [ ] Persist terminal summary with cause provenance.
- [ ] Add lifecycle conformance tests (allowed and disallowed transitions).

Done when:

- [ ] Run lifecycle transitions are deterministic and auditable.

---

### Epic 60-P1-1: Export + Launch MVP (Claude + Codex)

Owner: Compiler + Web  
Priority: P1

- [ ] Freeze emitter output contract for Claude and Codex targets.
- [ ] Add snapshot tests for emitter output compatibility.
- [ ] Build UI flow for export + launch actions.
- [ ] Add model-target mismatch warnings in UI.
- [ ] Add smoke tests for generated artifact validity.

Done when:

- [ ] One-click export and launch works for Claude and Codex.

---

### Epic 60-P1-2: High-Utility Node Expansion

Owner: Web + Runtime  
Priority: P1

- [ ] Implement `httpRequest` node end-to-end.
- [ ] Implement `variableStore` node end-to-end.
- [ ] Implement `dataTransform` node end-to-end.
- [ ] Implement one trigger node (`webhook` or `schedule`) end-to-end.
- [ ] Add schema-backed config editors for each.
- [ ] Add compile/runtime tests for each node.

Done when:

- [ ] At least 6 practical non-LLM nodes are production-usable.

---

### Epic 60-P1-3: Execution Transparency UX

Owner: Web/Frontend  
Priority: P1

- [ ] Surface analyzer warnings (cycles, unreachable nodes) on canvas.
- [ ] Map stage statuses to node UI states (running/completed/failed/skipped).
- [ ] Add concise remediation hints tied to known failure classes.
- [ ] Add tests for status rendering and warning visibility.

Done when:

- [ ] Users can diagnose common failures without raw logs.

---

### 60-Day Exit Criteria

- [ ] Full production node coverage in compiler/runtime.
- [ ] Validation + repair behavior is deterministic.
- [ ] Lifecycle semantics are formalized and tested.
- [ ] Claude + Codex export/launch path is stable.

## 90-Day Milestone: Scale + Launch Readiness

### Objective

Expand target integrations, harden operations to SLOs, and ship advanced orchestration features safely.

### Epic 90-P0-1: Four-Target Integration Parity

Owner: Compiler + Platform  
Priority: P0

- [ ] Extend emitter contract to OpenCode and Copilot targets.
- [ ] Add snapshot tests for all four targets (Claude, Codex, OpenCode, Copilot).
- [ ] Add compatibility checks for generated artifact structure.
- [ ] Add docs for per-target requirements and limitations.

Done when:

- [ ] Four-target export matrix passes CI.

---

### Epic 90-P0-2: Production SLO Hardening

Owner: Infra + Backend  
Priority: P0

- [ ] Define SLOs (success rate, p95 latency, replay reliability).
- [ ] Instrument metrics and traces per run/stage/tool/model call.
- [ ] Configure alerting for failure spikes, replay gaps, and provider error surge.
- [ ] Run game-day drills (provider outage, DB outage, SSE churn).
- [ ] Document incident response and rollback playbooks.

Done when:

- [ ] SLO dashboards and alerts are live and validated in drills.

---

### Epic 90-P1-1: Parallel Orchestration + Deterministic Join

Owner: Runtime + Compiler  
Priority: P1

- [ ] Implement parallel branch execution semantics.
- [ ] Define deterministic merge/join conflict policy.
- [ ] Add compile-time guardrails for unsafe fan-in.
- [ ] Add reproducibility tests for parallel path outcomes.

Done when:

- [ ] Parallel workflows execute with deterministic end state.

---

### Epic 90-P1-2: Security Hardening Phase 2

Owner: Security + Platform  
Priority: P1

- [ ] Add policy versioning + audit trail for permission changes.
- [ ] Enforce secret boundary rules (no secrets in workflow docs/events).
- [ ] Add adversarial tests (argument injection, schema bypass, malformed tool output).
- [ ] Add periodic policy conformance checks in CI.

Done when:

- [ ] Security hardening tests cover adversarial paths and pass.

---

### Epic 90-P1-3: Release Candidate Launch Package

Owner: Product + Eng  
Priority: P1

- [ ] Finalize quickstart and operator docs.
- [ ] Publish reference workflows and integration examples.
- [ ] Freeze release branch and run full regression suite.
- [ ] Complete release checklist and cut release candidate.

Done when:

- [ ] RC meets test gates and operational readiness criteria.

---

### 90-Day Exit Criteria

- [ ] Four-target integration parity is achieved.
- [ ] SLO and alerting posture is operational.
- [ ] Parallel orchestration is deterministic and tested.
- [ ] Release candidate is ready for controlled rollout.

## Weekly Cadence Template

- [ ] Monday: lock sprint scope and dependencies.
- [ ] Wednesday: mid-sprint risk review (blockers, slip risks, test gaps).
- [ ] Friday: exit-criteria check and demo against milestone objectives.

## Dependency Rules

- [ ] Do not scale integrations before durable execution + replay are stable.
- [ ] Do not expand node breadth before baseline permission/validation guardrails.
- [ ] Prioritize Claude/Codex path before OpenCode/Copilot expansion.
