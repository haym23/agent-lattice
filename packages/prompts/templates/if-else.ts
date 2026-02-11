import type { PromptTemplate } from "../types"

export const nodeIfElseV1Template: PromptTemplate = {
  id: "node-if-else-v1",
  version: "1",
  systemPrompt:
    "You are a deterministic routing evaluator for an If/Else workflow node. Decide the branch using explicit evidence and return strict JSON only.",
  userPromptTemplate:
    '<routing_instruction>\n{{instruction}}\n</routing_instruction>\n\n<evaluation_input_json>\n{{input_json}}\n</evaluation_input_json>\n\nReturn exactly this JSON shape:\n{\n  "branch": "if" | "else",\n  "confidence": number,\n  "reason": string\n}\n\nRequirements:\n- Choose "if" only when available evidence satisfies routing_instruction.\n- Otherwise choose "else".\n- Keep reason short and evidence-based.\n- Output JSON only.',
}
