import { type LlmProvider, MockLlmProvider, OpenAiProvider } from "@lattice/llm"

export type LlmProviderFactory = () => LlmProvider

export type SupportedProvider = "openai" | "mock"

export interface ProviderSelection {
  provider: SupportedProvider
  source: "env" | "default"
}

export class ProviderSelectionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProviderSelectionError"
  }
}

export class MissingProviderCredentialError extends Error {
  constructor(provider: SupportedProvider) {
    super(
      provider === "openai"
        ? "Missing OpenAI API key. Set OPENAI_API_KEY (or VITE_OPENAI_API_KEY), or set LATTICE_LLM_PROVIDER=mock for local testing."
        : `Missing credentials for provider: ${provider}`
    )
    this.name = "MissingProviderCredentialError"
  }
}

function readApiKeyFromEnv(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY
}

export function resolveProviderSelection(): ProviderSelection {
  const rawValue = process.env.LATTICE_LLM_PROVIDER?.trim().toLowerCase()
  if (!rawValue) {
    return {
      provider: "openai",
      source: "default",
    }
  }

  if (rawValue === "openai" || rawValue === "mock") {
    return {
      provider: rawValue,
      source: "env",
    }
  }

  throw new ProviderSelectionError(
    `Unsupported LATTICE_LLM_PROVIDER value: "${rawValue}". Expected one of: openai, mock.`
  )
}

export function createProviderFromEnv(): LlmProvider {
  const selection = resolveProviderSelection()

  if (selection.provider === "mock") {
    return new MockLlmProvider()
  }

  const apiKey = readApiKeyFromEnv()
  if (!apiKey) {
    throw new MissingProviderCredentialError(selection.provider)
  }

  return new OpenAiProvider({ apiKey })
}
