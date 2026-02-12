import type { PromptTemplate } from "../types"

export const nondeterministicTemplate: PromptTemplate = {
  id: "nondeterministic",
  version: "1",
  systemPrompt:
    "You model nondeterministic choice safely. Use constrained alternatives, explicit guards, and auditable selection policy. Return JSON only.",
  userPromptTemplate:
    '<goal>\n{{instruction}}\n</goal>\n\n<context_json>\n{{input_json}}\n</context_json>\n\n<alternatives_json>\n{{alternatives_json}}\n</alternatives_json>\n\nReturn JSON only in this shape:\n{\n  "flowType": "nondeterministic",\n  "openAlternatives": [string],\n  "selectionPolicy": "uniform" | "weighted" | "priority_randomized",\n  "seedStrategy": string,\n  "selected": string\n}\n\nRules:\n- Filter alternatives by explicit guards from goal/context_json.\n- selected must come from openAlternatives.\n- If deterministic behavior is required, set seedStrategy to stable seeded selection.',
}
