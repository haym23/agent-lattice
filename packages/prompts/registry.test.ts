import { describe, expect, it } from "vitest"

import { createDefaultPromptRegistry } from "./registry"
import { PromptTemplateRegistry } from "./types"

describe("PromptTemplateRegistry", () => {
  it("registers and fetches templates", () => {
    const registry = new PromptTemplateRegistry()
    registry.register({
      id: "custom-v1",
      version: "1",
      systemPrompt: "sys",
      userPromptTemplate: "user",
    })
    expect(registry.get("custom-v1").systemPrompt).toBe("sys")
  })

  it("rejects duplicate ids", () => {
    const registry = new PromptTemplateRegistry()
    registry.register({
      id: "dup-v1",
      version: "1",
      systemPrompt: "sys",
      userPromptTemplate: "user",
    })
    expect(() =>
      registry.register({
        id: "dup-v1",
        version: "1",
        systemPrompt: "sys2",
        userPromptTemplate: "user2",
      })
    ).toThrow("already registered")
  })

  it("throws when template does not exist", () => {
    const registry = new PromptTemplateRegistry()
    expect(() => registry.get("missing-v1")).toThrow("not found")
  })

  it("creates default registry with built-in templates", () => {
    const registry = createDefaultPromptRegistry()
    const ids = registry.list().map((t) => t.id)
    expect(ids).toContain("sequential")
    expect(ids).toContain("conditional")
    expect(ids).toContain("switch")
    expect(ids).toContain("loop")
    expect(ids).toContain("recursion")
    expect(ids).toContain("nondeterministic")
    expect(ids).toContain("disruptive")
    expect(ids).toContain("exception")
    expect(ids).toContain("prompt")
    expect(ids).toContain("sub-agent")
    expect(ids).toContain("ask-user-question")
    expect(ids).toContain("repair-v1")
  })
})
