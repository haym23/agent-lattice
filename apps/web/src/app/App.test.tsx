import { cleanup, render, screen } from "@testing-library/react"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"

import { DashboardPage } from "../features/dashboard/DashboardPage"
import { EditorPage } from "../features/editor/EditorPage"

afterEach(cleanup)

function renderWithRoute(route: string, element: JSX.Element) {
  window.history.pushState({}, "", route)
  const router = createBrowserRouter([{ path: route, element }])
  return render(<RouterProvider router={router} />)
}

describe("App", () => {
  it("renders dashboard at root route", async () => {
    renderWithRoute("/", <DashboardPage />)
    const heading = await screen.findByRole("heading", { name: "Dashboard" })
    expect(heading).toBeTruthy()
  })

  it("renders editor at /editor route", async () => {
    renderWithRoute("/editor", <EditorPage />)
    const heading = await screen.findByRole("heading", {
      name: "Workflow Editor",
    })
    expect(heading).toBeTruthy()
  })
})
