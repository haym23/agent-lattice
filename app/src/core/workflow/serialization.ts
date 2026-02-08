import type { Edge, Node } from 'reactflow';

import {
  isWorkflowNodeType,
  type WorkflowDocument,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeType,
} from './types';

function toWorkflowNodeType(type: string | undefined): WorkflowNodeType {
  if (!type) return 'subAgent';
  if (isWorkflowNodeType(type)) return type;
  return 'subAgent';
}

export function serializeWorkflowFromCanvas(input: {
  id?: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
}): WorkflowDocument {
  const now = new Date().toISOString();
  const id = input.id ?? `workflow_${Date.now()}`;

  const nodes: WorkflowNode[] = input.nodes.map((node) => ({
    id: node.id,
    type: toWorkflowNodeType(node.type),
    label: String((node.data as Record<string, unknown> | undefined)?.label ?? node.id),
    position: node.position,
    config: (node.data as Record<string, unknown>) ?? {},
  }));

  const edges: WorkflowEdge[] = input.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
  }));

  const workflow: WorkflowDocument = {
    id,
    name: input.name,
    description: input.description,
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    nodes,
    edges,
  };

  validateWorkflowDocument(workflow);
  return workflow;
}

export function deserializeWorkflowToCanvas(workflow: WorkflowDocument): {
  nodes: Node[];
  edges: Edge[];
} {
  validateWorkflowDocument(workflow);
  const nodes: Node[] = workflow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.config,
      label: node.label,
    },
  }));
  const edges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));
  return { nodes, edges };
}

export function validateWorkflowDocument(workflow: WorkflowDocument): void {
  if (!workflow.id) throw new Error('Workflow id is required');
  if (!workflow.name || workflow.name.length > 100) throw new Error('Workflow name is invalid');
  if (workflow.nodes.length > 200) throw new Error('Workflow node limit exceeded');

  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  for (const node of workflow.nodes) {
    if (!isWorkflowNodeType(node.type)) {
      throw new Error(`Unsupported node type: ${node.type}`);
    }
  }

  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(`Edge ${edge.id} references missing node`);
    }
  }
}
