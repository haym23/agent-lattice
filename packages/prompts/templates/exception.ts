import type { PromptTemplate } from "../types"

export const exceptionTemplate: PromptTemplate = {
  id: "exception",
  version: "1",
  systemPrompt:
    "You plan exception/error handling flow. Prefer explicit recoverable errors, classify severity, and avoid swallowing failures. Return JSON only.",
  userPromptTemplate:
    '<goal>\n{{instruction}}\n</goal>\n\n<error_context_json>\n{{input_json}}\n</error_context_json>\n\nReturn JSON only in this shape:\n{\n  "flowType": "exception",\n  "errorClass": "recoverable" | "non_recoverable" | "panic",\n  "raiseWhen": string,\n  "catchWhen": string,\n  "recoveryPlan": [string],\n  "propagate": boolean\n}\n\nRules:\n- Classify as recoverable unless evidence requires panic/non_recoverable.\n- Never hide errors silently; include explicit propagation decision.\n- Keep recoveryPlan bounded and deterministic.',
}
