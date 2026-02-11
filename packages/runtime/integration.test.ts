import { describe, expect, it, vi } from "vitest"

import { lowerToExecIR } from "../compiler/lower"
import { MockLlmProvider } from "../llm/mock-provider"
import { createRunner } from "./index"

function baseWorkflow() {
  return {
    id: "wf",
    name: "integration",
    version: "1.0.0" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "start",
        type: "start" as const,
        label: "Start",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        id: "prompt",
        type: "prompt" as const,
        label: "Prompt",
        position: { x: 100, y: 0 },
        config: { prompt: "Summarize" },
      },
      {
        id: "end",
        type: "end" as const,
        label: "End",
        position: { x: 200, y: 0 },
        config: {},
      },
    ],
    edges: [
      { id: "e1", source: "start", target: "prompt" },
      { id: "e2", source: "prompt", target: "end" },
    ],
  }
}

describe("runtime integration", () => {
  it("runs full lower + execute pipeline", async () => {
    const program = lowerToExecIR(baseWorkflow())
    const runner = createRunner(
      new MockLlmProvider(() => ({
        content: '{"summary":"done"}',
        parsed: { summary: "done" },
        usage: { promptTokens: 1, completionTokens: 1 },
        modelUsed: "SMALL_EXEC",
      }))
    )

    const result = await runner.execute(program, { user_message: "hello" })
    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("prompt")
  })

  it("runs http request via tool call node", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ text: async () => '{"ok":true}' }))
    )
    const workflow = {
      ...baseWorkflow(),
      nodes: [
        {
          id: "start",
          type: "start" as const,
          label: "Start",
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "http",
          type: "httpRequest" as const,
          label: "HTTP",
          position: { x: 100, y: 0 },
          config: {
            method: "GET",
            url: "https://example.com",
            responseFormat: "json",
          },
        },
        {
          id: "end",
          type: "end" as const,
          label: "End",
          position: { x: 200, y: 0 },
          config: {},
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "http" },
        { id: "e2", source: "http", target: "end" },
      ],
    }
    const program = lowerToExecIR(workflow)
    const runner = createRunner(new MockLlmProvider())
    const result = await runner.execute(program)
    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("http")
  })

  it("routes askUserQuestion branches from input", async () => {
    const workflow = {
      ...baseWorkflow(),
      nodes: [
        {
          id: "start",
          type: "start" as const,
          label: "Start",
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: "question",
          type: "askUserQuestion" as const,
          label: "Question",
          position: { x: 100, y: 0 },
          config: {
            questionText: "Which strategy?",
            options: [{ label: "Parallel" }, { label: "In-place" }],
          },
        },
        {
          id: "parallel",
          type: "prompt" as const,
          label: "Parallel Path",
          position: { x: 200, y: -50 },
          config: { prompt: "Take parallel path" },
        },
        {
          id: "in-place",
          type: "prompt" as const,
          label: "In-place Path",
          position: { x: 200, y: 50 },
          config: { prompt: "Take in-place path" },
        },
        {
          id: "end",
          type: "end" as const,
          label: "End",
          position: { x: 300, y: 0 },
          config: {},
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "question" },
        { id: "e2", source: "question", target: "parallel" },
        { id: "e3", source: "question", target: "in-place" },
        { id: "e4", source: "parallel", target: "end" },
        { id: "e5", source: "in-place", target: "end" },
      ],
    }

    const program = lowerToExecIR(workflow)
    const runner = createRunner(
      new MockLlmProvider((request) => {
        const prompt = request.messages[1]?.content ?? ""
        if (prompt.includes("Take parallel path")) {
          return {
            content: '{"route":"parallel"}',
            parsed: { route: "parallel" },
            usage: { promptTokens: 1, completionTokens: 1 },
            modelUsed: "SMALL_EXEC",
          }
        }
        return {
          content: '{"route":"in-place"}',
          parsed: { route: "in-place" },
          usage: { promptTokens: 1, completionTokens: 1 },
          modelUsed: "SMALL_EXEC",
        }
      })
    )

    const result = await runner.execute(program, {
      askUserQuestion: { question: "Parallel" },
    })

    expect(result.status).toBe("completed")
    expect(result.finalState.$vars).toHaveProperty("parallel")
    expect(result.finalState.$vars).not.toHaveProperty("in-place")
  })
})
