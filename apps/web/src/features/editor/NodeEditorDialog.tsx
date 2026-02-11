import * as Dialog from "@radix-ui/react-dialog"
import type { Node } from "reactflow"

interface NodeEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedNode: Node | null
  selectedNodeIcon: string | null
  selectedNodeLabel: string
  selectedNodeConfigJson: string
  configError: string | null
  onSelectedNodeLabelChange: (value: string) => void
  onSelectedNodeConfigJsonChange: (value: string) => void
  onApplyNodeChanges: () => void
  onDeleteSelectedNode: () => void
}

export function NodeEditorDialog({
  open,
  onOpenChange,
  selectedNode,
  selectedNodeIcon,
  selectedNodeLabel,
  selectedNodeConfigJson,
  configError,
  onSelectedNodeLabelChange,
  onSelectedNodeConfigJsonChange,
  onApplyNodeChanges,
  onDeleteSelectedNode,
}: NodeEditorDialogProps): JSX.Element {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Dialog.Content
            className="token-panel node-editor-dialog"
            style={{
              width: "min(640px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 24px)",
              padding: 16,
            }}
          >
            <Dialog.Title style={{ margin: 0 }}>Node Editor</Dialog.Title>
            {!selectedNode ? (
              <p style={{ color: "#64748b", marginTop: 12 }}>
                Click a node on the canvas to edit its settings.
              </p>
            ) : (
              <div className="node-editor-dialog-body">
                <p style={{ margin: "8px 0", color: "#64748b", fontSize: 12 }}>
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
                  className="node-editor-dialog-label"
                  htmlFor="node-label-input"
                >
                  Label
                </label>
                <input
                  id="node-label-input"
                  value={selectedNodeLabel}
                  onChange={(event) =>
                    onSelectedNodeLabelChange(event.target.value)
                  }
                  className="node-editor-dialog-input"
                />
                <label
                  className="node-editor-dialog-label"
                  htmlFor="node-config-input"
                >
                  Config (JSON)
                </label>
                <textarea
                  id="node-config-input"
                  value={selectedNodeConfigJson}
                  onChange={(event) =>
                    onSelectedNodeConfigJsonChange(event.target.value)
                  }
                  rows={12}
                  className="node-editor-dialog-textarea"
                />
                {configError ? (
                  <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>
                    {configError}
                  </p>
                ) : null}
                <div className="node-editor-dialog-actions">
                  <button
                    type="button"
                    onClick={onDeleteSelectedNode}
                    className="workflow-btn node-editor-dialog-delete-btn"
                  >
                    Delete Node
                  </button>
                  <button
                    type="button"
                    onClick={onApplyNodeChanges}
                    className="workflow-btn workflow-btn--primary"
                  >
                    Apply Node Changes
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
