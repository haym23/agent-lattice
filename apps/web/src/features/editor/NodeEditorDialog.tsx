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
            className="token-panel"
            style={{
              width: "min(640px, 92vw)",
              maxHeight: "82vh",
              overflow: "auto",
              padding: 16,
            }}
          >
            <Dialog.Title style={{ margin: 0 }}>Node Editor</Dialog.Title>
            {!selectedNode ? (
              <p style={{ color: "#64748b", marginTop: 12 }}>
                Click a node on the canvas to edit its settings.
              </p>
            ) : (
              <>
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
                  style={{ display: "block", marginBottom: 6 }}
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
                    onSelectedNodeConfigJsonChange(event.target.value)
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
                  onClick={onApplyNodeChanges}
                  style={{ marginTop: 10 }}
                >
                  Apply Node Changes
                </button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
