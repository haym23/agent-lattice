import type { PromptTemplate } from "../types"

export const nodeAskUserQuestionV1Template: PromptTemplate = {
  id: "node-ask-user-question-v1",
  version: "1",
  systemPrompt:
    "You design user-facing clarification questions for workflow branching. Produce neutral, concise options and return strict JSON only.",
  userPromptTemplate:
    '<question_goal>\n{{instruction}}\n</question_goal>\n\n<context_json>\n{{input_json}}\n</context_json>\n\nReturn exactly this JSON shape:\n{\n  "question": string,\n  "options": [\n    { "label": string, "value": string, "description": string }\n  ],\n  "allowCustom": boolean\n}\n\nRequirements:\n- Generate 2 to 4 options.\n- Option labels must be short (1 to 5 words).\n- Options should be mutually distinct and actionable.\n- Keep question plain-language and unbiased.\n- Output JSON only.',
}
