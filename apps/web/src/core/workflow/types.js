export const WORKFLOW_NODE_TYPES = [
    "start",
    "end",
    "prompt",
    "subAgent",
    "askUserQuestion",
    "ifElse",
    "switch",
    "skill",
    "mcp",
    "flow",
    "codex",
    "branch",
    "parallel",
    "httpRequest",
    "dataTransform",
    "delay",
    "webhookTrigger",
    "variableStore",
    "codeExecutor",
    "batchIterator",
];
const workflowNodeTypeSet = new Set(WORKFLOW_NODE_TYPES);
export function isWorkflowNodeType(value) {
    return workflowNodeTypeSet.has(value);
}
//# sourceMappingURL=types.js.map