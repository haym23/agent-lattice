import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

import { createLogger } from "./logger"
import {
  type LlmProvider,
  type LlmRequest,
  type LlmResponse,
  MissingApiKeyError,
} from "./types"

const logger = createLogger("llm:openai")

const MODEL_MAP = {
  SMALL_EXEC: "gpt-4o-mini",
  MEDIUM_PLAN: "gpt-4o",
  LARGE_JUDGE: "gpt-4o",
} as const

interface OpenAiProviderOptions {
  apiKey?: string
  generateTextFn?: GenerateTextFn
  modelFactory?: OpenAiModelFactory
}

type OpenAiModelFactory = ReturnType<typeof createOpenAI>

interface GenerateTextInput {
  model: unknown
  temperature?: number
  messages: LlmRequest["messages"]
  providerOptions?: Record<string, unknown>
}

interface GenerateTextResult {
  text?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  response?: {
    modelId?: string
  }
}

type GenerateTextFn = (input: GenerateTextInput) => Promise<GenerateTextResult>

/**
 * Reads the OpenAI API key from Vite environment variables.
 */
function readOpenAiApiKey(): string | undefined {
  const serverEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> }
    }
  ).process?.env

  if (serverEnv) {
    const serverApiKey =
      serverEnv.OPENAI_API_KEY ?? serverEnv.VITE_OPENAI_API_KEY
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
  private readonly generateTextFn: GenerateTextFn
  private readonly modelFactory: OpenAiModelFactory

  constructor(options: OpenAiProviderOptions = {}) {
    const apiKey = options.apiKey ?? readOpenAiApiKey()
    if (!apiKey) {
      logger.error("openai.api_key.missing")
      throw new MissingApiKeyError()
    }
    this.modelFactory = options.modelFactory ?? createOpenAI({ apiKey })
    this.generateTextFn =
      options.generateTextFn ?? (generateText as GenerateTextFn)
  }

  async chat(request: LlmRequest): Promise<LlmResponse> {
    const model = MODEL_MAP[request.modelClass]
    logger.debug("openai.request.start", {
      model,
      temperature: request.temperature,
      messageCount: request.messages.length,
      responseFormat: Boolean(request.responseFormat),
    })
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await this.generateTextFn({
          model: this.modelFactory(model),
          temperature: request.temperature,
          messages: request.messages,
          providerOptions: request.responseFormat
            ? {
              openai: {
                response_format: { type: "json_object" },
              },
            }
            : undefined,
        })
        const content = response.text ?? ""
        logger.debug("openai.request.response", {
          contentPreview: content.slice(0, 100),
          contentLength: content.length,
          modelUsed: response.response?.modelId ?? model,
        })
        logger.debug("openai.request.complete", {
          modelUsed: response.response?.modelId ?? model,
          inputTokens: response.usage?.inputTokens ?? 0,
          outputTokens: response.usage?.outputTokens ?? 0,
        })
        return {
          content,
          parsed:
            request.responseFormat && content ? JSON.parse(content) : undefined,
          usage: {
            promptTokens: response.usage?.inputTokens ?? 0,
            completionTokens: response.usage?.outputTokens ?? 0,
          },
          modelUsed: response.response?.modelId ?? model,
        }
      } catch (error) {
        const status = (error as { status?: number; statusCode?: number })
          .status
        const statusCode =
          (error as { status?: number; statusCode?: number }).statusCode ??
          status
        if (statusCode === 429 && attempt < 2) {
          logger.info("openai.request.retry", {
            attempt: attempt + 1,
            statusCode,
          })
          await sleep(50 * 2 ** attempt)
          continue
        }
        if (statusCode === 401 || statusCode === 403) {
          logger.error("openai.request.unauthorized", { statusCode })
          throw new MissingApiKeyError()
        }
        logger.warn("openai.request.failed", {
          attempt: attempt + 1,
          statusCode,
        })
        throw error
      }
    }
    logger.error("openai.request.exhausted", { model })
    throw new Error("OpenAI request failed after retries")
  }
}
