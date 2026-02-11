import { describe, expect, it } from "vitest"

import { ModelRegistry, validateModelDefinition } from "./registry"
import claudeIcon from "./icons/claude.svg"
import openAiIcon from "./icons/openai.svg"

describe("ModelRegistry", () => {
  it("contains Claude and GPT-4o", () => {
    const registry = new ModelRegistry()
    const ids = registry.list().map((model) => model.id)
    expect(ids).toContain("claude-sonnet")
    expect(ids).toContain("gpt-4o")
  })

  it("get returns correct model", () => {
    const registry = new ModelRegistry()
    const claude = registry.get("claude-sonnet")
    expect(claude.displayName).toBe("Claude Sonnet")
    expect(claude.provider).toBe("Anthropic")
    expect(claude.icon).toBe(claudeIcon)
    expect(claude.capabilities.toolUse).toBe(true)
  })

  it("get throws for unknown model", () => {
    const registry = new ModelRegistry()
    expect(() => registry.get("nonexistent")).toThrow("Unknown model")
  })

  it("accepts custom models", () => {
    const registry = new ModelRegistry([
      {
        id: "custom",
        displayName: "Custom Model",
        provider: "Custom",
        icon: openAiIcon,
        preview: "Custom test model.",
        capabilities: {
          toolUse: false,
          structuredOutput: false,
          vision: false,
          contextWindow: 4096,
          promptFormat: "chat",
        },
      },
    ])
    expect(registry.list()).toHaveLength(1)
    expect(registry.get("custom").displayName).toBe("Custom Model")
  })

  it("validateModelDefinition throws on empty id", () => {
    expect(() =>
      validateModelDefinition({
        id: "",
        displayName: "Test",
        provider: "Provider",
        icon: "test-icon",
        preview: "Preview",
        capabilities: {
          toolUse: false,
          structuredOutput: false,
          vision: false,
          contextWindow: 100,
          promptFormat: "chat",
        },
      })
    ).toThrow("model.id is required")
  })

  it("validateModelDefinition throws on non-positive context window", () => {
    expect(() =>
      validateModelDefinition({
        id: "test",
        displayName: "Test",
        provider: "Provider",
        icon: "test-icon",
        preview: "Preview",
        capabilities: {
          toolUse: false,
          structuredOutput: false,
          vision: false,
          contextWindow: 0,
          promptFormat: "chat",
        },
      })
    ).toThrow("contextWindow must be positive")
  })
})
