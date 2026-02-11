import { type LlmProvider, MockLlmProvider, OpenAiProvider } from "@lattice/llm"

export type LlmProviderFactory = () => LlmProvider

function readApiKeyFromEnv(): string | undefined {
  return process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY
}

export function createProviderFromEnv(): LlmProvider {
  const configuredProvider = (process.env.LATTICE_LLM_PROVIDER ?? "openai")
    .trim()
    .toLowerCase()

  if (configuredProvider === "mock") {
    return new MockLlmProvider()
  }

  const apiKey = readApiKeyFromEnv()
  if (!apiKey) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY (or VITE_OPENAI_API_KEY), or set LATTICE_LLM_PROVIDER=mock for local testing."
    )
  }

  return new OpenAiProvider({ apiKey })
}
