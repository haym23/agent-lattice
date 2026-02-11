import cors from "@fastify/cors"
import Fastify, { type FastifyInstance } from "fastify"
import { RunManager, toSseFrame } from "./run-manager.js"

export function createServerApp(
  runManager = new RunManager()
): FastifyInstance {
  const app = Fastify({ logger: false })

  void app.register(cors, {
    origin: true,
  })

  app.get("/health", async () => {
    return { ok: true }
  })

  app.post("/runs", async (request, reply) => {
    const body = request.body as
      | { workflow?: Record<string, unknown>; input?: Record<string, unknown> }
      | undefined
    if (!body?.workflow || typeof body.workflow !== "object") {
      return reply.status(400).send({ error: "workflow is required" })
    }

    const runId = await runManager.startRun({
      workflow: body.workflow,
      input: body.input,
    })
    return { runId }
  })

  app.get("/runs/:runId/events", async (request, reply) => {
    const params = request.params as { runId: string }
    const query = request.query as { lastSeq?: string } | undefined
    const headerLastSeq = request.headers["last-event-id"]
    const runId = params.runId
    const rawLastSeq = query?.lastSeq ?? String(headerLastSeq ?? "0")
    const lastSeq = Number.parseInt(rawLastSeq, 10)

    const run = await runManager.getRun(runId)
    if (!run) {
      return reply.status(404).send({ error: "run not found" })
    }

    reply.raw.setHeader("Content-Type", "text/event-stream")
    reply.raw.setHeader("Cache-Control", "no-cache")
    reply.raw.setHeader("Connection", "keep-alive")
    reply.raw.flushHeaders()

    const unsubscribe = await runManager.subscribe(
      runId,
      Number.isNaN(lastSeq) ? 0 : lastSeq,
      (event) => {
        reply.raw.write(toSseFrame(event))
        if (event.type === "run.completed" || event.type === "run.failed") {
          reply.raw.end()
        }
      }
    )

    if (!unsubscribe) {
      reply.raw.write(
        `event: error\ndata: ${JSON.stringify({ error: "run not found" })}\n\n`
      )
      reply.raw.end()
      return reply
    }

    request.raw.on("close", () => {
      unsubscribe()
    })

    return reply
  })

  return app
}
