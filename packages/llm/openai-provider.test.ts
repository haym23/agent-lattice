import { describe, expect, it } from "vitest"

import { OpenAiProvider } from "./openai-provider"
import { MissingApiKeyError } from "./types"

describe("OpenAiProvider", () => {
  it("throws when api key is missing", () => {
    expect(() => new OpenAiProvider({ apiKey: "" })).toThrow(MissingApiKeyError)
  })

  it("maps model classes and returns normalized response", async () => {
    const client = {
      chat: {
        completions: {
          create: async (input: { model: string }) => ({
            model: input.model,
            choices: [{ message: { content: '{"ok":true}' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
        },
      },
    } as never

    const provider = new OpenAiProvider({ apiKey: "test", client })
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
    const client = {
      chat: {
        completions: {
          create: async () => {
            const err = new Error("unauthorized") as Error & {
              status?: number
            }
            err.status = 401
            throw err
          },
        },
      },
    } as never

    const provider = new OpenAiProvider({ apiKey: "test", client })
    await expect(
      provider.chat({
        modelClass: "MEDIUM_PLAN",
        messages: [{ role: "user", content: "hello" }],
      })
    ).rejects.toThrow(MissingApiKeyError)
  })
})
