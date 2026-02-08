import type { ExecEdge, ExecNode } from '../../ir/types';
import type {
  WorkflowDocument,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
} from '../../workflow/types';
import type { AnalyzedGraph } from '../types';

export interface ExecIrFragment {
  nodes: ExecNode[];
  edges: ExecEdge[];
  requiredTemplates: string[];
}

export interface LoweringContext {
  workflow: WorkflowDocument;
  graph: AnalyzedGraph;
  allNodes: Map<string, WorkflowNode>;
  incomingEdges: Map<string, WorkflowEdge[]>;
  outgoingEdges: Map<string, WorkflowEdge[]>;
}

export interface Lowerer {
  nodeType: WorkflowNodeType;
  lower(node: WorkflowNode, context: LoweringContext): ExecIrFragment;
}

export class UnsupportedNodeError extends Error {
  constructor(type: WorkflowNodeType) {
    super(`Unsupported workflow node type for ExecIR lowering: ${type}`);
    this.name = 'UnsupportedNodeError';
  }
}
