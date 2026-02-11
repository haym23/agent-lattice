import { Badge, C, Clr, F, InfoBox, Pre, Section } from "./components"

export default function ProgramsNotPrompts() {
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
            Programs, Not Prompts
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            the design philosophy
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
          Agent Lattice treats workflows like real programs with explicit
          structure, state, and validation. Not prompt engineering — program
          engineering.
        </p>
      </div>

      <Section
        title="The Paradigm Shift"
        sub="From asking models to 'be smart' to building smart systems"
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
            The Core Thesis
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              color: C.textMuted,
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            <Clr c={C.text}>
              "The system does the thinking. The model fills in the blanks."
            </Clr>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              padding: "14px",
              background: `${C.red}06`,
              border: `1px solid ${C.red}18`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 700,
                color: C.red,
                marginBottom: 10,
              }}
            >
              ❌ Prompt Engineering
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              • Intelligence is in the prompt
              <br />• Model holds state implicitly
              <br />• Hope-based validation
              <br />• Expensive retries
              <br />• Hard to debug failures
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px",
              background: `${C.green}06`,
              border: `1px solid ${C.green}18`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 700,
                color: C.green,
                marginBottom: 10,
              }}
            >
              ✓ Program Engineering
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              • Intelligence is in structure
              <br />• Runtime holds state explicitly
              <br />• Schema-based validation
              <br />• Targeted repair
              <br />• Deterministic debugging
            </div>
          </div>
        </div>

        <InfoBox title="What This Means in Practice" color={C.cyan}>
          Instead of crafting perfect prompts, you build explicit workflows with
          nodes, edges, typed data, and validation rules. The system handles
          control flow, state management, and error recovery. Models just
          execute small, bounded tasks.
        </InfoBox>
      </Section>

      <Section
        title="Workflows as Programs"
        sub="The mental model that changes everything"
      >
        <Pre>
          {"Traditional Approach:\n\n"}
          {"  Prompt → Model → Output (hope it's correct)\n\n"}
          {"Agent Lattice Approach:\n\n"}
          {"  Nodes       = Instructions\n"}
          {"  Edges       = Control flow\n"}
          {"  State       = Explicit memory\n"}
          {"  Validators  = Type system\n"}
          {"  Retries     = Exception handling\n\n"}
          {"Language models are "}
          <Clr c={C.accent}>bounded execution units</Clr>
          {",\n"}
          {"not planners of last resort."}
        </Pre>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {[
            {
              concept: "Nodes = Instructions",
              color: C.blue,
              desc: "Each node is a single, well-defined operation with explicit inputs and outputs",
            },
            {
              concept: "Edges = Control Flow",
              color: C.cyan,
              desc: "Edges define deterministic execution order and branching logic",
            },
            {
              concept: "State = Memory",
              color: C.orange,
              desc: "Runtime state stores data between steps — no hidden model memory",
            },
            {
              concept: "Validators = Types",
              color: C.green,
              desc: "Every output is validated against schemas and invariants",
            },
          ].map((item) => (
            <div
              key={item.concept}
              style={{
                padding: "12px",
                background: `${item.color}08`,
                border: `1px solid ${item.color}20`,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontFamily: F.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: 6,
                }}
              >
                {item.concept}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Deterministic Control Flow"
        sub="No model decides what happens next"
      >
        <InfoBox title="The Rule" color={C.yellow}>
          All branching and looping is handled by the runtime, not by models.
          Conditions are evaluated deterministically without LLM involvement.
          This guarantees predictability, debuggability, and reproducibility.
        </InfoBox>

        <div style={{ marginTop: 16 }}>
          <Pre>
            {"Example: Branching Without Models\n\n"}
            {"if (user_age > 18) {\n"}
            {"  "}
            <Clr c={C.green}>→ execute adult_workflow</Clr>
            {"\n"}
            {"} else {\n"}
            {"  "}
            <Clr c={C.orange}>→ execute minor_workflow</Clr>
            {"\n"}
            {"}\n\n"}
            {"This decision is made by the runtime based on\n"}
            {"data, not by asking a model to decide.\n\n"}
            {"Result:\n"}
            {"  • Same input = same path (every time)\n"}
            {"  • No token cost for routing\n"}
            {"  • Failures are reproducible\n"}
            {"  • Debugging is straightforward"}
          </Pre>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 11,
              fontWeight: 700,
              color: C.text,
              marginBottom: 8,
            }}
          >
            What the Runtime Handles
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
              <span style={{ color: C.green }}>✓</span>
              <span>If/else branching based on data conditions</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>Loops over lists with bounded iterations</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>Switch statements for multi-way routing</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: C.green }}>✓</span>
              <span>Parallel execution of independent branches</span>
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Explicit State Management"
        sub="Real program memory, not context window tricks"
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
            The Memory Problem
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            LLMs don't provide reliable cross-call memory. Context windows are
            limited and expensive. Traditional solutions waste tokens repeating
            history or lose data between calls.
          </div>
        </div>

        <Pre>
          {"Runtime State Namespaces:\n\n"}
          <Clr c={C.green}>{"$vars.*"}</Clr>
          {"   Durable workflow state\n"}
          {"         Used for: handoffs between distant steps\n\n"}
          <Clr c={C.blue}>{"$tmp.*"}</Clr>
          {"    Ephemeral scratch state\n"}
          {"         Used for: temporary calculations\n\n"}
          <Clr c={C.cyan}>{"$ctx.*"}</Clr>
          {"    Runtime metadata (read-only)\n"}
          {"         Contains: execution context, timestamps\n\n"}
          <Clr c={C.orange}>{"$in.*"}</Clr>
          {"     Trigger input (read-only)\n"}
          {"         Contains: workflow start parameters\n\n"}
          {"Data passing:\n"}
          {"  Early node writes:  $vars.research_packet\n"}
          {"  Later node reads:   $vars.research_packet.summary\n\n"}
          {"No model 'remembers' — the runtime passes data."}
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Why This Matters" color={C.accent}>
            This is real program memory. Nodes read and write explicit
            variables. No guessing what the model "remembers." No token waste on
            history. No data loss between steps. Workflows are deterministic and
            debuggable.
          </InfoBox>
        </div>
      </Section>

      <Section title="Validation & Repair" sub="Making small models reliable">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              padding: "14px",
              background: `${C.blue}06`,
              border: `1px solid ${C.blue}18`,
              borderRadius: 7,
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
              1. Validation
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              Every LLM output is validated:
              <br />• JSON Schema compliance
              <br />• Cross-field invariants
              <br />• Allow-list membership
              <br />• Required field presence
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "14px",
              background: `${C.green}06`,
              border: `1px solid ${C.green}18`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 12,
                fontWeight: 700,
                color: C.green,
                marginBottom: 10,
              }}
            >
              2. Repair
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              When validation fails:
              <br />• Generate repair packet
              <br />• Describe exact issue
              <br />• Re-invoke with fix-only prompt
              <br />• Correct broken fields only
            </div>
          </div>
        </div>

        <Pre>
          {"Validation Flow:\n\n"}
          {"Model outputs: { id: 'C9', name: 'Sarah' }\n"}
          {"              ↓\n"}
          {"Validator checks:\n"}
          {"  "}
          <Clr c={C.green}>✓ Schema matches</Clr>
          {"\n"}
          {"  "}
          <Clr c={C.red}>✗ id 'C9' not in candidate ids</Clr>
          {"\n"}
          {"              ↓\n"}
          {"Repair packet generated:\n"}
          {'  "error": "id must be one of [C1, C2]"\n'}
          {'  "allowed_ids": ["C1", "C2"]\n'}
          {'  "previous_output": { "id": "C9" }\n'}
          {"              ↓\n"}
          {"Model re-invoked: 'Fix only the id field.'\n"}
          {"              ↓\n"}
          {"Corrected output: { id: 'C2', name: 'Sarah' }\n"}
          {"              ↓\n"}
          <Clr c={C.green}>✓ Validation passes — continue workflow</Clr>
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Why Repair Works" color={C.green}>
            Targeted repair is cheap. The model doesn't need to re-understand
            the task — just fix the specific error. This makes retries reliable
            even with small models. No expensive full re-execution.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="Model Escalation Strategy"
        sub="Use the cheapest model that works"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}25`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            <Clr c={C.text}>Default:</Clr> Small, fast, cheap models handle most
            tasks
            <br />
            <Clr c={C.text}>Escalation:</Clr> Explicit, rule-based upgrade to
            larger models only when validation fails or ambiguity is detected
            <br />
            <Clr c={C.text}>Result:</Clr> Predictable costs, minimal waste
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 6,
          }}
        >
          {[
            {
              tier: "Small",
              color: C.green,
              usage: "Default",
              tasks: "Extraction, routing, validation, simple transforms",
            },
            {
              tier: "Medium",
              color: C.orange,
              usage: "Escalation",
              tasks: "Ambiguous input, planning, complex reasoning",
            },
            {
              tier: "Large",
              color: C.red,
              usage: "Rare",
              tasks: "Novel problems, critical decisions, adjudication",
            },
          ].map((t) => (
            <div
              key={t.tier}
              style={{
                padding: "10px 12px",
                background: `${t.color}08`,
                border: `1px solid ${t.color}20`,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Badge color={t.color}>{t.tier}</Badge>
                <span
                  style={{
                    fontFamily: F.mono,
                    fontSize: 9,
                    color: C.textMuted,
                  }}
                >
                  {t.usage}
                </span>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                  lineHeight: 1.6,
                }}
              >
                {t.tasks}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Escalation is Deterministic" color={C.blue}>
            The system escalates based on explicit rules: schema failures,
            confidence thresholds, ambiguity detection. Not guesswork. Most
            workflows run entirely on small models.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="The Result: Reliable Small Models"
        sub="By shifting intelligence into the system"
      >
        <Pre>
          {"Traditional LLM Workflow:\n\n"}
          {"  "}
          <Clr c={C.red}>$$$</Clr>
          {" Large model for everything\n"}
          {"  "}
          <Clr c={C.red}>Slow</Clr>
          {" 10-30 second latency\n"}
          {"  "}
          <Clr c={C.red}>Unpredictable</Clr>
          {" Failures are mysterious\n"}
          {"  "}
          <Clr c={C.red}>Hope-based</Clr>
          {" Retry entire workflow\n\n"}
          {"Agent Lattice Workflow:\n\n"}
          {"  "}
          <Clr c={C.green}>$</Clr>
          {" Small models with structure\n"}
          {"  "}
          <Clr c={C.green}>Fast</Clr>
          {" Sub-second per step\n"}
          {"  "}
          <Clr c={C.green}>Deterministic</Clr>
          {" Failures are reproducible\n"}
          {"  "}
          <Clr c={C.green}>Targeted repair</Clr>
          {" Fix only what failed\n\n"}
          {"The paradigm shift:\n"}
          {"  Prompt engineering → Program engineering\n"}
          {"  Model intelligence → System intelligence\n"}
          {"  Hope-based → Validation-based"}
        </Pre>
      </Section>

      <Section title="Next: The Architecture" sub="How blocks become runtime">
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
          You now understand the <Clr c={C.text}>philosophy</Clr> — treat
          workflows as programs, not prompts. Next, learn how this philosophy is
          implemented: the pipeline from visual blocks to deterministic runtime
          execution.
        </div>
      </Section>
    </div>
  )
}
