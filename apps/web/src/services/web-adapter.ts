import type { CompileOutput, CompilerTarget } from "@lattice/compiler"
import {
  compileWorkflow as compileForEmitter,
  lowerToExecIR,
} from "@lattice/compiler"
import type { LlmWriteExecNode } from "@lattice/ir"
import { createDefaultPromptRegistry } from "@lattice/prompts"
import type {
  ExecutionEvent,
  ExecutionResult,
  WorkflowStreamEventType,
} from "@lattice/runtime"
import { PromptCompiler } from "@lattice/runtime"
import { IndexedDbWorkflowRepository } from "../adapters/persistence/indexeddbWorkflowRepository"
import { ModelRegistry } from "../core/models/registry"
import type { ModelDefinition } from "../core/models/types"
import type { WorkflowDocument } from "../core/workflow/types"
import type {
  ExecutionListener,
  McpToolSchema,
  PlatformAdapter,
} from "./platform-adapter"

const TERMINAL_EVENT_TYPES = new Set<WorkflowStreamEventType>([
  "run.waiting",
  "run.completed",
  "run.failed",
])

const WORKFLOW_STREAM_EVENT_TYPES: WorkflowStreamEventType[] = [
  "run.started",
  "run.waiting",
  "run.completed",
  "run.failed",
  "stage.started",
  "stage.completed",
  "stage.failed",
  "tool.called",
  "tool.result",
  "tool.failed",
  "llm.step.started",
  "llm.step.completed",
  "llm.step.failed",
  "trace.breadcrumb",
]

const DEFAULT_STATE = {
  $vars: {},
  $tmp: {},
  $ctx: {},
  $in: {},
}

interface EventSourceLike {
  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void
  ): void
  close(): void
  onerror: ((event: Event) => void) | null
}

interface WebPlatformAdapterOptions {
  serverBaseUrl?: string
  fetchImpl?: typeof fetch
  eventSourceFactory?: (url: string) => EventSourceLike
}

/**
 * Reads the server API URL from Vite environment variables.
 */
function readServerBaseUrlFromEnv(): string | undefined {
  const meta = import.meta as unknown as {
    env?: Record<string, string | undefined>
  }
  return meta.env?.VITE_SERVER_BASE_URL
}

function normalizeServerBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

function createDefaultEventSource(url: string): EventSourceLike {
  return new EventSource(url)
}

/**
 * Provides web platform adapter behavior.
 */
export class WebPlatformAdapter implements PlatformAdapter {
  private readonly repository = new IndexedDbWorkflowRepository()
  private readonly modelRegistry = new ModelRegistry()
  private readonly listeners = new Set<ExecutionListener>()
  private readonly serverBaseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly eventSourceFactory: (url: string) => EventSourceLike

  constructor(options: WebPlatformAdapterOptions = {}) {
    this.serverBaseUrl = normalizeServerBaseUrl(
      options.serverBaseUrl ??
      readServerBaseUrlFromEnv() ??
      "http://localhost:8787"
    )
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
    this.eventSourceFactory =
      options.eventSourceFactory ?? createDefaultEventSource
  }

  async saveWorkflow(id: string, data: WorkflowDocument): Promise<void> {
    await this.repository.save({
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    })
  }

  async loadWorkflow(id: string): Promise<WorkflowDocument | null> {
    return this.repository.load(id)
  }

  async listWorkflows(): Promise<WorkflowDocument[]> {
    return this.repository.list()
  }

  async deleteWorkflow(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async compileWorkflow(
    workflow: WorkflowDocument,
    modelId: string,
    target: string
  ): Promise<CompileOutput> {
    const model = this.modelRegistry.get(modelId)
    const compiled = compileForEmitter({
      workflow,
      model,
      target: target as CompilerTarget,
    })
    const runtimePromptFile = this.buildRuntimePromptPreviewFile(workflow)
    if (!runtimePromptFile) {
      return compiled
    }

    return {
      ...compiled,
      files: [...compiled.files, runtimePromptFile],
      preview: `${compiled.preview}\n\n---\n\n${runtimePromptFile.content}`,
    }
  }

  async generateWorkflow(
    _prompt: string,
    _model: string
  ): Promise<WorkflowDocument> {
    throw new Error(
      "AI generation requires an API key. Configure in Settings (Phase 2)."
    )
  }

  async refineWorkflow(
    _workflow: WorkflowDocument,
    _instruction: string
  ): Promise<WorkflowDocument> {
    throw new Error(
      "AI refinement requires an API key. Configure in Settings (Phase 2)."
    )
  }

  async executeWorkflow(
    workflow: WorkflowDocument,
    input: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const runResponse = await this.fetchImpl(`${this.serverBaseUrl}/runs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ workflow, input }),
    })

    if (!runResponse.ok) {
      const failure = (await runResponse
        .json()
        .catch(() => ({ error: "Failed to start workflow run" }))) as {
          error?: string
        }
      throw new Error(failure.error ?? "Failed to start workflow run")
    }

    const startPayload = (await runResponse.json()) as { runId: string }
    return this.streamRunEvents(startPayload.runId)
  }

  subscribeToExecution(listener: ExecutionListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  listModels(): ModelDefinition[] {
    return this.modelRegistry.list()
  }

  async discoverMcpTools(): Promise<McpToolSchema[]> {
    return []
  }

  private emit(event: ExecutionEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }

  private streamRunEvents(runId: string): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
      const eventSource = this.eventSourceFactory(
        `${this.serverBaseUrl}/runs/${runId}/events`
      )
      const events: ExecutionEvent[] = []

      const handleEvent = (messageEvent: MessageEvent<string>) => {
        let event: ExecutionEvent
        try {
          event = JSON.parse(messageEvent.data) as ExecutionEvent
        } catch {
          eventSource.close()
          reject(new Error("Received malformed SSE event payload from server"))
          return
        }
        events.push(event)
        this.emit(event)

        if (!TERMINAL_EVENT_TYPES.has(event.type)) {
          return
        }

        eventSource.close()
        resolve({
          status:
            event.type === "run.completed"
              ? "completed"
              : event.type === "run.waiting"
                ? "waiting"
                : "failed",
          runId,
          finalState: DEFAULT_STATE,
          events: [...events].sort((left, right) => left.seq - right.seq),
          error:
            event.type === "run.failed"
              ? new Error(
                "error" in event.payload
                  ? event.payload.error
                  : "Workflow run failed"
              )
              : undefined,
        })
      }

      for (const eventType of WORKFLOW_STREAM_EVENT_TYPES) {
        eventSource.addEventListener(eventType, handleEvent)
      }

      eventSource.onerror = () => {
        eventSource.close()
        reject(
          new Error("SSE connection failed while streaming workflow events")
        )
      }
    })
  }

  private buildRuntimePromptPreviewFile(
    workflow: WorkflowDocument
  ): { path: string; content: string } | null {
    const program = lowerToExecIR(workflow)
    const llmNodes = program.nodes.filter(
      (node): node is LlmWriteExecNode => node.op === "LLM_WRITE"
    )
    if (llmNodes.length === 0) {
      return null
    }

    const compiler = new PromptCompiler(createDefaultPromptRegistry())
    const steps = llmNodes.map((node, index) => {
      const request = compiler.compile(
        node,
        { ...(node.inputs ?? {}) },
        {
          $vars: {},
          $tmp: {},
          $ctx: { mode: "compile-preview" },
          $in: {},
        }
      )
      const schema =
        typeof node.output_schema === "string"
          ? node.output_schema
          : JSON.stringify(node.output_schema, null, 2)
      return {
        index,
        id: node.id,
        system: request.messages[0]?.content ?? "",
        user: request.messages[1]?.content ?? "",
        schema,
      }
    })

    const mergedSystem = [
      "You are executing a multi-step workflow.",
      "Follow the steps in the order provided.",
      "Within each step, system instructions override user instructions.",
      "Return a single JSON object with keys equal to each step id.",
      "Each value must strictly match the schema for that step.",
      "Output JSON only with no additional prose or markdown.",
    ].join("\n")

    const mergedUser = [
      "<steps>",
      ...steps.map((step) =>
        [
          `<step id="${step.id}" index="${step.index + 1}">`,
          "<system>",
          step.system,
          "</system>",
          "<user>",
          step.user,
          "</user>",
          "<schema>",
          step.schema,
          "</schema>",
          "</step>",
        ].join("\n")
      ),
      "</steps>",
      "",
      "Return a single JSON object keyed by step id in the same order.",
    ].join("\n")

    return {
      path: ".debug/runtime-prompts.md",
      content: [
        "# Runtime Prompt Preview",
        "",
        "## System Prompt",
        "```text",
        mergedSystem,
        "```",
        "",
        "## User Prompt",
        "```text",
        mergedUser,
        "```",
      ].join("\n"),
    }
  }
}
