import type { ExecNode } from "@lattice/ir"
import { describe, expect, it } from "vitest"
import { EscalationEngine } from "./escalation-engine"

describe("EscalationEngine", () => {
  it("returns escalation decision when condition matches", () => {
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "prompt",
      output_schema: { type: "object" },
      escalation: { on: ["schema_failure"], to_model_class: "MEDIUM_PLAN" },
    }
    const engine = new EscalationEngine()
    const decision = engine.shouldEscalate(node, {
      type: "schema",
      message: "schema_failure: id",
    })
    expect(decision).toEqual({ escalate: true, toModelClass: "MEDIUM_PLAN" })
  })

  it("does not escalate when no policy", () => {
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "prompt",
      output_schema: { type: "object" },
    }
    const engine = new EscalationEngine()
    const decision = engine.shouldEscalate(node, {
      type: "schema",
      message: "schema_failure: id",
    })
    expect(decision).toEqual({ escalate: false })
  })
})
