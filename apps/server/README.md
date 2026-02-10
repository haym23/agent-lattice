# @lattice/server

This app provides the backend execution and streaming layer for workflow transparency.

## What this part of the repo does

- Hosts a Fastify server for running workflows.
- Starts workflow runs through an HTTP API.
- Streams structured execution events over Server-Sent Events (SSE).
- Supports short in-memory replay on reconnect using sequence-based resume.
- Applies redaction-by-default for UI-facing sensitive payload areas.
- Includes mapping helpers for converting AI SDK-style events into the shared workflow event model.

## Endpoints

- `GET /health`
  - Basic health check.
- `POST /runs`
  - Starts a run from a workflow payload.
  - Returns `{ "runId": "..." }`.
- `GET /runs/:runId/events`
  - Streams `text/event-stream` events for a run.
  - SSE framing includes `id`, `event`, and `data`.
  - Accepts `lastSeq` query param (or `Last-Event-ID`) to replay missed buffered events.

## Event model

The server uses the unified event envelope from `@lattice/runtime`:

- `eventVersion`
- `runId`
- `seq` (monotonic sequence)
- `timestamp`
- `type`
- `payload`

The stream includes run/stage/tool/LLM/breadcrumb event types, and redaction metadata where applicable.

## Key files

- `src/index.ts` - server entrypoint
- `src/app.ts` - Fastify app and routes
- `src/run-manager.ts` - run lifecycle, event buffering, subscriber fan-out, SSE framing
- `src/ai-sdk-event-mapper.ts` - adapter layer for mapping AI SDK-style events into unified events

## Scripts

- `pnpm --filter @lattice/server dev` - run in watch mode (loads `.env`)
- `pnpm --filter @lattice/server start` - start server once (loads `.env`)
- `pnpm --filter @lattice/server build` - compile TypeScript
- `pnpm --filter @lattice/server typecheck` - type checking
- `pnpm --filter @lattice/server test` - run server tests

Both `dev` and `start` use Node `--env-file=.env`, so variables in `apps/server/.env` are available at runtime.

## Current scope and boundaries (v1)

- Uses in-memory buffering only (no durable event store yet).
- Internal/dev-oriented API surface (no production auth stack yet).
- Focused on correctness and event transparency for runtime and web consumers.
