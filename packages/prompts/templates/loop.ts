import type { PromptTemplate } from "../types"

export const loopTemplate: PromptTemplate = {
  id: "loop",
  version: "1",
  systemPrompt:
    "You design safe iterative control flow (while, until, times, for-each, range). Enforce termination and bounded work. Return JSON only.",
  userPromptTemplate:
    '<goal>\n{{instruction}}\n</goal>\n\n<loop_context_json>\n{{input_json}}\n</loop_context_json>\n\nReturn JSON only in this shape:\n{\n  "flowType": "iterative",\n  "loopKind": "while" | "until" | "times" | "for_each" | "range",\n  "initializer": string,\n  "condition": string,\n  "step": string,\n  "maxIterations": number,\n  "terminationReason": string\n}\n\nRules:\n- Always include maxIterations > 0 to prevent runaway loops.\n- Prefer for_each/range when collection bounds are known.\n- Never use unbounded loops unless goal explicitly requires them and still include a safety cap.',
}
