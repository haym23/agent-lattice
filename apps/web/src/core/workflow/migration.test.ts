import { describe, expect, it } from "vitest"

import { migrateLegacyWorkflow } from "./migration"

describe("migrateLegacyWorkflow", () => {
  it("maps legacy node types to current documented node types", () => {
    const migrated = migrateLegacyWorkflow({
      id: "legacy-1",
      name: "legacy",
      nodes: [
        {
          id: "n1",
          type: "llmCall",
          position: { x: 0, y: 0 },
          data: { label: "LLM" },
        },
        {
          id: "n2",
          type: "conditionalBranch",
          position: { x: 100, y: 0 },
          data: { label: "Condition" },
        },
        {
          id: "n3",
          type: "switchCase",
          position: { x: 200, y: 0 },
          data: { label: "Switch" },
        },
      ],
      connections: [
        { id: "e1", from: "n1", to: "n2" },
        { id: "e2", from: "n2", to: "n3" },
      ],
    })

    expect(migrated.nodes.map((node) => node.type)).toEqual([
      "subAgent",
      "ifElse",
      "switch",
    ])
    expect(migrated.edges).toHaveLength(2)
  })

  it("falls back to subAgent for unknown legacy node type", () => {
    const migrated = migrateLegacyWorkflow({
      name: "unknown-type",
      nodes: [{ id: "n1", type: "somethingCustom", position: { x: 0, y: 0 } }],
    })

    expect(migrated.nodes[0].type).toBe("subAgent")
  })
})
