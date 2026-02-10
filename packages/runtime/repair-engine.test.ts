import type { ExecNode } from "@lattice/ir"
import { describe, expect, it } from "vitest"
import { MockLlmProvider } from "../llm/mock-provider"
import { RepairEngine } from "./repair-engine"

describe("RepairEngine", () => {
  it("repairs invalid output using llm response", async () => {
    const provider = new MockLlmProvider(() => ({
      content: '{"id":"fixed"}',
      parsed: { id: "fixed" },
      usage: { promptTokens: 1, completionTokens: 1 },
      modelUsed: "SMALL_EXEC",
    }))
    const engine = new RepairEngine()
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "llm-write-v1",
      output_schema: { type: "object" },
      retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 2 },
    }

    const result = await engine.attemptRepair(
      node,
      { id: 1 },
      [{ type: "schema", message: "id must be string" }],
      provider
    )
    expect(result.repaired).toBe(true)
    expect(result.output).toEqual({ id: "fixed" })
    expect(result.attempts).toBe(1)
  })

  it("stops after max attempts", async () => {
    const provider = new MockLlmProvider(() => ({
      content: "not-json",
      usage: { promptTokens: 1, completionTokens: 1 },
      modelUsed: "SMALL_EXEC",
    }))
    const engine = new RepairEngine()
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "llm-write-v1",
      output_schema: { type: "object" },
      retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 3 },
    }
    const result = await engine.attemptRepair(
      node,
      {},
      [{ type: "schema", message: "x" }],
      provider
    )
    expect(result.repaired).toBe(false)
    expect(result.attempts).toBe(3)
  })
})
