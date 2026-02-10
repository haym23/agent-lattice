import { describe, expect, it } from "vitest"

import { LowererRegistry } from "./registry"
import type { Lowerer } from "./types"

describe("LowererRegistry", () => {
  it("registers and lowers node", () => {
    const registry = new LowererRegistry()
    const lowerer: Lowerer = {
      nodeType: "start",
      lower: (node) => ({
        nodes: [{ id: node.id, op: "START" }],
        edges: [],
        requiredTemplates: [],
      }),
    }
    registry.register(lowerer)
    const result = registry.lower(
      {
        id: "start",
        type: "start",
        label: "Start",
        position: { x: 0, y: 0 },
        config: {},
      },
      {
        workflow: {
          id: "wf",
          name: "wf",
          version: "1.0.0",
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
        outgoingEdges: new Map(),
      }
    )
    expect(result.nodes[0].op).toBe("START")
  })

  it("throws on duplicate lowerer registration", () => {
    const registry = new LowererRegistry()
    const lowerer: Lowerer = {
      nodeType: "start",
      lower: () => ({ nodes: [], edges: [], requiredTemplates: [] }),
    }
    registry.register(lowerer)
    expect(() => registry.register(lowerer)).toThrow("already registered")
  })
})
