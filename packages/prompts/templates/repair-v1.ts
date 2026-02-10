import type { PromptTemplate } from "../types"

export const repairV1Template: PromptTemplate = {
  id: "repair-v1",
  version: "1",
  systemPrompt:
    "Fix the JSON output based on the error description. Return JSON only.",
  userPromptTemplate:
    "Validation error:\n{{error}}\n\nPrevious output:\n{{previous_output_json}}\n\nExpected schema:\n{{expected_schema_json}}",
}
