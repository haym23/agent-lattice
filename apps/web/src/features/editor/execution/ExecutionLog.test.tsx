import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ExecutionLog } from "./ExecutionLog"

describe("ExecutionLog", () => {
  it("renders stage, tool, and breadcrumb events with redaction marker", () => {
    render(
      <ExecutionLog
        events={[
          {
            eventVersion: "1.0",
            runId: "run-1",
            seq: 1,
            timestamp: new Date().toISOString(),
            type: "stage.started",
            payload: { stageId: "node-1", stageType: "START" },
          },
          {
            eventVersion: "1.0",
            runId: "run-1",
            seq: 2,
            timestamp: new Date().toISOString(),
            type: "tool.called",
            payload: {
              stageId: "node-1",
              toolName: "http.request",
              input: {
                value: "[REDACTED]",
                redactionLevel: "full",
                isRedacted: true,
                redactionReason: "tool-input-redacted-by-default",
              },
            },
          },
          {
            eventVersion: "1.0",
            runId: "run-1",
            seq: 3,
            timestamp: new Date().toISOString(),
            type: "trace.breadcrumb",
            payload: {
              category: "run.terminal",
              summary: "Run reached terminal status",
              details: {
                value: "[REDACTED]",
                redactionLevel: "full",
                isRedacted: true,
                redactionReason: "reasoning-redacted-by-default",
              },
            },
          },
        ]}
      />
    )

    expect(screen.getByText("stage.started")).toBeTruthy()
    expect(screen.getByText("tool.called")).toBeTruthy()
    expect(screen.getAllByText("[redacted]").length).toBeGreaterThan(0)
  })
})
