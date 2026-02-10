import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import type { WorkflowDocument } from "../../core/workflow/types"
import {
  deleteStoredWorkflow,
  listStoredWorkflows,
} from "../editor/workflowService"
import { PageShell } from "../shared/PageShell"

/**
 * Executes dashboard page.
 */
export function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState<WorkflowDocument[]>([])

  useEffect(() => {
    void listStoredWorkflows()
      .then(setWorkflows)
      .catch(() => setWorkflows([]))
  }, [])

  const handleNew = () => {
    const id = `workflow_${Date.now()}`
    navigate(`/editor/${id}`)
  }

  const handleDelete = async (id: string) => {
    await deleteStoredWorkflow(id)
    setWorkflows(await listStoredWorkflows())
  }

  return (
    <main className="page">
      <PageShell
        title="Dashboard"
        description="Your saved workflows. Create a new one or open an existing workflow."
      />
      <section className="card" style={{ marginTop: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0 }}>Workflows</h2>
          <button type="button" onClick={handleNew}>
            + New Workflow
          </button>
        </div>
        {workflows.length === 0 ? (
          <p style={{ color: "#64748b" }}>
            No workflows yet. Click "+ New Workflow" to get started.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {workflows.map((wf) => (
              <div key={wf.id} className="card" style={{ cursor: "pointer" }}>
                <h3 style={{ margin: "0 0 4px" }}>{wf.name}</h3>
                <p
                  style={{ margin: "0 0 8px", fontSize: 13, color: "#64748b" }}
                >
                  {wf.nodes.length} nodes &middot; {wf.edges.length} edges
                </p>
                <p
                  style={{ margin: "0 0 8px", fontSize: 12, color: "#94a3b8" }}
                >
                  Updated: {new Date(wf.updatedAt).toLocaleDateString()}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/editor/${wf.id}`)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(wf.id)}
                    style={{ color: "#ef4444" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
