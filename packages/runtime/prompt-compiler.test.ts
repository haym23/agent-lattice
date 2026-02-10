import type { ExecNode } from "@lattice/ir"
import { describe, expect, it } from "vitest"
import { createDefaultPromptRegistry } from "../prompts/registry"
import { PromptCompiler } from "./prompt-compiler"

describe("PromptCompiler", () => {
  it("compiles llm node into request messages", () => {
    const compiler = new PromptCompiler(createDefaultPromptRegistry())
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "llm-write-v1",
      output_schema: { type: "object" },
    }
    const request = compiler.compile(node, {
      instruction: "Write summary",
      input_json: { text: "hello" },
    })
    expect(request.modelClass).toBe("SMALL_EXEC")
    expect(request.messages[0].role).toBe("system")
    expect(request.messages[1].content).toContain("Write summary")
  })

  it("applies input projection and truncation", () => {
    const compiler = new PromptCompiler(createDefaultPromptRegistry())
    const node: ExecNode = {
      id: "n1",
      op: "LLM_WRITE",
      model_class: "SMALL_EXEC",
      prompt_template: "llm-write-v1",
      output_schema: { type: "object" },
    }
    const request = compiler.compile(
      node,
      {
        instruction: "Use projected",
        input_json: {
          ref: "$vars.longText",
          truncate_chars: 4,
        },
      },
      {
        $vars: {
          longText: "abcdefgh",
        },
      }
    )
    expect(request.messages[1].content).toContain("abcd")
  })

  it("compiles repair prompt", () => {
    const compiler = new PromptCompiler(createDefaultPromptRegistry())
    const request = compiler.compileRepair("SMALL_EXEC", {
      error: "id required",
      previous_output: { name: "x" },
      expected_schema: { type: "object", required: ["id"] },
    })
    expect(request.messages[0].content).toContain("Fix the JSON output")
    expect(request.messages[1].content).toContain("id required")
  })
})
