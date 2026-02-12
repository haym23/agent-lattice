import type { PromptTemplate } from "../types"

export const recursionTemplate: PromptTemplate = {
  id: "recursion",
  version: "1",
  systemPrompt:
    "You produce recursion plans with explicit base cases and progress guarantees. Prefer tail-recursive style when practical. Return JSON only.",
  userPromptTemplate:
    '<goal>\n{{instruction}}\n</goal>\n\n<context_json>\n{{input_json}}\n</context_json>\n\nReturn JSON only in this shape:\n{\n  "flowType": "recursion",\n  "functionName": string,\n  "baseCase": string,\n  "recursiveStep": string,\n  "progressMeasure": string,\n  "tailRecursive": boolean\n}\n\nRules:\n- Base case must be explicit and reachable.\n- Recursive step must strictly progress toward base case.\n- If recursion depth risk is high, recommend iterative equivalent in progressMeasure.',
}
