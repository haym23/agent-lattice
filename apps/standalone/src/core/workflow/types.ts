export type WorkflowNodeType =
  | 'start'
  | 'end'
  | 'llmCall'
  | 'promptTemplate'
  | 'systemInstruction'
  | 'fewShotBank'
  | 'conditionalBranch'
  | 'switchCase'
  | 'loop'
  | 'errorHandler'
  | 'inputForm'
  | 'fileReader'
  | 'apiCall'
  | 'jsonCsvParse'
  | 'textResponse'
  | 'fileWriter'
  | 'webhookPush'
  | 'flow'
  | 'humanInTheLoopGate';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowDocument {
  id: string;
  name: string;
  description?: string;
  version: '1.0.0';
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, unknown>;
}
