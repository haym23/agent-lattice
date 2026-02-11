import { Badge, C, Clr, F, InfoBox, Pre, Section } from "./components"

export default function BlocksIRRuntime() {
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
            Blocks → IR → Runtime
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            the mental model
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
          Visual blocks are for humans. Intermediate Representation (IR) is for
          machines. The runtime executes IR with validation and state. This
          separation is what makes reliability possible.
        </p>
      </div>

      <Section
        title="The Three-Layer Architecture"
        sub="Each layer serves a distinct purpose"
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
            The Pipeline
          </div>
          <Pre>
            <Clr c={C.accent}>{"UI Blocks"}</Clr>
            {"  (What users design)\n"}
            {"     ↓ compile\n"}
            <Clr c={C.cyan}>{"PlanIR"}</Clr>
            {"  (What the system intends)\n"}
            {"     ↓ lower\n"}
            <Clr c={C.orange}>{"ExecIR"}</Clr>
            {"  (What the runtime executes)\n"}
            {"     ↓ run\n"}
            <Clr c={C.green}>{"LRE Runtime"}</Clr>
            {"  (Validated execution)\n"}
          </Pre>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              layer: "UI Blocks",
              purpose: "Authoring",
              color: C.accent,
              desc: "Drag-and-drop interface for humans. Ergonomic, visual, flexible.",
              traits: "User-friendly • Visual • Editable",
            },
            {
              layer: "PlanIR",
              purpose: "Intent",
              color: C.cyan,
              desc: "High-level semantic plan. What should happen, not how.",
              traits: "Optional • Semantic • High-level",
            },
            {
              layer: "ExecIR",
              purpose: "Execution",
              color: C.orange,
              desc: "Deterministic, validated program. What actually runs.",
              traits: "Required • Deterministic • Validated",
            },
            {
              layer: "Runtime (LRE)",
              purpose: "Execution Engine",
              color: C.green,
              desc: "Executes ExecIR with state management, validation, and repair.",
              traits: "Fast • Reliable • Observable",
            },
          ].map((l) => (
            <div
              key={l.layer}
              style={{
                padding: "12px 14px",
                background: `${l.color}08`,
                border: `1px solid ${l.color}20`,
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
                <div
                  style={{
                    fontFamily: F.display,
                    fontSize: 13,
                    fontWeight: 700,
                    color: l.color,
                  }}
                >
                  {l.layer}
                </div>
                <Badge color={l.color} small>
                  {l.purpose}
                </Badge>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: C.textMuted,
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                {l.desc}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 9,
                  color: C.textDim,
                }}
              >
                {l.traits}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Layer 1: UI Blocks"
        sub="The authoring interface for humans"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}20`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 700,
              color: C.accent,
              marginBottom: 10,
            }}
          >
            What Are Blocks?
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            Blocks are visual workflow elements you drag onto a canvas. Each
            block represents a single operation: extract data, classify input,
            call a tool, generate text, validate output. Blocks connect via
            edges to form workflows.
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
              type: "LLM Block",
              icon: "✦",
              color: C.blue,
              examples: "Extract, Classify, Generate, Choose",
            },
            {
              type: "Tool Block",
              icon: "⚙",
              color: C.cyan,
              examples: "HTTP Request, Database Query, API Call",
            },
            {
              type: "Logic Block",
              icon: "◆",
              color: C.orange,
              examples: "If/Else, Switch, Loop, Merge",
            },
            {
              type: "Data Block",
              icon: "▣",
              color: C.green,
              examples: "Pack, Transform, Validate, Store",
            },
          ].map((b) => (
            <div
              key={b.type}
              style={{
                padding: "10px 12px",
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
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 16, color: b.color }}>{b.icon}</span>
                <span
                  style={{
                    fontFamily: F.sans,
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  {b.type}
                </span>
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                }}
              >
                {b.examples}
              </div>
            </div>
          ))}
        </div>

        <InfoBox title="Why Blocks Matter" color={C.accent}>
          Blocks standardize intent. Instead of writing ambiguous natural
          language, you select explicit operations with typed inputs and
          outputs. The UI enforces structure — you can't create invalid
          workflows.
        </InfoBox>
      </Section>

      <Section
        title="Layer 2: PlanIR (Optional)"
        sub="High-level semantic intent"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.cyan}08`,
            border: `1px solid ${C.cyan}20`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.sans,
              fontSize: 12,
              fontWeight: 700,
              color: C.cyan,
              marginBottom: 10,
            }}
          >
            What Is PlanIR?
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            PlanIR is a high-level representation of "what should happen." It's
            used when the user's intent is vague or when auto-planning is
            desired. PlanIR is coarse-grained, may omit details, and is not
            necessarily runnable.
          </div>
        </div>

        <Pre>
          {"Example PlanIR (conceptual):\n\n"}
          {"steps:\n"}
          {"  1. EXTRACT_INTENT from user_message\n"}
          {"  2. FIND_CONTACT by name\n"}
          {"  3. FIND_ATTACHMENT by hint\n"}
          {"  4. DRAFT_AND_SEND_EMAIL\n\n"}
          {"This is "}
          <Clr c={C.text}>what</Clr>
          {" to do, not "}
          <Clr c={C.text}>how</Clr>
          {" to do it.\n"}
          {"The compiler transforms this into ExecIR."}
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="When to Use PlanIR" color={C.blue}>
            PlanIR is optional. Use it when: the user gives a goal (not an
            explicit workflow), you want an AI planner to draft a workflow, or
            you want reusable templates generated from intent. Skip it when the
            user already designed explicit blocks.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="Layer 3: ExecIR (Required)"
        sub="The executable program format"
      >
        <div
          style={{
            padding: "16px 18px",
            background: `${C.orange}08`,
            border: `1px solid ${C.orange}25`,
            borderRadius: 7,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontFamily: F.display,
              fontSize: 14,
              fontWeight: 700,
              color: C.orange,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            ExecIR: The Heart of the System
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            ExecIR is Lattice IR (LIR) — the executable program format that the
            runtime actually runs. Think of it as{" "}
            <Clr c={C.text}>bytecode for agent workflows</Clr>. It's JSON-based,
            deterministic, schema-validated, and replayable.
          </div>
        </div>

        <Pre>
          {"ExecIR Node (simplified structure):\n\n"}
          {"{\n"}
          {'  "id": "N_extract",\n'}
          {'  "op": "LLM_EXTRACT",\n'}
          {'  "model_class": "SMALL_EXEC",\n'}
          {'  "inputs": { "text": "$in.user_message" },\n'}
          {'  "output_schema": "ExtractedIntent",\n'}
          {'  "outputs": { "result": "$vars.intent" },\n'}
          {'  "validators": [\n'}
          {'    { "type": "json_schema" }\n'}
          {"  ],\n"}
          {'  "retry_policy": {\n'}
          {'    "strategy": "PATCH_JSON_FROM_ERROR",\n'}
          {'    "max_attempts": 2\n'}
          {"  }\n"}
          {"}\n\n"}
          {"Key features:\n"}
          {"  • Explicit operation type ("}
          <Clr c={C.accent}>op</Clr>
          {")\n"}
          {"  • Typed inputs referencing runtime state ("}
          <Clr c={C.cyan}>$vars</Clr>
          {")\n"}
          {"  • Output schema for validation ("}
          <Clr c={C.green}>output_schema</Clr>
          {")\n"}
          {"  • Retry policy with bounded attempts ("}
          <Clr c={C.orange}>retry_policy</Clr>
          {")"}
        </Pre>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <div
            style={{
              padding: "12px",
              background: `${C.blue}08`,
              border: `1px solid ${C.blue}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.blue,
                marginBottom: 6,
              }}
            >
              Deterministic Ops
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              TOOL_CALL
              <br />
              PACK
              <br />
              MERGE
              <br />
              SWITCH
              <br />
              MAP
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              background: `${C.accent}08`,
              border: `1px solid ${C.accent}20`,
              borderRadius: 7,
            }}
          >
            <div
              style={{
                fontFamily: F.sans,
                fontSize: 11,
                fontWeight: 700,
                color: C.accent,
                marginBottom: 6,
              }}
            >
              LLM Ops
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.6,
              }}
            >
              LLM_EXTRACT
              <br />
              LLM_CLASSIFY
              <br />
              LLM_CHOOSE
              <br />
              LLM_WRITE
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Layer 4: The Runtime (LRE)"
        sub="Executing ExecIR with validation and state"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.green}08`,
            border: `1px solid ${C.green}20`,
            borderRadius: 7,
            marginBottom: 16,
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
            What Does the Runtime Do?
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            The Lattice Runtime Environment (LRE) executes ExecIR nodes in
            order, manages runtime state, validates outputs, handles repair, and
            escalates models when necessary. It's the execution engine that
            makes everything work.
          </div>
        </div>

        <Pre>
          {"Runtime Execution Flow:\n\n"}
          {"1. Load ExecIR program\n"}
          {"2. Initialize runtime state ($vars, $tmp, $ctx, $in)\n"}
          {"3. For each node in execution order:\n"}
          {"     a. Resolve input references from state\n"}
          {"     b. Execute operation (LLM call or deterministic op)\n"}
          {"     c. Validate output against schema\n"}
          {"     d. If validation fails → repair or escalate\n"}
          {"     e. Store output in runtime state\n"}
          {"4. Return final outputs\n\n"}
          {"The runtime ensures:\n"}
          {"  • "}
          <Clr c={C.green}>Deterministic execution</Clr>
          {" (same input = same path)\n"}
          {"  • "}
          <Clr c={C.cyan}>Explicit state</Clr>
          {" (no hidden memory)\n"}
          {"  • "}
          <Clr c={C.orange}>Validated outputs</Clr>
          {" (every step checked)\n"}
          {"  • "}
          <Clr c={C.blue}>Targeted repair</Clr>
          {" (cheap fixes)"}
        </Pre>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {[
            {
              capability: "State Management",
              color: C.cyan,
              desc: "Manages $vars, $tmp, $ctx, $in namespaces",
            },
            {
              capability: "Validation",
              color: C.green,
              desc: "Checks every output against schemas and invariants",
            },
            {
              capability: "Repair",
              color: C.orange,
              desc: "Generates repair packets and retries failed validations",
            },
            {
              capability: "Escalation",
              color: C.red,
              desc: "Upgrades to larger models when small models fail",
            },
            {
              capability: "Observability",
              color: C.blue,
              desc: "Streams events for real-time monitoring",
            },
          ].map((cap) => (
            <div
              key={cap.capability}
              style={{
                padding: "10px 12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 7,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Badge color={cap.color}>{cap.capability}</Badge>
              <span
                style={{
                  fontFamily: F.mono,
                  fontSize: 10,
                  color: C.textMuted,
                }}
              >
                {cap.desc}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="How Data Flows Through the Layers"
        sub="End-to-end example"
      >
        <Pre>
          {"User Action:\n"}
          {"  Drags blocks: Start → Extract → Classify → End\n"}
          {"              ↓\n"}
          <Clr c={C.accent}>{"UI Blocks Layer"}</Clr>
          {" (authoring)\n"}
          {"  Workflow JSON saved: 3 nodes, 2 edges\n"}
          {"              ↓\n"}
          {"Compilation:\n"}
          {"  BlockIR → PlanIR → ExecIR\n"}
          {"              ↓\n"}
          <Clr c={C.orange}>{"ExecIR Layer"}</Clr>
          {" (executable program)\n"}
          {"  N_extract: LLM_EXTRACT → $vars.data\n"}
          {"  N_classify: LLM_CLASSIFY → $vars.category\n"}
          {"              ↓\n"}
          <Clr c={C.green}>{"Runtime (LRE)"}</Clr>
          {"\n"}
          {"  1. Execute N_extract\n"}
          {"     • Input: $in.text\n"}
          {"     • Model: SMALL_EXEC\n"}
          {"     • Validate output schema\n"}
          {"     • Store: $vars.data = { ... }\n"}
          {"  2. Execute N_classify\n"}
          {"     • Input: $vars.data\n"}
          {"     • Model: SMALL_EXEC\n"}
          {"     • Validate category in allowed list\n"}
          {"     • Store: $vars.category = 'news'\n"}
          {"              ↓\n"}
          {"Result:\n"}
          {"  Workflow completed successfully\n"}
          {"  Final state: $vars = { data: {...}, category: 'news' }"}
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Why This Architecture Works" color={C.accent}>
            Separation of concerns: UI for humans, IR for machines, runtime for
            execution. Each layer is testable, serializable, and debuggable.
            This is what makes reliable agents possible at scale.
          </InfoBox>
        </div>
      </Section>

      <Section title="The Key Insight" sub="Why small models become reliable">
        <div
          style={{
            padding: "16px 18px",
            background: `${C.yellow}08`,
            border: `1px solid ${C.yellow}25`,
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
            <Clr c={C.text}>Blocks</Clr> standardize intent.
            <br />
            <Clr c={C.text}>IR</Clr> makes execution deterministic.
            <br />
            <Clr c={C.text}>Runtime</Clr> validates every step.
            <br />
            <br />
            Result: <Clr c={C.green}>Small models work reliably</Clr> because
            the system handles structure, validation, and repair.
            <br />
            <br />
            Intelligence is in the <Clr c={C.accent}>system</Clr>, not the{" "}
            <Clr c={C.textMuted}>prompt</Clr>.
          </div>
        </div>
      </Section>

      <Section title="Next: Deep Dive" sub="Optimization internals">
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
          You now understand the <Clr c={C.text}>pipeline</Clr> from blocks to
          runtime. Next: dive into the advanced internals — block fusion,
          reasoning traces, model routing, and runtime optimization strategies.
        </div>
      </Section>
    </div>
  )
}
