
## 2026-02-08 00:25 EST

- Aligned standalone migration implementation in `app` with the migration guide's node model direction by replacing legacy Phase 1 node taxonomy with documented workflow node types.
- Added all documented nodes from `docs/nodes/README.md` to the standalone node system, including implemented nodes (`start`, `end`, `prompt`, `subAgent`, `askUserQuestion`, `ifElse`, `switch`, `skill`, `mcp`, `flow`, `codex`, `branch`) and researched nodes (`parallel`, `httpRequest`, `dataTransform`, `delay`, `webhookTrigger`, `variableStore`, `codeExecutor`, `batchIterator`).
- Updated serialization and migration behavior to normalize legacy node types into current documented types and to validate unsupported node types.
- Expanded standalone test validations with new migration and serialization coverage, updated node catalog assertions, and refreshed compiler snapshots for the updated node naming.
- Added standalone coverage execution support via Vitest v8 coverage provider, introduced `test:coverage`, and configured baseline global coverage thresholds with text-only reporting.
