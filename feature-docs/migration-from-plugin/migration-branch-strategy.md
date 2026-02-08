# Migration Branch Strategy

## Branch Model

- `main`: existing extension-first product line
- `migration/standalone-phase1`: integration branch for Phase 1 tasks
- feature branches: `migration/m###-<short-topic>`

Examples:

- `migration/m010-standalone-scaffold`
- `migration/m030-indexeddb-repository`
- `migration/m040-compiler-pipeline`

## Milestone Tags

- `migration-phase1-m0`
- `migration-phase1-m1`
- `migration-phase1-m2`
- `migration-phase1-m3`
- `migration-phase1-m4`
- `migration-phase1-m5`
- `migration-phase1-m6`

## Rollback Checkpoints

Rollback is always to the last milestone tag from `migration/standalone-phase1`.

1. Create milestone tag only after checks pass:
   - `npm run format`
   - `npm run lint`
   - `npm run check`
   - `npm run build`
   - `npm run test`
2. If a milestone regresses parity, revert to previous milestone tag and re-apply feature branches incrementally.

## Safety Rules

- Do not force-push shared migration branches.
- Keep extension runtime path buildable during Phase 1.
- Merge by milestone order only (M0 -> M6).
