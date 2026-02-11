import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createProviderFromEnv,
  MissingProviderCredentialError,
  ProviderSelectionError,
  resolveProviderSelection,
} from "./provider-factory"

describe("provider factory", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults to openai when provider env is unset", () => {
    vi.stubEnv("LATTICE_LLM_PROVIDER", undefined)
    expect(resolveProviderSelection()).toEqual({
      provider: "openai",
      source: "default",
    })
  })

  it("throws explicit error for unsupported provider values", () => {
    vi.stubEnv("LATTICE_LLM_PROVIDER", "anthropic")
    expect(() => resolveProviderSelection()).toThrow(ProviderSelectionError)
  })

  it("throws explicit credential error when openai key is missing", () => {
    vi.stubEnv("LATTICE_LLM_PROVIDER", "openai")
    vi.stubEnv("OPENAI_API_KEY", undefined)
    vi.stubEnv("VITE_OPENAI_API_KEY", undefined)

    expect(() => createProviderFromEnv()).toThrow(
      MissingProviderCredentialError
    )
  })

  it("returns mock provider when configured", () => {
    vi.stubEnv("LATTICE_LLM_PROVIDER", "mock")
    const provider = createProviderFromEnv()
    expect(provider.constructor.name).toBe("MockLlmProvider")
  })
})
