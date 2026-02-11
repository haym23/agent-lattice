import { Badge, C, Clr, F, InfoBox, Pre, Section } from "./components"

export default function VisionRoadmap() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              margin: 0,
              letterSpacing: "-0.04em",
            }}
          >
            Vision & Roadmap
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            the journey and the future
          </span>
        </div>
        <p
          style={{
            fontFamily: F.mono,
            fontSize: 12,
            color: C.textMuted,
            margin: "8px 0 0 0",
            lineHeight: 1.6,
          }}
        >
          From VSCode extension constraints to standalone platform. From web app
          to edge hardware. The evolution continues.
        </p>
      </div>

      <Section
        title="The Migration Story"
        sub="Why architectural transformation mattered"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.orange}08`,
            border: `1px solid ${C.orange}20`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 700,
              color: C.orange,
              marginBottom: 10,
            }}
          >
            The VSCode Constraint Problem
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            Agent Lattice started as cc-wf-studio, a VSCode extension. But
            extensions operate as two isolated processes communicating via
            postMessage. This created fundamental constraints: the UI had zero
            direct access to files, terminal, or APIs. Every feature depended on
            the extension host as a bottleneck.
          </div>
        </div>

        <Pre>
          {"The Two-Process Model:\n\n"}
          {"Extension Host (Node.js)\n"}
          {"  • File system access\n"}
          {"  • VSCode API\n"}
          {"  • Child processes (CLI spawning)\n"}
          {"              ↕ postMessage (async, one-way)\n"}
          {"Webview (Chromium iframe)\n"}
          {"  • React UI\n"}
          {"  • Canvas rendering\n"}
          {"  • Zero direct system access\n\n"}
          {"Every feature required:\n"}
          {"  1. Webview sends message to host\n"}
          {"  2. Host performs operation\n"}
          {"  3. Host sends response back\n"}
          {"  4. Webview updates UI\n\n"}
          {"This made every future feature harder."}
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Why Migration Was Priority #1" color={C.red}>
            Quote from the migration guide: "Every future feature — multi-model
            compilation, the execution runtime, collaboration, the plugin system
            — depends on this foundation being clean and correct." The VSCode
            architecture was a dead end for scalable platform development.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="The 10-Step Journey"
        sub="From extension to standalone web app"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            {
              step: 1,
              name: "Vite Scaffold",
              desc: "Fresh React + TypeScript foundation",
              status: "complete",
            },
            {
              step: 2,
              name: "Copy Webview Source",
              desc: "Preserve all UI components and stores",
              status: "complete",
            },
            {
              step: 3,
              name: "Platform Adapter",
              desc: "Abstract all VSCode dependencies",
              status: "complete",
            },
            {
              step: 4,
              name: "IndexedDB Storage",
              desc: "Replace file system with browser database",
              status: "complete",
            },
            {
              step: 5,
              name: "Canvas Rendering",
              desc: "Get React Flow working in browser",
              status: "complete",
            },
            {
              step: 6,
              name: "Extract Compiler",
              desc: "Pure TypeScript workflow-to-code generation",
              status: "complete",
            },
            {
              step: 7,
              name: "AI Integration",
              desc: "Direct API calls instead of CLI spawning",
              status: "complete",
            },
            {
              step: 8,
              name: "Fix i18n",
              desc: "Browser-native language detection (5 languages)",
              status: "complete",
            },
            {
              step: 9,
              name: "Styling Overhaul",
              desc: "Tailwind + Agent Lattice design system",
              status: "complete",
            },
            {
              step: 10,
              name: "Add Routing",
              desc: "Dashboard, editor, settings, templates",
              status: "complete",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Badge color={C.green} small>
                {String(item.step).padStart(2, "0")}
              </Badge>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text,
                    marginBottom: 2,
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontFamily: F.mono,
                    fontSize: 9,
                    color: C.textMuted,
                  }}
                >
                  {item.desc}
                </div>
              </div>
              <Badge color={C.green} small>
                {item.status}
              </Badge>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}20`,
            borderRadius: 7,
            fontFamily: F.mono,
            fontSize: 11,
            color: C.textMuted,
            lineHeight: 1.7,
          }}
        >
          <Clr c={C.accent}>Migration Complete:</Clr> Agent Lattice now runs as
          a standalone web app with zero VSCode dependencies. The same UI code
          could work as both a web app AND a VSCode extension through the
          platform adapter pattern.
        </div>
      </Section>

      <Section title="Current State: MVP Goals" sub="What's being built now">
        <div
          style={{
            padding: "14px 16px",
            background: `${C.blue}08`,
            border: `1px solid ${C.blue}20`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 700,
              color: C.blue,
              marginBottom: 10,
            }}
          >
            MVP Requirements
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            The immediate focus is on core execution reliability and
            multi-target export. Every feature builds toward a stable,
            production-ready runtime that works with multiple coding agent
            platforms.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              area: "Compiler/Runtime",
              color: C.orange,
              items: [
                "Basic compiler/runtime environment",
                "Validation + repair completeness",
                "Durable event store + replay",
              ],
            },
            {
              area: "Integration",
              color: C.cyan,
              items: [
                "Launch coding agents from UI",
                "Export to Claude, Codex, OpenCode, Copilot",
                "Easy login for Codex, MCPs, accounts",
              ],
            },
            {
              area: "Reliability",
              color: C.green,
              items: [
                "Highly reliable with current models",
                "Real provider execution path",
                "SSE correctness hardening",
              ],
            },
          ].map((area) => (
            <div
              key={area.area}
              style={{
                padding: "12px 14px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Badge color={area.color}>{area.area}</Badge>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                }}
              >
                {area.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: area.color }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Future Vision: Platform & Hardware"
        sub="Where this is all heading"
      >
        <div
          style={{
            padding: "16px 18px",
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}25`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.display,
              fontSize: 15,
              fontWeight: 700,
              color: C.accent,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Lattice Runtime Environment (LRE) Vision
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            A custom runtime capable of orchestrating LLMs of any size to run
            effectively and consistently. Lattice IR translates visual blocks
            into optimized prompts. Multi-model systems with intelligent
            selection and delegation. Context injection: only dependent parts of
            prompts sent to each model.
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {[
            {
              deployment: "Web Platform",
              color: C.blue,
              icon: "🌐",
              desc: "Runs anywhere, accessible from any browser",
              timeline: "Now",
            },
            {
              deployment: "Desktop App",
              color: C.cyan,
              icon: "💻",
              desc: "Electron wrapper for offline use",
              timeline: "Q2 2026",
            },
            {
              deployment: "LatticeBox",
              color: C.orange,
              icon: "🖥️",
              desc: "Mini PC with pre-loaded models, ClawdBot-style",
              timeline: "Q3 2026",
            },
            {
              deployment: "MicroLattice",
              color: C.green,
              icon: "🔌",
              desc: "Raspberry Pi 5B with ultra-lightweight models (LFM2.5-1.2B)",
              timeline: "Q4 2026",
            },
          ].map((d) => (
            <div
              key={d.deployment}
              style={{
                padding: "12px 14px",
                background: `${d.color}08`,
                border: `1px solid ${d.color}20`,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: F.sans,
                      fontSize: 12,
                      fontWeight: 700,
                      color: d.color,
                    }}
                  >
                    {d.deployment}
                  </div>
                  <div
                    style={{
                      fontFamily: F.mono,
                      fontSize: 9,
                      color: C.textDim,
                    }}
                  >
                    {d.timeline}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {d.desc}
              </div>
            </div>
          ))}
        </div>

        <InfoBox title="The Hardware Strategy" color={C.orange}>
          From full-featured (Mini PC) to ultra-lightweight (Raspberry Pi)
          deployments. Bring agent orchestration to resource-constrained edge
          devices. Specialize microcontrollers with optimized models.
          Local-first deployment without cloud dependencies.
        </InfoBox>
      </Section>

      <Section title="Long-Term Platform Aspirations" sub="The full vision">
        <Pre>
          {"Platform Features:\n\n"}
          <Clr c={C.accent}>{"Visual Workflow Progress"}</Clr>
          {"\n"}
          {"  • Green lines for successful flows\n"}
          {"  • Red lines for failures with error reports\n"}
          {"  • Borders around in-progress tasks\n"}
          {"  • Full logging in debug mode\n\n"}
          <Clr c={C.cyan}>{"Multi-Model Orchestration"}</Clr>
          {"\n"}
          {"  • Intelligent model selection per task\n"}
          {"  • Agents with different models share context\n"}
          {"  • Keep models warm without memory bloat\n"}
          {"  • Context as large as necessary\n\n"}
          <Clr c={C.orange}>{"Extensibility"}</Clr>
          {"\n"}
          {"  • Plugin system for custom nodes\n"}
          {"  • Collaboration features (shared workflows)\n"}
          {"  • Multi-target compilation (Claude, Codex, etc.)\n"}
          {"  • Template marketplace\n\n"}
          <Clr c={C.green}>{"Enterprise Features"}</Clr>
          {"\n"}
          {"  • On-premise deployment (LatticeBox)\n"}
          {"  • Audit logging and compliance\n"}
          {"  • Role-based access control\n"}
          {"  • Private model hosting"}
        </Pre>
      </Section>

      <Section title="What Success Looks Like" sub="The definition of 'done'">
        <div
          style={{
            padding: "16px 18px",
            background: `${C.green}08`,
            border: `1px solid ${C.green}25`,
            borderRadius: 7,
          }}
        >
          <div
            style={{
              fontFamily: F.display,
              fontSize: 14,
              fontWeight: 700,
              color: C.green,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Success Criteria
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Accessibility:</Clr> Works across web, desktop,
                and edge devices
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Reliability:</Clr> Workflows run
                deterministically with predictable costs
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Flexibility:</Clr> Supports multiple coding
                agents and export targets
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Intelligence:</Clr> LRE orchestrates multi-model
                systems with context awareness
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Observability:</Clr> Visual feedback on
                execution with full debugging
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>
                <Clr c={C.text}>Community:</Clr> Active ecosystem of workflows,
                templates, and plugins
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="The Principle That Guides Everything"
        sub="Why this foundation matters"
      >
        <div
          style={{
            padding: "16px 18px",
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}25`,
            borderRadius: 7,
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              color: C.textMuted,
              lineHeight: 1.8,
              textAlign: "center",
            }}
          >
            <Clr c={C.accent}>
              "Every future feature — multi-model compilation, the execution
              runtime, collaboration, the plugin system — depends on this
              foundation being clean and correct."
            </Clr>
            <br />
            <br />
            The migration from VSCode extension to standalone platform wasn't
            just a technical refactor. It was the prerequisite for everything
            that follows: scalable orchestration, edge deployment, and a
            platform that makes reliable agents accessible to everyone.
            <br />
            <br />
            <Clr c={C.text}>This is where it starts. Not where it ends.</Clr>
          </div>
        </div>
      </Section>

      <Section title="Ready to Build?" sub="Start with the fundamentals">
        <div
          style={{
            padding: "12px 14px",
            background: `${C.blue}08`,
            border: `1px solid ${C.blue}20`,
            borderRadius: 7,
            fontFamily: F.mono,
            fontSize: 11,
            color: C.textMuted,
            lineHeight: 1.7,
          }}
        >
          You've reached the end of the learning journey. You understand{" "}
          <Clr c={C.text}>why</Clr> Agent Lattice exists,{" "}
          <Clr c={C.text}>how</Clr> it works, and <Clr c={C.text}>where</Clr>{" "}
          it's going. Ready to build? Head back to page 1 or dive into the deep
          technical docs to start creating your own workflows.
        </div>
      </Section>
    </div>
  )
}
