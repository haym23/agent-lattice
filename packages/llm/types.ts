export const MODEL_CLASSES = [
  "SMALL_EXEC",
  "MEDIUM_PLAN",
  "LARGE_JUDGE",
] as const

export type ModelClass = (typeof MODEL_CLASSES)[number]

export interface JsonSchema {
  type?: string
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
  [key: string]: unknown
}

export interface LlmMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LlmRequest {
  modelClass: ModelClass
  messages: LlmMessage[]
  responseFormat?: JsonSchema
  temperature?: number
}

export interface LlmResponse {
  content: string
  parsed?: unknown
  usage: {
    promptTokens: number
    completionTokens: number
  }
  modelUsed: string
}

export interface LlmProvider {
  chat(request: LlmRequest): Promise<LlmResponse>
}

/**
 * Represents the missing api key error condition.
 */
export class MissingApiKeyError extends Error {
  constructor() {
    super("Missing OpenAI API key. Set OPENAI_API_KEY or VITE_OPENAI_API_KEY.")
    this.name = "MissingApiKeyError"
  }
}
