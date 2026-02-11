import { Badge, C, Clr, F, InfoBox, Pre, Section } from "./components"

export default function ReliabilityTransparency() {
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
            Reliability & Transparency
          </h1>
          <span
            style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}
          >
            building trust through observability
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
          Workflows aren't trustworthy because they're "smart" — they're
          trustworthy because they're observable, debuggable, and deterministic.
        </p>
      </div>

      <Section
        title="The Trust Problem"
        sub="Why black-box execution breaks confidence"
      >
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
              ❌ Black-Box Execution
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              Submit workflow → Wait → Get result
              <br />
              <br />• No visibility into what's happening
              <br />• Can't debug when things fail
              <br />• No way to verify correctness
              <br />• Must trust blindly
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
              ✓ Transparent Execution
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              Real-time event stream → Complete history → Replay
              <br />
              <br />• See every step as it happens
              <br />• Debug with full context
              <br />• Verify every decision
              <br />• Trust through verification
            </div>
          </div>
        </div>

        <InfoBox title="The Core Insight" color={C.cyan}>
          Observability and transparency are trust multipliers. By streaming
          every event, persisting complete history, and supporting deterministic
          replay, Agent Lattice transforms workflow execution from a black box
          into a verifiable, auditable process.
        </InfoBox>
      </Section>

      <Section
        title="Event Streaming (SSE)"
        sub="Real-time visibility into execution"
      >
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
            What Is Event Streaming?
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            The server streams structured execution events to clients in
            real-time using Server-Sent Events (SSE). This creates a live feed
            of what's happening inside the workflow — every stage, every tool
            call, every LLM interaction, every decision.
          </div>
        </div>

        <Pre>
          {"Event Stream Example:\n\n"}
          <Clr c={C.green}>{"run.started"}</Clr>
          {"         runId: wf_abc123, timestamp: 10:30:00\n"}
          <Clr c={C.cyan}>{"stage.started"}</Clr>
          {"       stage: extract_intent\n"}
          <Clr c={C.accent}>{"llm.step.started"}</Clr>
          {"    model: gpt-4o-mini, prompt: [redacted]\n"}
          <Clr c={C.accent}>{"llm.step.completed"}</Clr>
          {"  tokens: 450, latency: 1.2s\n"}
          <Clr c={C.cyan}>{"stage.completed"}</Clr>
          {"     output: { intent: 'book_meeting' }\n"}
          <Clr c={C.orange}>{"tool.called"}</Clr>
          {"         tool: calendar.search, args: {...}\n"}
          <Clr c={C.orange}>{"tool.completed"}</Clr>
          {"      result: [available_slots]\n"}
          <Clr c={C.green}>{"run.completed"}</Clr>
          {"       status: success, duration: 3.8s\n\n"}
          {"Users see this stream in real-time.\n"}
          {"Every event is also persisted for replay."}
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
              type: "Run Events",
              color: C.green,
              desc: "Workflow start, completion, failure",
            },
            {
              type: "Stage Events",
              color: C.cyan,
              desc: "Node execution start and completion",
            },
            {
              type: "LLM Events",
              color: C.accent,
              desc: "Model calls with usage metrics",
            },
            {
              type: "Tool Events",
              color: C.orange,
              desc: "External tool invocations and results",
            },
          ].map((e) => (
            <div
              key={e.type}
              style={{
                padding: "10px 12px",
                background: `${e.color}08`,
                border: `1px solid ${e.color}20`,
                borderRadius: 7,
              }}
            >
              <div
                style={{
                  fontFamily: F.sans,
                  fontSize: 11,
                  fontWeight: 700,
                  color: e.color,
                  marginBottom: 4,
                }}
              >
                {e.type}
              </div>
              <div
                style={{
                  fontFamily: F.mono,
                  fontSize: 9,
                  color: C.textMuted,
                }}
              >
                {e.desc}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Deterministic Replay" sub="Never lose execution history">
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
            How Replay Works
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            All events are persisted in a durable SQLite event store. Clients
            can reconnect and request missed events using sequence numbers.
            Server restarts don't break replay continuity — the complete history
            is always available.
          </div>
        </div>

        <Pre>
          {"Replay Scenario:\n\n"}
          {"1. Client starts workflow, receives events 1-10\n"}
          {"2. Client disconnects (network issue)\n"}
          {"3. Workflow continues executing, generates events 11-25\n"}
          {"4. Client reconnects with lastSeq=10\n"}
          {"5. Server replays events 11-25 from durable store\n"}
          {"6. Client is now caught up — no data lost\n\n"}
          {"Key properties:\n"}
          {"  • "}
          <Clr c={C.green}>Monotonic sequence numbers</Clr>
          {" (1, 2, 3...)\n"}
          {"  • "}
          <Clr c={C.cyan}>Durable persistence</Clr>
          {" (survives restarts)\n"}
          {"  • "}
          <Clr c={C.orange}>Deterministic order</Clr>
          {" (same events, same order)\n"}
          {"  • "}
          <Clr c={C.blue}>Complete history</Clr>
          {" (nothing is lost)"}
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Why This Matters" color={C.accent}>
            Network issues don't break workflows. Client crashes don't lose
            history. Server restarts are transparent. Users can verify every
            step at any time. This is what "reliable" actually means.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="What Users Can Observe"
        sub="Complete transparency into execution"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              observable: "Workflow Progression",
              color: C.green,
              items: [
                "When each stage starts and completes",
                "Current execution status",
                "Time spent per stage",
              ],
            },
            {
              observable: "LLM Interactions",
              color: C.accent,
              items: [
                "Which model was used for each call",
                "Token usage (prompt + completion)",
                "Latency and response time",
                "Redacted prompt metadata (sensitive data hidden)",
              ],
            },
            {
              observable: "Tool Invocations",
              color: C.orange,
              items: [
                "Which tools were called",
                "Input arguments passed to tools",
                "Results returned from tools",
              ],
            },
            {
              observable: "Reasoning & Decisions",
              color: C.cyan,
              items: [
                "Why certain paths were taken",
                "Confidence scores where applicable",
                "Validation pass/fail status",
                "Repair attempts and outcomes",
              ],
            },
          ].map((obs) => (
            <div
              key={obs.observable}
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
                <Badge color={obs.color}>{obs.observable}</Badge>
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
                {obs.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: obs.color }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Transparent Failure Handling"
        sub="Failures build trust when handled openly"
      >
        <div
          style={{
            padding: "14px 16px",
            background: `${C.red}08`,
            border: `1px solid ${C.red}20`,
            borderRadius: 7,
            marginBottom: 16,
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
            Failures Are Not Hidden
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            When something fails, users see exactly what was attempted, why it
            failed (with canonical error codes), and the full context leading up
            to the failure. They can replay the execution to verify. This honest
            failure handling actually increases trust.
          </div>
        </div>

        <Pre>
          {"Canonical Error Codes:\n\n"}
          <Clr c={C.red}>{"auth"}</Clr>
          {"                Authentication failure\n"}
          <Clr c={C.orange}>{"rate_limit"}</Clr>
          {"          Provider rate limit exceeded\n"}
          <Clr c={C.yellow}>{"timeout"}</Clr>
          {"             Request took too long\n"}
          <Clr c={C.blue}>{"malformed_output"}</Clr>
          {"   Model returned invalid format\n"}
          <Clr c={C.textDim}>{"unknown"}</Clr>
          {"             Unexpected error\n\n"}
          {"When llm.step.failed is streamed:\n"}
          {"  • Error code is standardized\n"}
          {"  • Context shows what was attempted\n"}
          {"  • Full event history available for replay\n"}
          {"  • Users can understand what went wrong\n\n"}
          {"Contrast with black-box failure:\n"}
          {"  "}
          <Clr c={C.red}>✗ 'Error occurred'</Clr>
          {" (no details)\n"}
          {"  "}
          <Clr c={C.red}>✗ No way to replay or verify</Clr>
          {"\n"}
          {"  "}
          <Clr c={C.red}>✗ Must trust provider's vague error</Clr>
        </Pre>

        <div style={{ marginTop: 16 }}>
          <InfoBox title="Trust Through Honesty" color={C.green}>
            Transparent failure handling reinforces trust. When users see
            exactly what failed and why, they understand the system is being
            honest about problems. Cryptic errors and silent failures destroy
            trust — openness builds it.
          </InfoBox>
        </div>
      </Section>

      <Section
        title="The Trust Mechanism"
        sub="From blind faith to verifiable execution"
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
              fontFamily: F.display,
              fontSize: 15,
              fontWeight: 700,
              color: C.accent,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            How Trust Is Built
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              color: C.textMuted,
              lineHeight: 1.8,
            }}
          >
            <Clr c={C.green}>1. Real-time visibility</Clr> — Watch execution as
            it happens, see every step
            <br />
            <Clr c={C.cyan}>2. Complete history</Clr> — All events persisted,
            nothing is hidden or lost
            <br />
            <Clr c={C.orange}>3. Deterministic replay</Clr> — Reconnect without
            losing data, verify any run
            <br />
            <Clr c={C.blue}>4. Observable failures</Clr> — Understand exactly
            what failed and why
            <br />
            <Clr c={C.pink}>5. Auditable log</Clr> — Complete event trail for
            verification and compliance
            <br />
            <br />
            <Clr c={C.text}>
              Result: Trust through verification, not blind faith.
            </Clr>
          </div>
        </div>
      </Section>

      <Section
        title="Observability vs. Black Box"
        sub="A comparison that matters"
      >
        <div style={{ display: "flex", gap: 8 }}>
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
              Black-Box System
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              • "Trust us" mentality
              <br />• No visibility into steps
              <br />• Failures are mysterious
              <br />• Can't replay or verify
              <br />• No audit trail
              <br />• Must debug by trial and error
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
              Agent Lattice
            </div>
            <div
              style={{
                fontFamily: F.mono,
                fontSize: 10,
                color: C.textMuted,
                lineHeight: 1.7,
              }}
            >
              • "Verify it yourself" approach
              <br />• Real-time event streaming
              <br />• Canonical error codes
              <br />• Deterministic replay
              <br />• Complete audit trail
              <br />• Debug with full context
            </div>
          </div>
        </div>
      </Section>

      <Section title="Next: The Vision" sub="Where this is all heading">
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
          You now understand how <Clr c={C.text}>trust</Clr> is built through
          observability and transparency. Next: learn about the project's vision
          — where it came from, where it's going, and what success looks like.
        </div>
      </Section>
    </div>
  )
}
