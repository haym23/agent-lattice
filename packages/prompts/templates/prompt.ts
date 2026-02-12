import type { PromptTemplate } from "../types"

export const promptTemplate: PromptTemplate = {
  id: "prompt",
  version: "1",
  systemPrompt:
    "You execute a workflow Prompt node. Follow the instruction exactly, ground your response in the provided input, and return only valid JSON that matches the required schema.",
  userPromptTemplate:
    "<instruction>\n{{instruction}}\n</instruction>\n\n<context_json>\n{{input_json}}\n</context_json>\n\nRules:\n1) Treat instruction as highest priority task intent.\n2) Use only supported facts from context_json unless the instruction explicitly asks for invention.\n3) If required information is missing, use nulls or empty collections instead of fabricating details.\n4) Output JSON only with no markdown or prose outside JSON.",
}
