import { PageShell } from "../shared/PageShell"

/**
 * Executes settings page.
 */
export function SettingsPage(): JSX.Element {
  return (
    <main className="page">
      <PageShell
        title="Settings"
        description="Phase 1 shell: model registry and persistence settings will land here."
      />
    </main>
  )
}
