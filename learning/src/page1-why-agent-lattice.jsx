import { Badge, C, Clr, F, InfoBox, Pre, Section } from "./components"

export default function WhyAgentLattice() {
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
            Why Agent Lattice Exists
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            understanding the problem
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
          LLMs are powerful, but user intent is messy. Chat interfaces are
          insufficient. Reliability breaks at scale. Agent Lattice exists to
          solve these fundamental problems.
        </p>
      </div>

      <Section
        title="The Intent Problem"
        sub="Why expressing what you want is harder than it seems"
      >
        <InfoBox title="The Core Issue" color={C.red}>
          Users are not perfect in their instructions, and LLMs pay the price.
          They misuse words, give conflicting tasks, don't utilize proper
          spelling and grammar, don't properly convey what is important, and
          don't define what "acceptable" looks like.
        </InfoBox>

        <div style={{ marginTop: 16 }}>
          <p
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            The result: LLMs waste time and context trying to figure out what
            users mean. Every person knows what they're talking about in their
            own head, but parts get lost in translation between brain and LLM
            input.
          </p>

          <div
            style={{
              padding: "12px 14px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 600,
                color: C.orange,
                marginBottom: 8,
              }}
            >
              What Gets Lost in Translation
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.red }}>×</span>
                <span>Which parts of the request are critical vs optional</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.red }}>×</span>
                <span>What "good enough" means for this specific task</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.red }}>×</span>
                <span>Implicit dependencies between instructions</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.red }}>×</span>
                <span>Constraints that seem "obvious" but aren't stated</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: C.red }}>×</span>
                <span>The structure of the desired output</span>
              </div>
            </div>
          </div>

          <InfoBox title="The Key Insight" color={C.cyan}>
            Easier interface leads to better definition of intent. Well-defined
            intent leads to better results. This is not a prompt engineering
            problem — it's an interface problem.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="The Cost & Reliability Trap"
        sub="Why current LLM workflows don't scale"
      >
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              padding: "12px",
              background: `${C.red}08`,
              border: `1px solid ${C.red}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 700,
                color: C.red,
                marginBottom: 8,
              }}
            >
              Large Models
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              Powerful • Expensive • Slow • Unreliable when used as monolithic
              black boxes
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "12px",
              background: `${C.orange}08`,
              border: `1px solid ${C.orange}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 700,
                color: C.orange,
                marginBottom: 8,
              }}
            >
              Small Models
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              Fast • Cheap • Fragile • Bad at broad reasoning • Prone to format
              errors
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            background: `${C.yellow}08`,
            border: `1px solid ${C.yellow}20`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 13,
              fontWeight: 700,
              color: C.yellow,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            The Impossible Tradeoff
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            You can have <Clr c={C.green}>cheap</Clr> or{" "}
            <Clr c={C.green}>reliable</Clr>, but not both.
            <br />
            You can have <Clr c={C.green}>fast</Clr> or{" "}
            <Clr c={C.green}>smart</Clr>, but not both.
            <br />
            Traditional approaches force you to choose.
          </div>
        </div>

        <Pre>
          {"Traditional Workflow Pattern:\n\n"}
          {"User writes long prompt → Large model processes everything\n"}
          {"  ↓\n"}
          {"Cost: $0.50+ per run\n"}
          {"Latency: 10-30 seconds\n"}
          {"Reliability: "}
          <Clr c={C.red}>unpredictable</Clr>
          {" (hope-based validation)\n\n"}
          {"When it fails:\n"}
          {"  • No visibility into why\n"}
          {"  • Retry entire workflow (expensive)\n"}
          {"  • Debug by trial and error (slow)\n"}
          {"  • No deterministic recovery path\n"}
        </Pre>
      </Section>

      <Section title="Real User Needs" sub="Who needs this and why">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              persona: "Developer",
              color: C.blue,
              scenario:
                "Wants to replace APIs with well-structured workflows using cheap models with validation",
              need: "Reliability without breaking the budget",
            },
            {
              persona: "Busy Professional",
              color: C.green,
              scenario:
                "Takes customer call while driving; needs meeting summarized and in notes by office arrival",
              need: "Fast, automated workflows that just work",
            },
            {
              persona: "Team Lead",
              color: C.orange,
              scenario:
                "Wants to summarize sprint tasks, get suggested solutions, and have PRs ready by lunch",
              need: "Multi-step automation with tool integration",
            },
            {
              persona: "Small Business Owner",
              color: C.cyan,
              scenario:
                "Needs to organize family/team coordination without manual tracking",
              need: "Simple workflows that connect multiple systems",
            },
          ].map((use) => (
            <div
              key={use.persona}
              style={{
                padding: "12px 14px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <Badge color={use.color}>{use.persona}</Badge>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 10,
                    color: C.textDim,
                    fontStyle: "italic",
                  }}
                >
                  {use.need}
                </span>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: C.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {use.scenario}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="What Agent Lattice Changes"
        sub="The paradigm shift that makes reliable agents possible"
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
            The Solution: Standardized, Structured Workflows
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            Instead of asking users to express complex intent in natural
            language, give them drag-and-drop blocks that wire together. Each
            block has explicit inputs, outputs, and validation. The system
            converts blocks into optimized prompts for the right model at the
            right time.
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
          <div
            style={{
              padding: "12px",
              background: `${C.green}08`,
              border: `1px solid ${C.green}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                marginBottom: 6,
              }}
            >
              ✓ Consistent Intent
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              Blocks standardize how intent is expressed. No more ambiguity.
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: `${C.green}08`,
              border: `1px solid ${C.green}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                marginBottom: 6,
              }}
            >
              ✓ Small Models Work
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              Structure + validation make cheap models reliable.
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: `${C.green}08`,
              border: `1px solid ${C.green}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                marginBottom: 6,
              }}
            >
              ✓ Predictable Costs
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              Know exactly what each workflow will cost before running it.
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: `${C.green}08`,
              border: `1px solid ${C.green}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.green,
                marginBottom: 6,
              }}
            >
              ✓ Debuggable Failures
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              See exactly what failed, why, and how to fix it.
            </div>
          </div>
        </div>

        <InfoBox title="The Core Principle" color={C.accent}>
          Easier interface → Better intent definition → Better results
          <br />
          <br />
          Well-defined workflows with validation → Reliable small models →
          Predictable costs
          <br />
          <br />
          Chat is for conversation. Blocks are for automation.
        </InfoBox>
      </Section>

      <Section title="Next: How It Works" sub="Understanding the philosophy">
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
          Now that you understand <Clr c={C.text}>why</Clr> Agent Lattice
          exists, the next page explains <Clr c={C.text}>how</Clr> it works: the
          paradigm shift from "prompts" to "programs" that makes reliable agents
          possible.
        </div>
      </Section>
    </div>
  )
}
