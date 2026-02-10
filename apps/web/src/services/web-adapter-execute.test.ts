import { describe, expect, it } from "vitest"

import { WebPlatformAdapter } from "./web-adapter"

describe("WebPlatformAdapter executeWorkflow", () => {
  it("executes lowered workflow and returns execution result", async () => {
    const adapter = new WebPlatformAdapter()
    const workflow = {
      id: "wf-1",
      name: "execute-test",
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
          id: "end",
          type: "end" as const,
          label: "End",
          position: { x: 120, y: 0 },
          config: {},
        },
      ],
      edges: [{ id: "e1", source: "start", target: "end" }],
    }

    const events: string[] = []
    const unsub = adapter.subscribeToExecution((event) =>
      events.push(event.type)
    )
    const result = await adapter.executeWorkflow(workflow)
    unsub()

    expect(result.status).toBe("completed")
    expect(events).toContain("run.completed")
  })

  it("includes runtime prompt preview when compiling workflow with llm nodes", async () => {
    const adapter = new WebPlatformAdapter()
    const workflow = {
      id: "wf-2",
      name: "compile-test",
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
          id: "agent-1",
          type: "subAgent" as const,
          label: "Sub-Agent",
          position: { x: 120, y: -40 },
          config: { description: "Summarize", prompt: "Summarize the input" },
        },
        {
          id: "agent-2",
          type: "subAgent" as const,
          label: "Sub-Agent",
          position: { x: 120, y: 40 },
          config: { description: "Classify", prompt: "Classify the input" },
        },
        {
          id: "end",
          type: "end" as const,
          label: "End",
          position: { x: 240, y: 0 },
          config: {},
        },
      ],
      edges: [
        { id: "e1", source: "start", target: "agent-1" },
        { id: "e2", source: "start", target: "agent-2" },
        { id: "e3", source: "agent-1", target: "end" },
        { id: "e4", source: "agent-2", target: "end" },
      ],
    }

    const result = await adapter.compileWorkflow(
      workflow,
      "claude-sonnet",
      "claude"
    )
    const runtimePreview = result.files.find(
      (file) => file.path === ".debug/runtime-prompts.md"
    )

    expect(runtimePreview).toBeTruthy()
    expect(runtimePreview?.content).toContain("Runtime Prompt Preview")
    expect(runtimePreview?.content).toContain("Summarize the input")
    expect(runtimePreview?.content).toContain("Classify the input")
  })
})
