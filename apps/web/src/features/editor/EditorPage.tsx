import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import type { Edge, Node } from "reactflow"

import {
  deserializeWorkflowToCanvas,
  serializeWorkflowFromCanvas,
} from "../../core/workflow/serialization"
import { isWorkflowNodeType } from "../../core/workflow/types"
import { PageShell } from "../shared/PageShell"
import { CompilePreviewDialog } from "./CompilePreviewDialog"
import { ExecutionPanel } from "./execution/ExecutionPanel"
import { NodePicker } from "./header/NodePicker"
import { getNodeTypeIcon } from "./icons/nodeTypeIconMap"
import { WorkflowCanvas } from "./WorkflowCanvas"
import {
  compileForTarget,
  listModels,
  loadStoredWorkflow,
  saveCurrentWorkflow,
} from "./workflowService"
import { useWorkflowStore } from "./workflowStore"

interface EditorSnapshot {
  name: string
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    sourceHandle?: string
    targetHandle?: string
  }>
}

function buildEditorSnapshot(input: {
  name: string
  nodes: Node[]
  edges: Edge[]
}): string {
  const nodes = input.nodes
    .map((node) => ({
      id: node.id,
      type: String(node.type ?? ""),
      position: {
        x: Number(node.position?.x ?? 0),
        y: Number(node.position?.y ?? 0),
      },
      data: (node.data as Record<string, unknown>) ?? {},
    }))
    .sort((left, right) => left.id.localeCompare(right.id))

  const edges = input.edges
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
    }))
    .sort((left, right) => left.id.localeCompare(right.id))

  const snapshot: EditorSnapshot = {
    name: input.name.trim(),
    nodes,
    edges,
  }

  return JSON.stringify(snapshot)
}

/**
 * Executes editor page.
 */
export function EditorPage(): JSX.Element {
  const { id: routeWorkflowId } = useParams<{ id?: string }>()
  const { addNode, nodes, edges, selectedNodeId, updateSelectedNode } =
    useWorkflowStore()
  const [workflowName, setWorkflowName] = useState("new-workflow")
  const [modelId, setModelId] = useState("claude-sonnet")
  const [target, setTarget] = useState<
    "claude" | "openai-assistants" | "portable-json"
  >("claude")
  const [compilePreview, setCompilePreview] = useState("")
  const [isCompileDialogOpen, setIsCompileDialogOpen] = useState(false)
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [nextNodeType, setNextNodeType] = useState("subAgent")
  const [selectedNodeLabel, setSelectedNodeLabel] = useState("")
  const [selectedNodeConfigJson, setSelectedNodeConfigJson] = useState("{}")
  const [configError, setConfigError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastPersistedSnapshot, setLastPersistedSnapshot] = useState<
    string | null
  >(null)

  const models = listModels()
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )
  const currentSnapshot = useMemo(
    () => buildEditorSnapshot({ name: workflowName, nodes, edges }),
    [workflowName, nodes, edges]
  )
  const isDirty =
    lastPersistedSnapshot === null || currentSnapshot !== lastPersistedSnapshot
  const persistenceBadge = isSaving ? "saving" : isDirty ? "dirty" : "saved"
  const selectedNodeType = selectedNode ? String(selectedNode.type) : null
  const selectedNodeIcon = useMemo(() => {
    if (!selectedNodeType || !isWorkflowNodeType(selectedNodeType)) {
      return null
    }

    return getNodeTypeIcon(selectedNodeType)
  }, [selectedNodeType])

  useEffect(() => {
    if (!selectedNode) {
      setSelectedNodeLabel("")
      setSelectedNodeConfigJson("{}")
      setConfigError(null)
      return
    }

    const data = (selectedNode.data as Record<string, unknown>) ?? {}
    const { label, ...config } = data
    setSelectedNodeLabel(String(label ?? ""))
    setSelectedNodeConfigJson(JSON.stringify(config, null, 2))
    setConfigError(null)
  }, [selectedNode])

  useEffect(() => {
    void (async () => {
      if (!routeWorkflowId) {
        return
      }

      try {
        const workflow = await loadStoredWorkflow(routeWorkflowId)
        if (!workflow) {
          return
        }

        const canvas = deserializeWorkflowToCanvas(workflow)
        useWorkflowStore.setState({
          nodes: canvas.nodes,
          edges: canvas.edges,
          selectedNodeId: null,
        })
        setWorkflowName(workflow.name)
        setLastPersistedSnapshot(
          buildEditorSnapshot({
            name: workflow.name,
            nodes: canvas.nodes,
            edges: canvas.edges,
          })
        )
      } catch {
        setLastPersistedSnapshot(null)
      }
    })()
  }, [routeWorkflowId])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saved = await saveCurrentWorkflow({
        id: routeWorkflowId || undefined,
        name: workflowName,
        nodes,
        edges,
        mode: "save",
      })
      setWorkflowName(saved.name)
      setLastPersistedSnapshot(
        buildEditorSnapshot({ name: saved.name, nodes, edges })
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompile = async () => {
    setIsCompiling(true)
    setCompileError(null)

    try {
      const workflow = serializeWorkflowFromCanvas({
        id: routeWorkflowId || undefined,
        name: workflowName,
        nodes,
        edges,
      })
      const result = await compileForTarget({ workflow, modelId, target })
      setCompilePreview(
        result.files
          .map(
            (file: { path: string; content: string }) =>
              `${file.path}\n${file.content}`
          )
          .join("\n\n---\n\n")
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown compile failure"
      setCompileError(message)
      setCompilePreview(`Compile failed:\n${message}`)
    } finally {
      setIsCompiling(false)
      setIsCompileDialogOpen(true)
    }
  }

  const handleRunFromToolbar = () => {
    window.alert(
      "Server-side run is coming soon. This button will execute the workflow with the selected model."
    )
  }

  const handleApplyNodeChanges = () => {
    if (!selectedNode) return

    try {
      const parsed = JSON.parse(selectedNodeConfigJson) as Record<
        string,
        unknown
      >
      updateSelectedNode({
        label: selectedNodeLabel.trim() || String(selectedNode.type ?? "node"),
        config: parsed,
      })
      setConfigError(null)
    } catch {
      setConfigError("Config must be valid JSON.")
    }
  }

  return (
    <main className="page">
      <PageShell
        title="Workflow Editor"
        description="Build and iterate workflows using the compact action toolbar."
      />
      <section className="card" style={{ marginTop: 12 }}>
        <header className="workflow-toolbar" role="toolbar">
          <section className="workflow-toolbar-group">
            <h3 className="workflow-toolbar-title">Node</h3>
            <NodePicker
              nextNodeType={nextNodeType}
              setNextNodeType={setNextNodeType}
              addNode={addNode}
            />
          </section>
          <section className="workflow-toolbar-group">
            <h3 className="workflow-toolbar-title">Workflow</h3>
            <div className="workflow-toolbar-controls">
              <span
                className={`workflow-persistence-badge workflow-persistence-badge--${persistenceBadge.replace(
                  " ",
                  "-"
                )}`}
              >
                {persistenceBadge}
              </span>
              <input
                className="workflow-input"
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                aria-label="workflow-name"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                aria-label="save-workflow"
                className="workflow-btn workflow-btn--primary"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCompile}
                disabled={isCompiling}
                className="workflow-btn workflow-btn--accent"
              >
                {isCompiling ? "Compiling..." : "Compile"}
              </button>
            </div>
            {compileError ? (
              <p style={{ margin: 0, color: "#b91c1c", fontSize: 11 }}>
                Last compile failed: {compileError}
              </p>
            ) : ""}
          </section>
          <section className="workflow-toolbar-group workflow-toolbar-group--compile">
            <h3 className="workflow-toolbar-title">Compile</h3>
            <div className="workflow-model-picker">
              {models.map((model) => {
                const isSelected = model.id === modelId
                const logoBackground =
                  model.provider === "Anthropic" ? "#f59e0b" : "#10b981"
                return (
                  <button
                    key={model.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setModelId(model.id)}
                    className={
                      isSelected
                        ? "workflow-model-option workflow-model-option--selected"
                        : "workflow-model-option"
                    }
                  >
                    <span
                      className="workflow-model-logo"
                      aria-hidden="true"
                      style={{ backgroundColor: logoBackground }}
                    >
                      {model.logoText}
                    </span>
                    <span className="workflow-model-meta">
                      <span className="workflow-model-name">
                        {model.displayName}
                      </span>
                      <span className="workflow-model-provider">
                        {model.provider}
                      </span>
                      <span className="workflow-model-preview">
                        {model.preview}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="workflow-toolbar-controls">
              <select
                className="workflow-input"
                value={target}
                onChange={(event) =>
                  setTarget(
                    event.target.value as
                      | "claude"
                      | "openai-assistants"
                      | "portable-json"
                  )
                }
                aria-label="compile-target-select"
              >
                <option value="claude">.claude</option>
                <option value="openai-assistants">OpenAI Assistants</option>
                <option value="portable-json">Portable JSON</option>
              </select>

              <button
                type="button"
                onClick={handleRunFromToolbar}
                aria-label="run-workflow"
                className="workflow-btn workflow-btn--accent"
              >
                Run
              </button>
            </div>
          </section>
        </header>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 2fr) minmax(280px, 1fr) minmax(280px, 1fr)",
            gap: 12,
            alignItems: "start",
          }}
        >
          <WorkflowCanvas searchTerm="" />
          <aside className="card" style={{ minHeight: 520 }}>
            <h3 style={{ marginTop: 0 }}>Node Editor</h3>
            {!selectedNode ? (
              <p style={{ color: "#64748b" }}>
                Click a node on the canvas to edit its settings.
              </p>
            ) : (
              <>
                <p
                  style={{ margin: "0 0 8px", color: "#64748b", fontSize: 12 }}
                >
                  {selectedNode.type} ({selectedNode.id})
                </p>
                {selectedNodeIcon ? (
                  <img
                    src={selectedNodeIcon}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    style={{ marginBottom: 8 }}
                  />
                ) : null}
                <label
                  style={{ display: "block", marginBottom: 6 }}
                  htmlFor="node-label-input"
                >
                  Label
                </label>
                <input
                  id="node-label-input"
                  value={selectedNodeLabel}
                  onChange={(event) => setSelectedNodeLabel(event.target.value)}
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <label
                  style={{ display: "block", marginBottom: 6 }}
                  htmlFor="node-config-input"
                >
                  Config (JSON)
                </label>
                <textarea
                  id="node-config-input"
                  value={selectedNodeConfigJson}
                  onChange={(event) =>
                    setSelectedNodeConfigJson(event.target.value)
                  }
                  rows={16}
                  style={{
                    width: "100%",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                />
                {configError ? (
                  <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
                    {configError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleApplyNodeChanges}
                  style={{ marginTop: 10 }}
                >
                  Apply Node Changes
                </button>
              </>
            )}
          </aside>
          <ExecutionPanel workflowName={workflowName} />
        </div>
      </section>
      <CompilePreviewDialog
        open={isCompileDialogOpen}
        onOpenChange={setIsCompileDialogOpen}
        content={compilePreview}
      />
    </main>
  )
}
