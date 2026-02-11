import * as Dialog from "@radix-ui/react-dialog"
import { useEffect, useState } from "react"

interface CompilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
}

/**
 * Executes compile preview dialog.
 */
export function CompilePreviewDialog({
  open,
  onOpenChange,
  content,
}: CompilePreviewDialogProps): JSX.Element {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  )

  useEffect(() => {
    if (!open) {
      setCopyState("idle")
    }
  }, [open])

  useEffect(() => {
    if (copyState === "idle") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle")
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [copyState])

  const handleCopy = () => {
    void navigator.clipboard
      .writeText(content)
      .then(() => setCopyState("copied"))
      .catch(() => setCopyState("failed"))
  }

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
            className="token-panel compile-preview-dialog"
            style={{
              width: "min(920px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 24px)",
              padding: 16,
            }}
          >
            <div className="compile-preview-dialog-header">
              <Dialog.Title style={{ margin: 0 }}>
                Compiled Output Preview
              </Dialog.Title>
              <button
                type="button"
                onClick={handleCopy}
                className="workflow-btn workflow-btn--secondary"
              >
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "failed"
                    ? "Copy Failed"
                    : "Copy Prompt"}
              </button>
            </div>
            <pre className="compile-preview-dialog-content">{content}</pre>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
