import type { WorkflowNodeType } from "../../../core/workflow/types"

import batchIteratorIcon from "./nodes/batch-iterator.svg"
import branchIcon from "./nodes/branch.svg"
import codeExecutorIcon from "./nodes/code-executor.svg"
import codexIcon from "./nodes/codex.svg"
import dataTransformIcon from "./nodes/data-transform.svg"
import delayIcon from "./nodes/delay.svg"
import endIcon from "./nodes/end.svg"
import flowIcon from "./nodes/flow.svg"
import httpRequestIcon from "./nodes/http-request.svg"
import ifElseIcon from "./nodes/if-else.svg"
import mcpIcon from "./nodes/mcp.svg"
import parallelIcon from "./nodes/parallel.svg"
import promptIcon from "./nodes/prompt.svg"
import questionIcon from "./nodes/question.svg"
import skillIcon from "./nodes/skill.svg"
import startIcon from "./nodes/start.svg"
import subAgentIcon from "./nodes/sub-agent.svg"
import switchIcon from "./nodes/switch.svg"
import variableStoreIcon from "./nodes/variable-store.svg"
import webhookTriggerIcon from "./nodes/webhook-trigger.svg"

export const nodeTypeIconMap: Record<WorkflowNodeType, string> = {
  start: startIcon,
  end: endIcon,
  prompt: promptIcon,
  subAgent: subAgentIcon,
  askUserQuestion: questionIcon,
  ifElse: ifElseIcon,
  switch: switchIcon,
  skill: skillIcon,
  mcp: mcpIcon,
  flow: flowIcon,
  codex: codexIcon,
  branch: branchIcon,
  parallel: parallelIcon,
  httpRequest: httpRequestIcon,
  dataTransform: dataTransformIcon,
  delay: delayIcon,
  webhookTrigger: webhookTriggerIcon,
  variableStore: variableStoreIcon,
  codeExecutor: codeExecutorIcon,
  batchIterator: batchIteratorIcon,
}

export function getNodeTypeIcon(type: WorkflowNodeType): string {
  return nodeTypeIconMap[type]
}
