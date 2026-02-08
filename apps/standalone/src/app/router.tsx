import { createBrowserRouter, Navigate } from 'react-router-dom';

import { EditorPage } from '../features/editor/EditorPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { TemplatesPage } from '../features/templates/TemplatesPage';

export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to="/editor" replace /> },
  { path: '/editor', element: <EditorPage /> },
  { path: '/templates', element: <TemplatesPage /> },
  { path: '/settings', element: <SettingsPage /> },
]);
