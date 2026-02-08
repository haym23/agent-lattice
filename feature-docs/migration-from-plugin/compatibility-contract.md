# Compatibility Contract (Phase 1)

This contract defines non-negotiable compatibility targets during migration from extension architecture to standalone React app.

## 1) Workflow JSON Compatibility

Required invariants:

- Existing workflow JSON files must remain loadable without manual edits.
- Node IDs and edge IDs must remain stable after load/save roundtrip.
- Existing node types in `src/shared/types/workflow-definition.ts` must deserialize without loss.
- Unknown/forward-compatible fields must be preserved where feasible.

Allowed deviations:

- Additional metadata fields may be added if they do not break prior readers.
- Internal persistence backend can change (filesystem -> IndexedDB), but import/export behavior must be equivalent.

## 2) `.claude` Export Parity

Required invariants:

- Existing `.claude` export output semantics are preserved for reference workflows.
- Frontmatter keys and markdown structure remain compatible with current execution usage.
- Existing branch/flow semantics produce equivalent command behavior.

Allowed deviations:

- Cosmetic formatting differences (whitespace/order) allowed if semantic output is equivalent.

## 3) User-visible Core Editor Behavior

Required invariants:

- Users can create, edit, connect, and delete nodes/edges.
- Users can save/load workflows in standalone app.
- Users can export workflows to `.claude` artifacts from standalone app.

Allowed deviations:

- Visual style updates are allowed in Phase 1 as long as functional behavior is preserved.

## 4) Migration Safety Rules

- Do not remove existing extension implementation during Phase 1.
- Build standalone in parallel path until exit criteria X001-X006 pass.
- If parity fails for baseline workflows, block milestone completion until resolved.
