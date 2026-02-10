import { createBrowserRouter } from "react-router-dom"

import { DashboardPage } from "../features/dashboard/DashboardPage"
import { EditorPage } from "../features/editor/EditorPage"
import { SettingsPage } from "../features/settings/SettingsPage"
import { TemplatesPage } from "../features/templates/TemplatesPage"

export const appRouter = createBrowserRouter([
  { path: "/", element: <DashboardPage /> },
  { path: "/editor", element: <EditorPage /> },
  { path: "/editor/:id", element: <EditorPage /> },
  { path: "/templates", element: <TemplatesPage /> },
  { path: "/settings", element: <SettingsPage /> },
])
