import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EditorPage } from "./EditorPage"

const mockSaveCurrentWorkflow = vi.fn()
const mockLoadStoredWorkflow = vi.fn()

vi.mock("./workflowService", () => ({
  compileForTarget: vi.fn(async () => ({ files: [] })),
  listModels: vi.fn(() => [
    {
      id: "claude-sonnet",
      displayName: "Claude Sonnet",
      provider: "Anthropic",
      logoText: "A",
      preview: "Balanced quality and speed",
    },
    {
      id: "gpt-4o",
      displayName: "GPT-4o",
      provider: "OpenAI",
      logoText: "O",
      preview: "Fast multimodal generalist",
    },
  ]),
  saveCurrentWorkflow: (...args: unknown[]) => mockSaveCurrentWorkflow(...args),
  loadStoredWorkflow: (...args: unknown[]) => mockLoadStoredWorkflow(...args),
}))

function renderEditor(route = "/editor") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function makeWorkflow(id: string, name: string) {
  const timestamp = new Date().toISOString()
  return {
    id,
    name,
    version: "1.0.0" as const,
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: [],
    edges: [],
  }
}

describe("EditorPage persistence controls", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    mockSaveCurrentWorkflow.mockReset()
    mockLoadStoredWorkflow.mockReset()
    mockLoadStoredWorkflow.mockResolvedValue(null)
  })

  it("shows only save action in workflow actions", async () => {
    mockLoadStoredWorkflow.mockResolvedValue(makeWorkflow("wf-1", "Alpha"))

    renderEditor()

    expect(await screen.findByLabelText("save-workflow")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Refresh" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Load" })).toBeNull()
    expect(screen.queryByLabelText("save-workflow-as")).toBeNull()
  })

  it("shows dirty, saving, and saved persistence badges", async () => {
    let resolveSave: (value: ReturnType<typeof makeWorkflow>) => void = () => {}
    const savePromise = new Promise<ReturnType<typeof makeWorkflow>>(
      (resolve) => {
        resolveSave = resolve
      }
    )

    mockSaveCurrentWorkflow.mockReturnValue(savePromise)
    renderEditor()

    expect(await screen.findByText("dirty")).toBeTruthy()
    fireEvent.click(screen.getByLabelText("save-workflow"))
    expect(await screen.findByText("saving")).toBeTruthy()

    resolveSave(makeWorkflow("wf-1", "new-workflow"))
    await waitFor(() => {
      expect(screen.getByText("saved")).toBeTruthy()
    })

    const nameInput = screen.getByLabelText("workflow-name")
    fireEvent.change(nameInput, { target: { value: "new-workflow-2" } })
    expect(await screen.findByText("dirty")).toBeTruthy()
  })

  it("loads workflow from route id on mount", async () => {
    mockLoadStoredWorkflow.mockResolvedValue(null)

    renderEditor("/editor/missing-workflow")

    await waitFor(() => {
      expect(mockLoadStoredWorkflow).toHaveBeenCalledWith("missing-workflow")
    })
  })

  it("saves only in save mode", async () => {
    mockSaveCurrentWorkflow.mockResolvedValue(makeWorkflow("wf-1", "Alpha"))

    renderEditor()

    const save = await screen.findByLabelText("save-workflow")

    fireEvent.click(save)
    await waitFor(() => {
      expect(mockSaveCurrentWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "save" })
      )
    })
  })
})
