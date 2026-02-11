# Agent Lattice Milestone Plan by Team (30/60/90)

This is the team-assignment view of `features/milestone_execution_plan_30_60_90.md`.

## Backend + Runtime Team

### 30 Days

- [x] Replace stub provider path with real provider wiring in server execution.
- [x] Normalize provider failures into canonical workflow events.
- [x] Persist events before SSE fan-out.
- [x] Implement deterministic replay by `runId + seq`.
- [x] Enforce monotonic event ordering in stream path.
- [x] Add reconnect + burst SSE integration tests.

### 60 Days

- [ ] Complete runtime handlers for all production node types.
- [ ] Implement deterministic validation + repair flow for LLM nodes.
- [ ] Formalize and enforce run lifecycle state machine.
- [ ] Persist stage checkpoints and terminal run summaries.

### 90 Days

- [ ] Implement parallel branch execution semantics.
- [ ] Implement deterministic join/merge conflict policy.
- [ ] Add reproducibility tests for parallel execution paths.

## Compiler Team

### 30 Days

- [ ] Align event schema assumptions with backend lifecycle model.
- [ ] Add compatibility checks for provider event payload expectations.

### 60 Days

- [ ] Build node coverage matrix (`catalog -> lowerer -> runtime op -> tests`).
- [ ] Implement missing lowerers for active node types.
- [ ] Add compile-time validation for unsupported config combinations.
- [ ] Freeze emitter contract for Claude + Codex.
- [ ] Add emitter snapshot tests for contract stability.

### 90 Days

- [ ] Extend emitters for OpenCode + Copilot.
- [ ] Add four-target snapshot/contract matrix in CI.
- [ ] Add compile-time guardrails for unsafe fan-in in parallel flows.

## Web + Frontend Team

### 30 Days

- [x] Define deterministic `Save` vs `Save As` behavior.
- [x] Fix duplicate workflow entries in saved list.
- [x] Clarify `Refresh` vs `Load` behavior in header controls.
- [x] Add explicit persistence state badges (`dirty/saving/saved/load failed`).
- [x] Add tests for save/load/refresh semantics and collision handling.

### 60 Days

- [ ] Surface compiler analyzer warnings (cycles/unreachable) in canvas UX.
- [ ] Map execution status to node visuals (running/completed/failed/skipped).
- [ ] Add concise remediation hints for common failures.
- [ ] Implement/export launch UX for Claude + Codex.
- [ ] Ship schema-backed config editors for high-utility new nodes.

### 90 Days

- [ ] Extend export UX to OpenCode + Copilot.
- [ ] Add target-specific validation messages and docs links in UI.
- [ ] Finalize launch-ready workflows gallery and guided templates.

## Security Team

### 30 Days

- [ ] Define node-level least-privilege permission model.
- [ ] Enforce runtime tool allow-list policy.
- [ ] Add prompt-injection boundary checks at tool I/O boundaries.
- [ ] Standardize sensitive payload redaction policy.
- [ ] Add baseline adversarial tests for unsafe tool escalation.

### 60 Days

- [ ] Expand validator policy checks for cross-field and output-contract abuse.
- [ ] Add CI security regression suite for permission/redaction behavior.
- [ ] Review new node types for privilege and data exposure risks.

### 90 Days

- [ ] Add permission-policy versioning and audit trail.
- [ ] Enforce secret-boundary rules (no secrets in workflow docs/events).
- [ ] Add adversarial fuzz tests (schema bypass, arg injection, malformed outputs).

## Infra + DevEx Team

### 30 Days

- [ ] Select and provision event store backend.
- [ ] Add CI integration job for execution + persistence + replay path.
- [ ] Add baseline metrics (run status counts, replay served, reconnect count).
- [ ] Publish operator runbook for setup and replay troubleshooting.

### 60 Days

- [ ] Add migration tooling for run/event schema evolution.
- [ ] Add environment validation checks for provider/store config.
- [ ] Add release-gate checks for lifecycle/replay integration tests.

### 90 Days

- [ ] Define and publish SLOs (success rate, p95 latency, replay reliability).
- [ ] Add alerts for provider failures, replay gaps, and SSE churn spikes.
- [ ] Run and document game-day drills (provider outage, DB outage, stream churn).
- [ ] Finalize incident response + rollback playbooks.

## Product + Program Team

### 30 Days

- [ ] Lock 30-day scope and dependencies in weekly sprint planning.
- [ ] Enforce Friday exit-criteria review for each P0 epic.

### 60 Days

- [ ] Prioritize node expansion backlog by user value and risk.
- [ ] Validate Claude + Codex launch path against target user workflows.

### 90 Days

- [ ] Freeze release candidate checklist.
- [ ] Gate rollout on SLO + regression + security sign-off.
- [ ] Plan controlled rollout with explicit rollback thresholds.

## Cross-Team Handoff Gates

- [ ] Gate A: Backend replay stability before frontend execution polish work.
- [ ] Gate B: Security baseline before broad node expansion.
- [ ] Gate C: Claude/Codex contract freeze before OpenCode/Copilot expansion.
- [ ] Gate D: SLO + alert readiness before release candidate freeze.
