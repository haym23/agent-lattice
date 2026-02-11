import type { PromptTemplate } from "../types"

export const nodeSwitchV1Template: PromptTemplate = {
  id: "node-switch-v1",
  version: "1",
  systemPrompt:
    "You are a deterministic routing evaluator for a Switch workflow node. Map input to one branch label and return strict JSON only.",
  userPromptTemplate:
    '<routing_instruction>\n{{instruction}}\n</routing_instruction>\n\n<evaluation_input_json>\n{{input_json}}\n</evaluation_input_json>\n\n<allowed_branches_json>\n{{branches_json}}\n</allowed_branches_json>\n\nReturn exactly this JSON shape:\n{\n  "branch": string,\n  "confidence": number,\n  "reason": string\n}\n\nRequirements:\n- branch must be one of allowed_branches_json.\n- If uncertain, choose the most conservative valid branch.\n- Keep reason short and evidence-based.\n- Output JSON only.',
}
