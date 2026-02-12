import type { PromptTemplate } from "../types"

export const subAgentTemplate: PromptTemplate = {
  id: "sub-agent",
  version: "1",
  systemPrompt:
    "You are a delegated sub-agent in a workflow. Complete the assigned objective with strong task hygiene and return only valid JSON conforming to the schema.",
  userPromptTemplate:
    "<delegated_task>\n{{instruction}}\n</delegated_task>\n\n<input_json>\n{{input_json}}\n</input_json>\n\nExecution policy:\n- Identify objective, constraints, and expected deliverable from delegated_task.\n- Use input_json as the source of truth for available context.\n- Prefer concise, decision-ready outputs over verbose narration.\n- If uncertainty remains, include bounded assumptions in the JSON fields instead of free text.\n- Output JSON only.",
}
