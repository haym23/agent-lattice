import type { ExecProgram } from "@lattice/ir"
import { describe, expect, it, vi } from "vitest"
import { MockLlmProvider } from "../llm/mock-provider"
import { createDefaultPromptRegistry } from "../prompts/registry"
import { EscalationEngine } from "./escalation-engine"
import { PromptCompiler } from "./prompt-compiler"
import { RepairEngine } from "./repair-engine"
import { Runner } from "./runner"
import { ToolExecutor } from "./tool-executor"
import { Validator } from "./validator"

function makeRunner(provider = new MockLlmProvider()): Runner {
  return new Runner({
    provider,
    promptCompiler: new PromptCompiler(createDefaultPromptRegistry()),
    validator: new Validator(),
    repairEngine: new RepairEngine(),
    escalationEngine: new EscalationEngine(),
    toolExecutor: new ToolExecutor(),
  })
}

describe("Runner", () => {
  it("executes linear workflow", async () => {
    const provider = new MockLlmProvider(() => ({
      content: '{"answer":"ok"}',
      parsed: { answer: "ok" },
      usage: { promptTokens: 1, completionTokens: 1 },
      modelUsed: "SMALL_EXEC",
    }))
    const runner = makeRunner(provider)
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "llm",
          op: "LLM_WRITE",
          model_class: "SMALL_EXEC",
          prompt_template: "prompt",
          output_schema: { type: "object" },
          validators: [{ type: "json_schema", schema: { type: "object" } }],
          outputs: { result: "$vars.llm.result" },
        },
        { id: "end", op: "END" },
      ],
      edges: [
        { from: "start", to: "llm", when: { op: "always" } },
        { from: "llm", to: "end", when: { op: "always" } },
      ],
    }
    const result = await runner.execute(program, { user_message: "hi" })
    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("llm")
  })

  it("takes correct switch branch", async () => {
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        { id: "set", op: "VAR_SET", target: "$vars.flag", value: "yes" },
        { id: "switch", op: "SWITCH" },
        { id: "yes", op: "VAR_SET", target: "$vars.branch", value: "yes" },
        { id: "no", op: "VAR_SET", target: "$vars.branch", value: "no" },
        { id: "end", op: "END" },
      ],
      edges: [
        { from: "start", to: "set", when: { op: "always" } },
        { from: "set", to: "switch", when: { op: "always" } },
        {
          from: "switch",
          to: "yes",
          when: { op: "eq", left: "$vars.flag", right: "yes" },
        },
        {
          from: "switch",
          to: "no",
          when: { op: "eq", left: "$vars.flag", right: "no" },
        },
        { from: "yes", to: "end", when: { op: "always" } },
        { from: "no", to: "end", when: { op: "always" } },
      ],
    }
    const result = await runner.execute(program)
    expect(result.finalState.$vars).toHaveProperty("branch", "yes")
  })

  it("prefers matched switch branch over default always branch", async () => {
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        { id: "set", op: "VAR_SET", target: "$vars.flag", value: "yes" },
        { id: "switch", op: "SWITCH" },
        { id: "yes", op: "VAR_SET", target: "$vars.yesTaken", value: true },
        {
          id: "default",
          op: "VAR_SET",
          target: "$vars.defaultTaken",
          value: true,
        },
        { id: "end", op: "END" },
      ],
      edges: [
        { from: "start", to: "set", when: { op: "always" } },
        { from: "set", to: "switch", when: { op: "always" } },
        {
          from: "switch",
          to: "yes",
          when: { op: "eq", left: "$vars.flag", right: "yes" },
        },
        { from: "switch", to: "default", when: { op: "always" } },
        { from: "yes", to: "end", when: { op: "always" } },
        { from: "default", to: "end", when: { op: "always" } },
      ],
    }

    const result = await runner.execute(program)
    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("yesTaken", true)
    expect(result.finalState.$vars).not.toHaveProperty("defaultTaken")
  })

  it("pauses on askUserQuestion switch and resumes with user input", async () => {
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "question",
          op: "SWITCH",
          inputs: {
            evaluationTarget: "$in.askUserQuestion.question",
            questionText: "Which path should we take?",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
        },
        { id: "yes", op: "VAR_SET", target: "$vars.branch", value: "yes" },
        { id: "no", op: "VAR_SET", target: "$vars.branch", value: "no" },
        { id: "end", op: "END" },
      ],
      edges: [
        { from: "start", to: "question", when: { op: "always" } },
        {
          from: "question",
          to: "yes",
          when: {
            op: "eq",
            left: "$in.askUserQuestion.question",
            right: "yes",
          },
        },
        { from: "question", to: "no", when: { op: "always" } },
        { from: "yes", to: "end", when: { op: "always" } },
        { from: "no", to: "end", when: { op: "always" } },
      ],
    }

    const first = await runner.execute(program)
    expect(first.status).toBe("waiting")
    expect(first.events.some((event) => event.type === "run.waiting")).toBe(
      true
    )
    expect(first.checkpoint).toBeDefined()

    const resumed = await runner.execute(
      program,
      { askUserQuestion: { question: "yes" } },
      {},
      {
        runId: first.runId,
        initialSeq: first.events.length,
        checkpoint: first.checkpoint,
      }
    )

    expect(resumed.status).toBe("completed")
    expect(resumed.finalState.$vars).toHaveProperty("branch", "yes")
  })

  it("fails when repair is exhausted", async () => {
    const provider = new MockLlmProvider(() => ({
      content: "not-json",
      usage: { promptTokens: 1, completionTokens: 1 },
      modelUsed: "SMALL_EXEC",
    }))
    const runner = makeRunner(provider)
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "llm",
          op: "LLM_WRITE",
          model_class: "SMALL_EXEC",
          prompt_template: "prompt",
          output_schema: { type: "object" },
          validators: [
            {
              type: "json_schema",
              schema: { type: "object", required: ["id"] },
            },
          ],
          retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 1 },
          outputs: { result: "$vars.llm.result" },
        },
      ],
      edges: [{ from: "start", to: "llm", when: { op: "always" } }],
    }
    const result = await runner.execute(program)
    expect(result.status).toBe("failed")
  })

  it("executes tool and transform operations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ text: async () => '{"items":[{"id":1}]}' }))
    )
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "http",
          op: "TOOL_CALL",
          tool: "http.request",
          args: { method: "GET", url: "https://example.com" },
          outputs: { result: "$vars.http.result" },
        },
        {
          id: "transform",
          op: "TRANSFORM",
          transformation: "jmespath",
          expression: "items[*].id",
          inputs: { source: "$vars.http.result" },
          outputs: { result: "$vars.ids" },
        },
        { id: "end", op: "END" },
      ],
      edges: [
        { from: "start", to: "http", when: { op: "always" } },
        { from: "http", to: "transform", when: { op: "always" } },
        { from: "transform", to: "end", when: { op: "always" } },
      ],
    }
    const result = await runner.execute(program)
    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("ids")
  })

  it("emits ordered lifecycle stream with monotonic seq", async () => {
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        { id: "end", op: "END" },
      ],
      edges: [{ from: "start", to: "end", when: { op: "always" } }],
    }

    const streamed: string[] = []
    const result = await runner.execute(
      program,
      {},
      {},
      {
        runId: "run-lifecycle",
        onEvent: (event) => {
          streamed.push(event.type)
        },
      }
    )
    await Promise.resolve()

    expect(result.events[0]?.type).toBe("run.started")
    expect(result.events.at(-1)?.type).toBe("run.completed")
    expect(result.events.every((event, index) => event.seq === index + 1)).toBe(
      true
    )
    expect(streamed).toContain("stage.started")
    expect(streamed).toContain("stage.completed")
  })

  it("emits failure path with stage.failed and run.failed", async () => {
    const runner = makeRunner()
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "tool",
          op: "TOOL_CALL",
          tool: "unsupported.tool",
          args: { apiKey: "TOP_SECRET" },
        },
      ],
      edges: [{ from: "start", to: "tool", when: { op: "always" } }],
    }

    const result = await runner.execute(program)
    expect(result.status).toBe("failed")
    expect(result.events.some((event) => event.type === "stage.failed")).toBe(
      true
    )
    expect(result.events.some((event) => event.type === "run.failed")).toBe(
      true
    )
    const stageFailure = result.events.find(
      (event) => event.type === "stage.failed"
    )
    if (stageFailure?.type === "stage.failed") {
      expect(stageFailure.payload.providerFailure).toBeDefined()
      expect(stageFailure.payload.providerFailure?.code).toBe("unknown")
    }
    expect(
      result.events.some(
        (event) =>
          event.type === "tool.called" && event.payload.input.isRedacted
      )
    ).toBe(true)
  })

  it("normalizes provider failures into canonical event payloads", async () => {
    const provider = new MockLlmProvider(() => {
      const error = new Error("Rate limit") as Error & { status: number }
      error.name = "OpenAIError"
      error.status = 429
      throw error
    })
    const runner = makeRunner(provider)
    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "start",
      nodes: [
        { id: "start", op: "START" },
        {
          id: "llm",
          op: "LLM_WRITE",
          model_class: "SMALL_EXEC",
          prompt_template: "prompt",
          output_schema: { type: "object" },
          validators: [{ type: "json_schema", schema: { type: "object" } }],
          outputs: { result: "$vars.llm.result" },
        },
      ],
      edges: [{ from: "start", to: "llm", when: { op: "always" } }],
    }

    const result = await runner.execute(program)
    expect(result.status).toBe("failed")

    const llmFailure = result.events.find(
      (event) => event.type === "llm.step.failed"
    )
    expect(llmFailure?.type).toBe("llm.step.failed")
    if (llmFailure?.type === "llm.step.failed") {
      expect(llmFailure.payload.providerFailure.code).toBe("rate_limit")
      expect(llmFailure.payload.providerFailure.retryable).toBe(true)
      expect(llmFailure.payload.providerFailure.statusCode).toBe(429)
    }

    const runFailure = result.events.find(
      (event) => event.type === "run.failed"
    )
    expect(runFailure?.type).toBe("run.failed")
    if (runFailure?.type === "run.failed") {
      expect(runFailure.payload.providerFailure?.code).toBe("rate_limit")
    }
  })
})
