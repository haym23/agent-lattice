import { useEffect, useMemo, useState } from "react"

import { nodeCatalog } from "../../core/nodes/catalog"
import { deserializeWorkflowToCanvas } from "../../core/workflow/serialization"
import {
  isWorkflowNodeType,
  type WorkflowDocument,
} from "../../core/workflow/types"
import { PageShell } from "../shared/PageShell"
import { CompilePreviewDialog } from "./CompilePreviewDialog"
import { ExecutionPanel } from "./execution/ExecutionPanel"
import { NodePicker } from "./header/NodePicker"
import { getNodeTypeIcon } from "./icons/nodeTypeIconMap"
import { WorkflowCanvas } from "./WorkflowCanvas"
import {
  compileForTarget,
  listModels,
  listStoredWorkflows,
  loadStoredWorkflow,
  saveCurrentWorkflow,
} from "./workflowService"
import { useWorkflowStore } from "./workflowStore"

/**
 * Executes editor page.
 */
export function EditorPage(): JSX.Element {
  const { addNode, nodes, edges, selectedNodeId, updateSelectedNode } =
    useWorkflowStore()
  const [workflowName, setWorkflowName] = useState("new-workflow")
  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowDocument[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [modelId, setModelId] = useState("claude-sonnet")
  const [target, setTarget] = useState<
    "claude" | "openai-assistants" | "portable-json"
  >("claude")
  const [compilePreview, setCompilePreview] = useState("")
  const [isCompileDialogOpen, setIsCompileDialogOpen] = useState(false)
  const [nextNodeType, setNextNodeType] = useState("subAgent")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNodeLabel, setSelectedNodeLabel] = useState("")
  const [selectedNodeConfigJson, setSelectedNodeConfigJson] = useState("{}")
  const [configError, setConfigError] = useState<string | null>(null)

  const models = listModels()
  const selectedModel =
    models.find((model) => model.id === modelId) ?? models[0] ?? null
  const nextNodeIcon = isWorkflowNodeType(nextNodeType)
    ? getNodeTypeIcon(nextNodeType)
    : null
  const nextNodeDefinition =
    nodeCatalog.find((node) => node.type === nextNodeType) ?? nodeCatalog[0]
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  )
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

  const handleSave = async () => {
    const saved = await saveCurrentWorkflow({
      id: selectedId || undefined,
      name: workflowName,
      nodes,
      edges,
    })
    setSelectedId(saved.id)
  }

  const handleRefresh = async () => {
    setSavedWorkflows(await listStoredWorkflows())
  }

  const handleLoad = async () => {
    if (!selectedId) return
    const workflow = await loadStoredWorkflow(selectedId)
    if (!workflow) return
    const canvas = deserializeWorkflowToCanvas(workflow)
    useWorkflowStore.setState({ nodes: canvas.nodes, edges: canvas.edges })
    setWorkflowName(workflow.name)
  }

  const handleCompile = async () => {
    if (!selectedId) return
    const workflow = await loadStoredWorkflow(selectedId)
    if (!workflow) return
    const result = await compileForTarget({ workflow, modelId, target })
    setCompilePreview(
      result.files
        .map(
          (file: { path: string; content: string }) =>
            `${file.path}\n${file.content}`
        )
        .join("\n\n---\n\n")
    )
    setIsCompileDialogOpen(true)
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
        description="TODO update basic workflow editor header."
      />
      <section className="card" style={{ marginTop: 12 }}>
        <header className="workflow-header">
          <NodePicker
            nextNodeType={nextNodeType}
            setNextNodeType={setNextNodeType}
            addNode={addNode}
          />
          <section className="workflow-header-group">
            <h3 className="workflow-header-title">Workflow Actions</h3>
            <div className="workflow-header-controls">
              <input
                className="workflow-input"
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                aria-label="workflow-name"
              />
              <button type="button" onClick={handleSave}>
                Save (IndexedDB)
              </button>
              <button type="button" onClick={handleRefresh}>
                Refresh List
              </button>
              <select
                className="workflow-input"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                <option value="">Select workflow</option>
                {savedWorkflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleLoad}>
                Load
              </button>
            </div>
          </section>
          <section className="workflow-header-group workflow-header-group--models">
            <h3 className="workflow-header-title">Model + Compile</h3>
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
            <div className="workflow-header-controls">
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
              >
                <option value="claude">.claude</option>
                <option value="openai-assistants">OpenAI Assistants</option>
                <option value="portable-json">Portable JSON</option>
              </select>
              <button type="button" onClick={handleCompile}>
                Compile {selectedModel ? `(${selectedModel.displayName})` : ""}
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
          <WorkflowCanvas searchTerm={searchTerm} />
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
