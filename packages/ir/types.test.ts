import { describe, expect, it } from "vitest"

import {
  type ExecNode,
  type ExecProgram,
  isExecOp,
  isModelClass,
  isStateRef,
} from "./types"

describe("ir types", () => {
  it("validates known ops and model classes", () => {
    expect(isExecOp("LLM_WRITE")).toBe(true)
    expect(isExecOp("UNKNOWN")).toBe(false)
    expect(isModelClass("SMALL_EXEC")).toBe(true)
    expect(isModelClass("SMALL")).toBe(false)
  })

  it("validates state refs", () => {
    expect(isStateRef("$vars.result")).toBe(true)
    expect(isStateRef("$tmp.a.b")).toBe(true)
    expect(isStateRef("$ctx.user.id")).toBe(true)
    expect(isStateRef("$in.input")).toBe(true)
    expect(isStateRef("$nope.value")).toBe(false)
    expect(isStateRef("vars.result")).toBe(false)
  })

  it("supports every exec node variant and serializes program", () => {
    const nodes: ExecNode[] = [
      { id: "n1", op: "START" },
      { id: "n2", op: "END" },
      {
        id: "n3",
        op: "LLM_WRITE",
        model_class: "SMALL_EXEC",
        prompt_template: "prompt",
        output_schema: { type: "object" },
        retry_policy: { strategy: "PATCH_JSON_FROM_ERROR", max_attempts: 2 },
        escalation: { on: ["schema_failure"], to_model_class: "MEDIUM_PLAN" },
      },
      { id: "n4", op: "SWITCH" },
      {
        id: "n5",
        op: "TOOL_CALL",
        tool: "http.request",
        args: { url: "$vars.url" },
      },
      { id: "n6", op: "VAR_SET", target: "$vars.answer", value: "ok" },
      { id: "n7", op: "VAR_GET", source: "$vars.answer" },
      {
        id: "n8",
        op: "TRANSFORM",
        transformation: "jmespath",
        expression: "items[*].id",
      },
    ]

    const program: ExecProgram = {
      execir_version: "1.0",
      entry_node: "n1",
      nodes,
      edges: [
        { from: "n1", to: "n3", when: { op: "always" } },
        {
          from: "n3",
          to: "n4",
          when: { op: "eq", left: "$vars.answer", right: "ok" },
        },
      ],
    }

    const parsed = JSON.parse(JSON.stringify(program)) as ExecProgram
    expect(parsed.entry_node).toBe("n1")
    expect(parsed.nodes).toHaveLength(8)
    expect(parsed.edges[0].when.op).toBe("always")
    expect(parsed.edges[1].when.op).toBe("eq")
  })
})
