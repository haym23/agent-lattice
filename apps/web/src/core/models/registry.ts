import type { ModelDefinition } from "./types"
import claudeModelIcon from "./icons/claude.svg"
import openAiModelIcon from "./icons/openai.svg"

const builtInModels: ModelDefinition[] = [
  {
    id: "claude-sonnet",
    displayName: "Claude Sonnet",
    provider: "Anthropic",
    icon: claudeModelIcon,
    preview: "Balanced reasoning with strong tool and long-context support.",
    capabilities: {
      toolUse: true,
      structuredOutput: true,
      vision: true,
      contextWindow: 200000,
      promptFormat: "xml",
    },
  },
  {
    id: "gpt-4o",
    displayName: "GPT-4o",
    provider: "OpenAI",
    icon: openAiModelIcon,
    preview:
      "Fast multimodal responses with strong function-calling ergonomics.",
    capabilities: {
      toolUse: true,
      structuredOutput: true,
      vision: true,
      contextWindow: 128000,
      promptFormat: "function-calling",
    },
  },
]

/**
 * Provides model registry behavior.
 */
export class ModelRegistry {
  constructor(private readonly models: ModelDefinition[] = builtInModels) { }

  list(): ModelDefinition[] {
    return [...this.models]
  }

  get(id: string): ModelDefinition {
    const model = this.models.find((item) => item.id === id)
    if (!model) {
      throw new Error(`Unknown model: ${id}`)
    }
    return model
  }
}

/**
 * Validates model definition.
 */
export function validateModelDefinition(model: ModelDefinition): void {
  if (!model.id) throw new Error("model.id is required")
  if (!model.displayName) throw new Error("model.displayName is required")
  if (!model.provider) throw new Error("model.provider is required")
  if (!model.logoText) throw new Error("model.logoText is required")
  if (!model.preview) throw new Error("model.preview is required")
  if (model.capabilities.contextWindow <= 0) {
    throw new Error("model.capabilities.contextWindow must be positive")
  }
}
