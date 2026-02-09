# Baseline Behavior Checklist (Extension)

Purpose: capture known-good behavior in the current VSCode extension before standalone migration work.

## Scope

- Save workflow to `.vscode/workflows/*.json`
- Load workflow from workspace list
- Export workflow to `.claude` artifacts
- Canvas interactions (add/move/connect/delete/select)
- AI refine workflow smoke flow

## Test Workflows

1. `baseline-minimal.json`
   - Nodes: Start -> SubAgent -> End
2. `baseline-branching.json`
   - Nodes: Start -> IfElse -> SubAgent(A/B) -> End
3. `baseline-integration.json`
   - Nodes: Start -> Prompt -> Skill/MCP -> End

## Validation Rubric

### Save/Load

- [ ] Save creates/updates JSON under `.vscode/workflows/`
- [ ] Load list includes newly saved workflow
- [ ] Loaded graph matches node/edge count and key node config values

### Export

- [ ] Export produces command/agent outputs in `.claude/commands/` and `.claude/agents/` as applicable
- [ ] Exported files are non-empty and parseable as markdown/frontmatter where expected

### Canvas Interactions

- [ ] Add node from palette
- [ ] Move node persists position in state
- [ ] Connect valid edge
- [ ] Prevent invalid connections per rules
- [ ] Delete node removes related edges

### AI Refine Smoke

- [ ] Refinement request can be submitted
- [ ] Progress messages stream to UI
- [ ] Success result updates workflow graph

## Notes

- This checklist is the parity baseline for Phase 1 migration verification.
- If behavior differs in standalone, classify as: intended change vs regression.
