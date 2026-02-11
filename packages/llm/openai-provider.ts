import OpenAI from "openai"

import {
  type LlmProvider,
  type LlmRequest,
  type LlmResponse,
  MissingApiKeyError,
} from "./types"

const MODEL_MAP = {
  SMALL_EXEC: "gpt-4o-mini",
  MEDIUM_PLAN: "gpt-4o",
  LARGE_JUDGE: "gpt-4o",
} as const

interface OpenAiProviderOptions {
  apiKey?: string
  client?: OpenAI
}

/**
 * Reads the OpenAI API key from Vite environment variables.
 */
function readOpenAiApiKey(): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    const serverApiKey =
      process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY
    if (serverApiKey) {
      return serverApiKey
    }
  }

  const meta = import.meta as unknown as {
    env?: Record<string, string | undefined>
  }
  return meta.env?.VITE_OPENAI_API_KEY
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Provides open ai provider behavior.
 */
export class OpenAiProvider implements LlmProvider {
  private readonly client: OpenAI

  constructor(options: OpenAiProviderOptions = {}) {
    const apiKey = options.apiKey ?? readOpenAiApiKey()
    if (!apiKey) {
      throw new MissingApiKeyError()
    }
    this.client =
      options.client ??
      new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
      })
  }

  async chat(request: LlmRequest): Promise<LlmResponse> {
    const model = MODEL_MAP[request.modelClass]
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          temperature: request.temperature,
          messages: request.messages,
          response_format: request.responseFormat
            ? { type: "json_object" }
            : undefined,
        })
        const content = response.choices[0]?.message?.content ?? ""
        return {
          content,
          parsed:
            request.responseFormat && content ? JSON.parse(content) : undefined,
          usage: {
            promptTokens: response.usage?.prompt_tokens ?? 0,
            completionTokens: response.usage?.completion_tokens ?? 0,
          },
          modelUsed: response.model ?? model,
        }
      } catch (error) {
        const status = (error as { status?: number }).status
        if (status === 429 && attempt < 2) {
          await sleep(50 * 2 ** attempt)
          continue
        }
        if (status === 401) {
          throw new MissingApiKeyError()
        }
        throw error
      }
    }
    throw new Error("OpenAI request failed after retries")
  }
}
