import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  NodeMouseHandler,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from "reactflow"
import { addEdge, applyEdgeChanges, applyNodeChanges } from "reactflow"
import { create } from "zustand"

import { getNodeDefinition } from "../../core/nodes/catalog"

export interface EditorState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  onNodeClick: NodeMouseHandler
  addNode: (type: string) => void
  updateSelectedNode: (input: {
    label: string
    config: Record<string, unknown>
  }) => void
  deleteSelectedNode: () => void
}

const initialNodes: Node[] = [
  {
    id: "start",
    type: "start",
    position: { x: 100, y: 100 },
    data: { label: "Start" },
  },
  {
    id: "end",
    type: "end",
    position: { x: 500, y: 100 },
    data: { label: "End" },
  },
]

export const useWorkflowStore = create<EditorState>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeId: null,
  onNodesChange: (changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, get().nodes)
    const selectedNodeId = get().selectedNodeId
    const selectedExists = selectedNodeId
      ? nextNodes.some((node) => node.id === selectedNodeId)
      : false
    set({
      nodes: nextNodes,
      selectedNodeId: selectedExists ? selectedNodeId : null,
    })
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) })
  },
  onConnect: (connection: Connection) => {
    set({ edges: addEdge(connection, get().edges) })
  },
  onNodeClick: (_event, node) => {
    set({ selectedNodeId: node.id })
  },
  addNode: (type: string) => {
    const definition = getNodeDefinition(
      type as Parameters<typeof getNodeDefinition>[0]
    )
    const nodeId = `${type}-${crypto.randomUUID()}`
    const y = 180 + get().nodes.length * 80
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
      selectedNodeId: nodeId,
    })
  },
  updateSelectedNode: ({ label, config }) => {
    const selectedNodeId = get().selectedNodeId
    if (!selectedNodeId) {
      return
    }

    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== selectedNodeId) {
          return node
        }

        return {
          ...node,
          data: {
            ...config,
            label,
          },
        }
      }),
    })
  },
  deleteSelectedNode: () => {
    const selectedNodeId = get().selectedNodeId
    if (!selectedNodeId) {
      return
    }

    set({
      nodes: get().nodes.filter((node) => node.id !== selectedNodeId),
      edges: get().edges.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId
      ),
      selectedNodeId: null,
    })
  },
}))
