export interface ModelCapabilities {
  toolUse: boolean
  structuredOutput: boolean
  vision: boolean
  contextWindow: number
  promptFormat: "xml" | "function-calling" | "chat"
}

export interface ModelDefinition {
  id: string
  displayName: string
  provider: string
  logoText: string
  preview: string
  capabilities: ModelCapabilities
}
