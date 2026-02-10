import type { CompileOutput, CompilerTarget } from "@lattice/compiler"
import {
  compileWorkflow as compileForEmitter,
  lowerToExecIR,
} from "@lattice/compiler"
import type { LlmWriteExecNode } from "@lattice/ir"
import { MockLlmProvider, OpenAiProvider } from "@lattice/llm"
import { createDefaultPromptRegistry } from "@lattice/prompts"
import type { ExecutionEvent, ExecutionResult } from "@lattice/runtime"
import { createRunner, PromptCompiler } from "@lattice/runtime"
import { IndexedDbWorkflowRepository } from "../adapters/persistence/indexeddbWorkflowRepository"
import { ModelRegistry } from "../core/models/registry"
import type { ModelDefinition } from "../core/models/types"
import type { WorkflowDocument } from "../core/workflow/types"
import type {
  ExecutionListener,
  McpToolSchema,
  PlatformAdapter,
} from "./platform-adapter"

/**
 * Reads the OpenAI API key from Vite environment variables.
 */
function readOpenAiApiKey(): string | undefined {
  const meta = import.meta as unknown as {
    env?: Record<string, string | undefined>
  }
  return meta.env?.VITE_OPENAI_API_KEY
}

/**
 * Provides web platform adapter behavior.
 */
export class WebPlatformAdapter implements PlatformAdapter {
  private readonly repository = new IndexedDbWorkflowRepository()
  private readonly modelRegistry = new ModelRegistry()
  private readonly listeners = new Set<ExecutionListener>()

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
    const program = lowerToExecIR(workflow)
    const apiKey = readOpenAiApiKey()
    const provider = apiKey
      ? new OpenAiProvider({ apiKey })
      : new MockLlmProvider()
    const runner = createRunner(provider)
    const result = await runner.execute(
      program,
      input,
      {},
      {
        onEvent: (event) => {
          this.emit(event)
        },
      }
    )
    return result
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
    const sections = llmNodes.map((node, index) => {
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
      return [
        `## Node ${index + 1}: ${node.id}`,
        `Template: ${node.prompt_template}`,
        `Model Class: ${request.modelClass}`,
        "",
        "### System Prompt",
        "```text",
        request.messages[0]?.content ?? "",
        "```",
        "",
        "### User Prompt",
        "```text",
        request.messages[1]?.content ?? "",
        "```",
      ].join("\n")
    })

    return {
      path: ".debug/runtime-prompts.md",
      content: ["# Runtime Prompt Preview", ...sections].join("\n\n"),
    }
  }
}
