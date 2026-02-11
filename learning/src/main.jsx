import { useState } from "react"
import ReactDOM from "react-dom/client"
import { C, F, PageContainer } from "./components"
import { Navigation } from "./Navigation"
import WhyAgentLattice from "./page1-why-agent-lattice"
import ProgramsNotPrompts from "./page2-programs-not-prompts"
import BlocksIRRuntime from "./page3-blocks-ir-runtime"
import IntentCompilation from "./page4-intent-compilation"
import ReliabilityTransparency from "./page5-reliability-transparency"
import VisionRoadmap from "./page6-vision-roadmap"

function App() {
  const [currentPage, setCurrentPage] = useState(1)

  const pages = {
    1: WhyAgentLattice,
    2: ProgramsNotPrompts,
    3: BlocksIRRuntime,
    4: IntentCompilation,
    5: ReliabilityTransparency,
    6: VisionRoadmap,
  }

  const CurrentPageComponent = pages[currentPage]

  return (
    <PageContainer>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 32,
              fontWeight: 700,
              color: C.text,
              margin: 0,
              letterSpacing: "-0.04em",
            }}
          >
            Agent Lattice
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            learning the theory
          </span>
        </div>
        <p
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            color: C.textMuted,
            margin: "4px 0 0 0",
          }}
        >
          Understanding the problems, philosophy, and architecture behind
          reliable agent workflows
        </p>
      </div>

      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <CurrentPageComponent />
    </PageContainer>
  )
}

const rootEl = document.getElementById("root")

if (!rootEl) {
  throw new Error("Missing #root element")
}

const root = ReactDOM.createRoot(rootEl)
root.render(<App />)
