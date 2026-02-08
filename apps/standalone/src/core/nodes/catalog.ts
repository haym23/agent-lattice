import type { WorkflowNodeType } from '../workflow/types';

export type NodeCategory = 'core-ai' | 'logic' | 'data' | 'output' | 'agent';

export interface NodeDefinition {
  type: WorkflowNodeType;
  category: NodeCategory;
  title: string;
  description: string;
  defaultConfig: Record<string, unknown>;
}

export const nodeCatalog: NodeDefinition[] = [
  {
    type: 'llmCall',
    category: 'core-ai',
    title: 'LLM Call',
    description: 'Execute a model completion step.',
    defaultConfig: { temperature: 0.2 },
  },
  {
    type: 'promptTemplate',
    category: 'core-ai',
    title: 'Prompt Template',
    description: 'Prepare prompt with variables.',
    defaultConfig: { template: '' },
  },
  {
    type: 'systemInstruction',
    category: 'core-ai',
    title: 'System Instruction',
    description: 'Attach system behavior instruction.',
    defaultConfig: { instruction: '' },
  },
  {
    type: 'fewShotBank',
    category: 'core-ai',
    title: 'Few-Shot Bank',
    description: 'Attach examples for context.',
    defaultConfig: { examples: [] },
  },
  {
    type: 'conditionalBranch',
    category: 'logic',
    title: 'Conditional Branch',
    description: '2-way branch based on condition.',
    defaultConfig: { condition: '' },
  },
  {
    type: 'switchCase',
    category: 'logic',
    title: 'Switch/Case',
    description: 'Multi-branch routing.',
    defaultConfig: { cases: [] },
  },
  {
    type: 'loop',
    category: 'logic',
    title: 'Loop',
    description: 'Iterative processing.',
    defaultConfig: { maxIterations: 5 },
  },
  {
    type: 'errorHandler',
    category: 'logic',
    title: 'Error Handler',
    description: 'Handle failures and fallback.',
    defaultConfig: { strategy: 'retry' },
  },
  {
    type: 'inputForm',
    category: 'data',
    title: 'Input Form',
    description: 'Collect user input fields.',
    defaultConfig: { fields: [] },
  },
  {
    type: 'fileReader',
    category: 'data',
    title: 'File Reader',
    description: 'Read file payload.',
    defaultConfig: { path: '' },
  },
  {
    type: 'apiCall',
    category: 'data',
    title: 'API Call',
    description: 'Call REST endpoint.',
    defaultConfig: { method: 'GET', url: '' },
  },
  {
    type: 'jsonCsvParse',
    category: 'data',
    title: 'JSON/CSV Parse',
    description: 'Parse structured input.',
    defaultConfig: { format: 'json' },
  },
  {
    type: 'textResponse',
    category: 'output',
    title: 'Text Response',
    description: 'Render response text.',
    defaultConfig: { channel: 'ui' },
  },
  {
    type: 'fileWriter',
    category: 'output',
    title: 'File Writer',
    description: 'Write output to file.',
    defaultConfig: { path: '' },
  },
  {
    type: 'webhookPush',
    category: 'output',
    title: 'Webhook Push',
    description: 'Send webhook output.',
    defaultConfig: { endpoint: '' },
  },
  {
    type: 'flow',
    category: 'agent',
    title: 'Flow',
    description:
      'Reusable function-like block. A Flow can include any building blocks available in the editor.',
    defaultConfig: { flowId: '' },
  },
  {
    type: 'humanInTheLoopGate',
    category: 'agent',
    title: 'Human-in-the-Loop',
    description: 'Pause for human approval.',
    defaultConfig: { required: true },
  },
  {
    type: 'start',
    category: 'logic',
    title: 'Start',
    description: 'Workflow entry point.',
    defaultConfig: {},
  },
  {
    type: 'end',
    category: 'logic',
    title: 'End',
    description: 'Workflow exit point.',
    defaultConfig: {},
  },
];

export function getNodeDefinition(type: WorkflowNodeType): NodeDefinition {
  const node = nodeCatalog.find((entry) => entry.type === type);
  if (!node) throw new Error(`Unknown node type: ${type}`);
  return node;
}
