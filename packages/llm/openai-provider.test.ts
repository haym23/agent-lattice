import { describe, expect, it } from "vitest"

import { OpenAiProvider } from "./openai-provider"
import { MissingApiKeyError } from "./types"

describe("OpenAiProvider", () => {
  it("throws when api key is missing", () => {
    expect(() => new OpenAiProvider({ apiKey: "" })).toThrow(MissingApiKeyError)
  })

  it("maps model classes and returns normalized response", async () => {
    const provider = new OpenAiProvider({
      apiKey: "test",
      modelFactory: ((modelId: string) => ({ modelId })) as never,
      generateTextFn: async () => ({
        text: '{"ok":true}',
        usage: { inputTokens: 10, outputTokens: 5 },
        response: { modelId: "gpt-4o-mini" },
      }),
    })
    const response = await provider.chat({
      modelClass: "SMALL_EXEC",
      messages: [{ role: "user", content: "hello" }],
      responseFormat: { type: "object" },
    })

    expect(response.modelUsed).toBe("gpt-4o-mini")
    expect(response.parsed).toEqual({ ok: true })
    expect(response.usage.promptTokens).toBe(10)
  })

  it("converts auth failure to MissingApiKeyError", async () => {
    const provider = new OpenAiProvider({
      apiKey: "test",
      modelFactory: ((modelId: string) => ({ modelId })) as never,
      generateTextFn: async () => {
        const err = new Error("unauthorized") as Error & {
          statusCode?: number
        }
        err.statusCode = 401
        throw err
      },
    })
    await expect(
      provider.chat({
        modelClass: "MEDIUM_PLAN",
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrow(MissingApiKeyError)
  })
})
