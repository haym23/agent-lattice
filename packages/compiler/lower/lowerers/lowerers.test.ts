import { describe, expect, it } from "vitest"

import { askUserQuestionLowerer } from "./ask-user-question-lowerer"
import { ifElseLowerer } from "./if-else-lowerer"
import { promptLowerer } from "./prompt-lowerer"

const baseContext = {
  workflow: {
    id: "wf",
    name: "wf",
    version: "1.0.0" as const,
    createdAt: "",
    updatedAt: "",
    nodes: [],
    edges: [],
  },
  graph: {
    nodes: [],
    edges: [],
    executionOrder: [],
    cycles: [],
    unreachable: [],
  },
  allNodes: new Map(),
  incomingEdges: new Map(),
  outgoingEdges: new Map<
    string,
    Array<{ id: string; source: string; target: string }>
  >(),
}

describe("lowerers", () => {
  it("prompt lowerer emits llm write node", () => {
    const fragment = promptLowerer.lower(
      {
        id: "p1",
        type: "prompt",
        label: "Prompt",
        position: { x: 0, y: 0 },
        config: { prompt: "Hello" },
      },
      baseContext
    )
    expect(fragment.nodes[0].op).toBe("LLM_WRITE")
  })

  it("ifElse lowerer emits branch edges", () => {
    const context = {
      ...baseContext,
      outgoingEdges: new Map([
        [
          "if1",
          [
            { id: "e1", source: "if1", target: "yes" },
            { id: "e2", source: "if1", target: "no" },
          ],
        ],
      ]),
    }
    const fragment = ifElseLowerer.lower(
      {
        id: "if1",
        type: "ifElse",
        label: "If",
        position: { x: 0, y: 0 },
        config: {
          evaluationTarget: "$vars.flag",
          branches: [{ value: "true" }, { value: "false" }],
        },
      },
      context
    )
    expect(fragment.nodes[0].op).toBe("SWITCH")
    expect(fragment.edges).toHaveLength(2)
  })

  it("askUserQuestion lowerer emits branch edges", () => {
    const context = {
      ...baseContext,
      outgoingEdges: new Map([
        [
          "q1",
          [
            { id: "e1", source: "q1", target: "parallel" },
            { id: "e2", source: "q1", target: "in-place" },
          ],
        ],
      ]),
    }

    const fragment = askUserQuestionLowerer.lower(
      {
        id: "q1",
        type: "askUserQuestion",
        label: "Question",
        position: { x: 0, y: 0 },
        config: {
          questionText: "Which strategy?",
          options: [{ label: "Parallel" }, { label: "In-place" }],
        },
      },
      context
    )

    expect(fragment.nodes[0].op).toBe("SWITCH")
    expect(fragment.edges).toHaveLength(2)
    expect(fragment.edges[0]?.when).toEqual({
      op: "eq",
      left: "$in.askUserQuestion.q1",
      right: "Parallel",
    })
    expect(fragment.edges[1]?.when).toEqual({ op: "always" })
  })
})
