import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from 'reactflow';
import { addEdge, applyEdgeChanges, applyNodeChanges } from 'reactflow';
import { create } from 'zustand';

import { getNodeDefinition } from '../../core/nodes/catalog';

export interface EditorState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: string) => void;
}

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: 'Start' },
  },
  {
    id: 'end',
    type: 'output',
    position: { x: 500, y: 100 },
    data: { label: 'End' },
  },
];

export const useWorkflowStore = create<EditorState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  addNode: (type: string) => {
    const definition = getNodeDefinition(type as Parameters<typeof getNodeDefinition>[0]);
    const nodeId = `${type}-${crypto.randomUUID()}`;
    const y = 180 + get().nodes.length * 80;
    set({
      nodes: [
        ...get().nodes,
        {
          id: nodeId,
          type,
          position: { x: 280, y },
          data: { label: definition.title, ...definition.defaultConfig },
        },
      ],
    });
  },
}));
