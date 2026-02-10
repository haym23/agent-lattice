import { useState } from "react";

const C = {
  bg: "#08080d", surface: "#101018", border: "#1c1c2e",
  text: "#dddce4", textMuted: "#7a7a92", textDim: "#3e3e56",
  accent: "#c9a0ff", green: "#7ae8a0", orange: "#f0b866",
  red: "#f07878", blue: "#78b8f0", cyan: "#6aded8",
  pink: "#e88acd", yellow: "#e8e070",
};

const F = {
  mono: "'JetBrains Mono', 'SF Mono', monospace",
  sans: "'DM Sans', 'Helvetica Neue', sans-serif",
  display: "'Space Grotesk', 'DM Sans', sans-serif",
};

function Badge({ children, color, small }) {
  return <span style={{ display: "inline-block", padding: small ? "1px 6px" : "2px 8px", borderRadius: 4, fontSize: small ? 10 : 11, fontFamily: F.mono, fontWeight: 600, color, backgroundColor: color + "15", border: "1px solid " + color + "30", letterSpacing: "0.02em" }}>{children}</span>;
}

function Section({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
        {sub && <p style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted, margin: "3px 0 0 0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Pre({ children }) {
  return <div style={{ padding: "12px 14px", background: C.surface, border: "1px solid " + C.border, borderRadius: 7, fontFamily: F.mono, fontSize: 11, color: C.textMuted, lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre" }}>{children}</div>;
}

function InfoBox({ title, color, children }) {
  return (
    <div style={{ padding: "12px 14px", background: color + "06", border: "1px solid " + color + "18", borderRadius: 7 }}>
      <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

function Clr({ c, children }) {
  return <span style={{ color: c }}>{children}</span>;
}

const TIERS = [
  { tier: "Nano", color: C.green, models: ["Haiku 3.5", "GPT-4o-mini", "Gemini Flash"], tasks: ["Classification", "Routing", "Validation", "Extraction", "Templating"], tokens: "~500-2K", latency: "<200ms", cost: "$" },
  { tier: "Micro", color: C.blue, models: ["Sonnet 4.5", "GPT-4o", "Gemini Pro"], tasks: ["Summarization", "Structured extraction", "Code gen", "Translation"], tokens: "~2K-8K", latency: "200-800ms", cost: "$$" },
  { tier: "Standard", color: C.orange, models: ["Opus 4.5", "GPT-4.5", "Gemini Ultra"], tasks: ["Complex reasoning", "Creative writing", "Architecture", "Multi-domain synthesis"], tokens: "~4K-32K", latency: "1-5s", cost: "$$$" },
  { tier: "Heavy", color: C.red, models: ["Opus 4.6", "o3", "Deep Research"], tasks: ["Novel research", "Entangled reasoning", "Long coherent generation", "Critical decisions"], tokens: "~8K-100K+", latency: "5-60s+", cost: "$$$$" },
];

const BT = [
  { type: "generate", label: "Generate", color: C.accent, icon: "\u2726", dt: 1 },
  { type: "analyze", label: "Analyze", color: C.blue, icon: "\u25C9", dt: 1 },
  { type: "transform", label: "Transform", color: C.cyan, icon: "\u27F3", dt: 0 },
  { type: "validate", label: "Validate", color: C.green, icon: "\u2713", dt: 0 },
  { type: "reason", label: "Reason", color: C.orange, icon: "\u25C6", dt: 2 },
  { type: "route", label: "Route", color: C.pink, icon: "\u2442", dt: 0 },
];

const TABS = [
  { id: "overview", label: "Architecture" },
  { id: "fusion", label: "Block Fusion" },
  { id: "reasoning", label: "Reasoning Traces" },
  { id: "routing", label: "Model Routing" },
  { id: "runtime", label: "Runtime" },
  { id: "workflow", label: "Example Flow" },
];

function OverviewTab() {
  const stages = [
    { label: "Intent Blocks", sub: "User UX", color: C.accent, icon: "\u25C7" },
    { label: "Prompt Compiler", sub: "Analyze + Fuse", color: C.cyan, icon: "\u27D0" },
    { label: "Model Router", sub: "Task \u2192 Tier", color: C.orange, icon: "\u2295" },
    { label: "LLM Runtime", sub: "Execute", color: C.green, icon: "\u25B8" },
    { label: "Output Assembly", sub: "Merge", color: C.pink, icon: "\u25C8" },
  ];
  return (
    <div>
      <Section title="System Pipeline" sub="Five-stage flow from user intent to optimized execution">
        <div style={{ display: "flex", gap: 2, width: "100%" }}>
          {stages.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
              <div style={{ flex: 1, background: s.color + "08", border: "1px solid " + s.color + "22", borderRadius: 7, padding: "12px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 16, opacity: 0.6 }}>{s.icon}</span>
                <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: s.color, textAlign: "center", lineHeight: 1.2 }}>{s.label}</span>
                <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textMuted }}>{s.sub}</span>
              </div>
              {i < stages.length - 1 && <div style={{ display: "flex", alignItems: "center", padding: "0 2px", color: C.textDim, fontSize: 13 }}>{"\u2192"}</div>}
            </div>
          ))}
        </div>
      </Section>
      <Section title="Full Architecture" sub="With block fusion, reasoning traces, and escalation paths">
        <Pre>
          {"USER LAYER\n"}
          {"  [Gen] \u2192 [Ana] \u2192 [Rea] \u2192 [Val] \u2192 [Fmt]   Intent Blocks\n"}
          {"\u2500".repeat(60) + "\n"}
          {"COMPILER\n"}
          {"  1. Parse DAG + resolve templates\n"}
          {"  2. Complexity scoring per block\n"}
          <Clr c={C.yellow}>{"  3. Block Fusion pass \u2190 NEW\n"}</Clr>
          {"     \u251C\u2500 Detect sequential chains\n"}
          {"     \u251C\u2500 Detect coherence dependencies\n"}
          {"     \u2514\u2500 Merge blocks where serialization > 20%\n"}
          <Clr c={C.cyan}>{"  4. Reasoning trace planning \u2190 NEW\n"}</Clr>
          {"     \u251C\u2500 Tag edges: data-only vs coherence\n"}
          {"     \u2514\u2500 Attach trace config per handoff\n"}
          {"  5. Context pruning + cache key generation\n"}
          {"  6. Emit execution plan\n"}
          {"\u2500".repeat(60) + "\n"}
          {"ROUTER\n"}
          {"  Tier assignment (compile-time + runtime)\n  "}
          <Clr c={C.green}>[Nano]</Clr>{" "}<Clr c={C.blue}>[Micro]</Clr>{" "}<Clr c={C.orange}>[Std]</Clr>{" "}<Clr c={C.red}>[Heavy]</Clr>{"   Model Pools\n"}
          {"\u2500".repeat(60) + "\n"}
          {"RUNTIME\n"}
          {"  Parallel Executor\n"}
          {"  \u251C\u2500 Cache Hit (skip)\n"}
          {"  \u251C\u2500 LLM Call "}<Clr c={C.yellow}>+ reasoning_trace: on</Clr>{"\n"}
          {"  \u2514\u2500 Quality Gate\n"}
          {"       \u251C\u2500 Pass \u2192 store output + trace\n"}
          {"       \u2514\u2500 Fail \u2192 "}<Clr c={C.red}>Escalate</Clr><Clr c={C.yellow}> + attach trace</Clr>{"\n"}
          {"  Handoff Manager\n"}
          {"    \u251C\u2500 "}<Clr c={C.cyan}>data-only: output only</Clr>{"\n"}
          {"    \u251C\u2500 "}<Clr c={C.yellow}>coherence: output + trace</Clr>{"\n"}
          {"    \u2514\u2500 "}<Clr c={C.red}>escalation: full context</Clr>{"\n"}
          {"\u2500".repeat(60) + "\n"}
          {"OUTPUT\n"}
          {"  Merge + Validate + Strip traces + Return\n"}
        </Pre>
      </Section>
      <Section title="Block Palette" sub="Drag-and-drop primitives with default tier assignments">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {BT.map((bt) => (
            <div key={bt.type} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: bt.color + "10", border: "1px solid " + bt.color + "25", borderRadius: 6 }}>
              <span style={{ fontSize: 13 }}>{bt.icon}</span>
              <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: bt.color }}>{bt.label}</span>
              <Badge color={TIERS[bt.dt].color} small>{TIERS[bt.dt].tier}</Badge>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function FusionTab() {
  var examples = [
    { before: [["Classify (Nano)", C.green], ["Extract (Nano)", C.green], ["Outline (Std)", C.orange]], after: [["Classify + Extract (Nano)", C.green], ["Outline (Std)", C.orange]], rule: "Rule 2 \u2014 serialization between two Nano blocks > 20% overhead", savings: "~150 tokens, ~100ms saved" },
    { before: [["Outline (Std)", C.orange], ["Draft (Micro)", C.blue]], after: [["Outline + Draft (Std)", C.orange]], rule: "Rule 1 \u2014 coherence dependency, draft depends on outline reasoning", savings: "~200 tokens, coherence preserved" },
    { before: [["Research (Heavy)", C.red], ["Format (Nano)", C.green]], after: [["Research (Heavy)", C.red], ["Format (Nano)", C.green]], rule: "Rule 3 \u2014 tier gap of 3, formatting is 200 tokens, not worth Heavy pricing", savings: "No fusion \u2014 saves ~$0.03 per run" },
  ];
  return (
    <div>
      <Section title="Block Fusion" sub="The compiler pass that decides which blocks to merge into single model calls">
        <InfoBox title="Why Fuse?" color={C.yellow}>
          {"Every handoff between models costs: serialization (~50-100 tokens of prompt overhead), network round-trip (~50-200ms), and context loss (the downstream model lacks the upstream model\u2019s internal reasoning state). Fusion eliminates these costs by batching adjacent blocks into a single prompt."}
        </InfoBox>
      </Section>
      <Section title="Fusion Decision Algorithm">
        <Pre>
          {"function shouldFuse(blockA, blockB, edge)\n\n"}
          {"  // "}<Clr c={C.green}>Rule 1: Always fuse coherence-dependent blocks</Clr>{"\n"}
          {"  if edge.type == \"coherence\" return\n"}
          {"    fuse: true, tier: max(a.tier, b.tier)\n\n"}
          {"  // "}<Clr c={C.blue}>Rule 2: Fuse when serialization overhead is high</Clr>{"\n"}
          {"  if edge.type == \"data\"\n"}
          {"    overheadRatio = handoffTokens / cheapBlockTokens\n"}
          {"    if overheadRatio > 0.20 return fuse: true\n\n"}
          {"  // "}<Clr c={C.orange}>Rule 3: Don\u2019t fuse when tier gap large + cheap block big</Clr>{"\n"}
          {"  if tierGap >= 2 && cheapBlock.tokens > 1000\n"}
          {"    return fuse: false\n\n"}
          {"  // "}<Clr c={C.pink}>Rule 4: Don\u2019t fuse parallel-independent blocks</Clr>{"\n"}
          {"  if edge.type == \"none\" return fuse: false\n\n"}
          {"  // "}<Clr c={C.accent}>Rule 5: Fuse by default for adjacent tiers</Clr>{"\n"}
          {"  return fuse: true, tier: max(a.tier, b.tier)\n"}
        </Pre>
      </Section>
      <Section title="Fusion Examples">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {examples.map(function(ex, i) {
            return (
              <div key={i} style={{ padding: "12px 14px", background: C.surface, border: "1px solid " + C.border, borderRadius: 7 }}>
                <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Before</span>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                      {ex.before.map(function(b, j) {
                        return (
                          <span key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Badge color={b[1]}>{b[0]}</Badge>
                            {j < ex.before.length - 1 && <span style={{ color: C.textDim, fontFamily: F.mono, fontSize: 11 }}>{"\u2192"}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>After</span>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                      {ex.after.map(function(b, j) {
                        return (
                          <span key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Badge color={b[1]}>{b[0]}</Badge>
                            {j < ex.after.length - 1 && <span style={{ color: C.textDim, fontFamily: F.mono, fontSize: 11 }}>{"\u2192"}</span>}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}>{ex.rule}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.green, marginTop: 2 }}>{ex.savings}</div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Fused Prompt Structure">
        <InfoBox title="How a fused multi-block prompt looks to the model" color={C.cyan}>
          <Pre>
            {"[system]\n"}
            {"You will perform two tasks in sequence.\n"}
            {"Output your work in the structured format below.\n\n"}
            {"[task_1 type=classify output=json]\n"}
            {"Classify the following input by content type.\n"}
            {"Input: (user_input)\n\n"}
            {"[task_2 type=extract depends_on=task_1]\n"}
            {"Using your classification from task 1, extract\n"}
            {"the relevant entities from the input.\n\n"}
            {"[output_format]\n"}
            {"  task_1: classification: \"...\"\n"}
            {"  task_2: entities: [...]\n"}
          </Pre>
        </InfoBox>
      </Section>
    </div>
  );
}

function ReasoningTab() {
  var traceTypes = [
    { name: "No Trace", tag: "data-only", color: C.green, desc: "Pass only the structured output. Use for independent blocks, format transforms, validation.", overhead: "+0 tokens", example: "entities: [\"AAPL\", \"Q3\", \"revenue\"]" },
    { name: "Summary Trace", tag: "coherence", color: C.yellow, desc: "Pass output + compressed reasoning summary. Use for sequential creative/analytical chains.", overhead: "+100-300 tokens", example: "output: \"...\" reasoning_trace: \"Chose narrative structure because input has chronological data. Prioritized Q3 over Q2. Tone: formal.\"" },
    { name: "Full Trace", tag: "escalation", color: C.red, desc: "Pass output + full chain-of-thought + failure context. Use for escalations and heavy reasoning handoffs.", overhead: "+500-2K tokens", example: "output: \"...\" full_trace: \"[thinking] Considered three approaches... A fails because... B has edge case... Chose C [/thinking]\" escalation_reason: \"confidence below threshold\"" },
  ];
  return (
    <div>
      <Section title="Reasoning Trace Propagation" sub="Using model reasoning output to maintain continuity across handoffs">
        <InfoBox title="The Core Problem" color={C.red}>
          {"When Model A produces output and hands it to Model B, Model B only sees the result \u2014 not the reasoning that led to it. This is like reading someone\u2019s conclusion without their argument. Model B may make different assumptions, contradict Model A\u2019s logic, or duplicate reasoning work."}
        </InfoBox>
      </Section>
      <Section title="Trace Types">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {traceTypes.map(function(t) {
            return (
              <div key={t.name} style={{ padding: "12px 14px", background: t.color + "06", border: "1px solid " + t.color + "18", borderRadius: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: t.color }}>{t.name}</span>
                    <Badge color={t.color} small>{t.tag}</Badge>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}>{t.overhead}</span>
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: t.color + "aa", background: C.bg, padding: "8px 10px", borderRadius: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{t.example}</div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Trace Decision Logic">
        <Pre>
          {"function getTraceConfig(blockA, blockB, edge)\n\n"}
          {"  // "}<Clr c={C.green}>Independent blocks: no trace needed</Clr>{"\n"}
          {"  if edge.type == \"none\" or \"data-only\"\n"}
          {"    return mode: none, overhead: 0\n\n"}
          {"  // "}<Clr c={C.red}>Escalation: always full trace</Clr>{"\n"}
          {"  if edge.type == \"escalation\"\n"}
          {"    return mode: full\n"}
          {"    prompt: \"Previous model attempted but (failureReason).\n"}
          {"            Its reasoning: (trace). Please correct.\"\n\n"}
          {"  // "}<Clr c={C.yellow}>Coherence chains: summary trace</Clr>{"\n"}
          {"  if edge.type == \"coherence\"\n"}
          {"    traceCost = estimateTraceTokens(blockA)\n"}
          {"    if traceCost / blockBCost > 0.15\n"}
          {"      return mode: summary, max_tokens: blockBCost * 0.10\n"}
          {"    return mode: summary\n\n"}
          {"  // "}<Clr c={C.blue}>Same-tier sequential: lightweight trace</Clr>{"\n"}
          {"  if blockA.tier == blockB.tier\n"}
          {"    return mode: summary, max_tokens: 150\n\n"}
          {"  return mode: none\n"}
        </Pre>
      </Section>
      <Section title="How Traces Flow Through the DAG">
        <Pre>
          {"         \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n"}
          {"         \u2502 Block A  \u2502  (Nano: Classify)\n"}
          {"         \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2518\n"}
          {"              \u2502 "}<Clr c={C.green}>data-only: type: "financial_report"</Clr>{"\n"}
          {"              \u2502\n"}
          {"         \u250C\u2500\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2500\u2510\n"}
          {"         \u2502 Block B  \u2502  (Standard: Research)\n"}
          {"         \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2518\n"}
          {"              \u2502 "}<Clr c={C.yellow}>coherence trace:</Clr>{"\n"}
          {"              \u2502 "}<Clr c={C.yellow}>output + reasoning about structure decisions</Clr>{"\n"}
          {"              \u2502\n"}
          {"         \u250C\u2500\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2500\u2510\n"}
          {"         \u2502 Block C  \u2502  (Micro: Draft) "}<Clr c={C.textDim}>{"\u2190 receives outline + WHY"}</Clr>{"\n"}
          {"         \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2518\n"}
          {"              \u2502 "}<Clr c={C.green}>data-only: draft</Clr>{"\n"}
          {"              \u2502\n"}
          {"         \u250C\u2500\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2500\u2510\n"}
          {"         \u2502 Block D  \u2502  (Nano: Validate)\n"}
          {"         \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2518\n"}
          {"              \u2502 "}<Clr c={C.green}>pass \u2192 output</Clr>{"\n"}
          {"              \u2502 "}<Clr c={C.red}>fail \u2192 escalate with full trace</Clr>{"\n"}
          {"              \u2502\n"}
          {"         \u250C\u2500\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2500\u2510\n"}
          {"         \u2502 Block E  \u2502  (Nano: Format)\n"}
          {"         \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n"}
        </Pre>
      </Section>
      <Section title="Reasoning API Integration">
        <InfoBox title="Getting Traces from Different Providers" color={C.accent}>
          <Pre>
            {"Anthropic (extended thinking):\n"}
            {"  Set thinking: enabled in the API call.\n"}
            {"  Model returns [thinking]...[/thinking] blocks\n"}
            {"  you can extract and forward.\n\n"}
            {"OpenAI (chain-of-thought):\n"}
            {"  Prompt: \"Think step by step in [reasoning]\n"}
            {"  tags before answering.\"\n"}
            {"  Or use o-series with built-in reasoning.\n\n"}
            {"Generic (any model):\n"}
            {"  Prompt: \"Write key decisions in [trace] tags.\n"}
            {"  Be concise \u2014 max 150 tokens.\"\n"}
            {"  Parse and extract the [trace] block.\n\n"}
            {"Compiler normalizes all formats into:\n"}
            {"  trace: string, confidence: float,\n"}
            {"  decisions: string[]\n"}
          </Pre>
        </InfoBox>
      </Section>
      <Section title="Token Budget Impact">
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { label: "No Traces", tokens: "~8K", cost: "$0.04", coh: "Low", color: C.green },
            { label: "Summary", tokens: "~9.5K", cost: "$0.05", coh: "High", color: C.yellow },
            { label: "Full", tokens: "~14K", cost: "$0.09", coh: "Maximum", color: C.red },
            { label: "Single Opus", tokens: "~30K", cost: "$0.45", coh: "Native", color: C.textMuted },
          ].map(function(r) {
            return (
              <div key={r.label} style={{ flex: 1, padding: "10px", background: r.color + "06", border: "1px solid " + r.color + "18", borderRadius: 7, textAlign: "center" }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: r.color, marginBottom: 6 }}>{r.label}</div>
                <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: C.text }}>{r.tokens}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted, marginTop: 4 }}>{r.cost}</div>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: r.color, marginTop: 2 }}>{"Coherence: " + r.coh}</div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function RoutingTab() {
  var _s = useState(null);
  var expanded = _s[0];
  var setExpanded = _s[1];
  return (
    <div>
      <Section title="Model Tier Registry" sub="Click a tier to expand">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {TIERS.map(function(tier, i) {
            return (
              <div key={tier.tier} onClick={function() { setExpanded(expanded === i ? null : i); }}
                style={{ background: expanded === i ? tier.color + "08" : C.surface, border: "1px solid " + (expanded === i ? tier.color + "35" : C.border), borderRadius: 7, padding: "10px 12px", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Badge color={tier.color}>{tier.tier}</Badge>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}>{tier.cost + " \u00B7 " + tier.latency}</span>
                  </div>
                  <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textDim }}>{(expanded === i ? "\u25BE" : "\u25B8") + " " + tier.tokens}</span>
                </div>
                {expanded === i && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Models</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                        {tier.models.map(function(m) { return <span key={m} style={{ fontFamily: F.mono, fontSize: 11, color: tier.color, background: tier.color + "12", padding: "2px 7px", borderRadius: 4 }}>{m}</span>; })}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontFamily: F.mono, fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em" }}>Task Types</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                        {tier.tasks.map(function(t) { return <span key={t} style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted, background: C.border, padding: "2px 6px", borderRadius: 3 }}>{t}</span>; })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Routing Decision Tree">
        <Pre>
          {"block.type == route | validate | transform\n"}
          {"  \u2514\u2192 complexity < 25?  \u2192  "}<Clr c={C.green}>Nano</Clr>{"\n"}
          {"  \u2514\u2192 else              \u2192  "}<Clr c={C.blue}>Micro</Clr>{"\n\n"}
          {"block.type == analyze | generate\n"}
          {"  \u2514\u2192 structured output (JSON)?  \u2192  "}<Clr c={C.blue}>Micro</Clr>{"\n"}
          {"  \u2514\u2192 open-ended prose?\n"}
          {"      \u2514\u2192 complexity < 50?  \u2192  "}<Clr c={C.blue}>Micro</Clr>{"\n"}
          {"      \u2514\u2192 else              \u2192  "}<Clr c={C.orange}>Standard</Clr>{"\n\n"}
          {"block.type == reason\n"}
          {"  \u2514\u2192 single-domain?       \u2192  "}<Clr c={C.orange}>Standard</Clr>{"\n"}
          {"  \u2514\u2192 multi-domain / novel? \u2192  "}<Clr c={C.red}>Heavy</Clr>{"\n\n"}
          <Clr c={C.yellow}>POST-FUSION adjustment:</Clr>{"\n"}
          {"  fused blocks always use max(tier_a, tier_b)\n"}
          {"  trace overhead factored into token budget\n\n"}
          {"user_override == high_reasoning  \u2192  "}<Clr c={C.red}>Heavy</Clr>{" (always)\n"}
        </Pre>
      </Section>
      <InfoBox title="When NOT to Split" color={C.red}>
        {"The router should detect entangled tasks and bypass decomposition: when block outputs can\u2019t be evaluated without understanding the full intent, when blocks have circular dependencies, when the user marks a workflow as \"coherent unit\", or when overall complexity exceeds the sum of parts."}
      </InfoBox>
    </div>
  );
}

function RuntimeTab() {
  var caps = [
    { label: "Try-Cheap-First", desc: "Run at lowest viable tier, escalate on quality gate failure", color: C.green },
    { label: "Parallel Fan-Out", desc: "Independent blocks execute concurrently across model pools", color: C.blue },
    { label: "Cache Layer", desc: "Content-addressed cache: hash(intent + input) \u2192 stored output", color: C.cyan },
    { label: "Streaming Assembly", desc: "Merge partial outputs as they arrive", color: C.orange },
    { label: "Escalation + Trace", desc: "Failed blocks escalate with reasoning traces for next model", color: C.red },
    { label: "Agent Switching", desc: "Mid-block model swap if confidence/latency bounds exceeded", color: C.pink },
  ];
  return (
    <div>
      <Section title="Runtime Capabilities" sub="Execution strategies for the compiled plan">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {caps.map(function(f) {
            return (
              <div key={f.label} style={{ padding: "10px 12px", background: f.color + "06", border: "1px solid " + f.color + "18", borderRadius: 7 }}>
                <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: f.color }}>{f.label}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Escalation Flow with Reasoning Traces">
        <Pre>
          {"1. Execute block at assigned tier (e.g., "}<Clr c={C.blue}>Micro</Clr>{")\n"}
          {"   \u2514\u2500 If trace enabled:\n"}
          {"      prompt includes \"Explain key decisions in [trace] tags\"\n\n"}
          {"2. Receive response, extract output + trace (if present)\n\n"}
          {"3. Run quality gate:\n"}
          {"   \u251C\u2500 Format valid?     (schema check)\n"}
          {"   \u251C\u2500 Confidence > \u03B8?   (model self-report or Nano classifier)\n"}
          {"   \u251C\u2500 Coherent?         (semantic similarity to intent)\n"}
          {"   \u2514\u2500 Constraints met?  (length, tone, required elements)\n\n"}
          {"4. If ALL pass:\n"}
          {"   \u251C\u2500 Store output in DAG state\n"}
          {"   "}<Clr c={C.yellow}>{"\u251C\u2500 Store trace if downstream blocks need it"}</Clr>{"\n"}
          {"   \u2514\u2500 Continue to next block\n\n"}
          {"5. If ANY fail \u2192 escalate to next tier ("}<Clr c={C.orange}>Standard</Clr>{"):\n"}
          {"   "}<Clr c={C.red}>{"\u251C\u2500 Include failure reason in escalated prompt"}</Clr>{"\n"}
          {"   "}<Clr c={C.red}>{"\u251C\u2500 Include full reasoning trace from failed attempt"}</Clr>{"\n"}
          {"   \u251C\u2500 \"Previous model attempted but [failure].\n"}
          {"   \u2502   Its reasoning: [trace]. Please correct.\"\n"}
          {"   \u2514\u2500 Max 2 escalations per block\n\n"}
          {"6. Log escalation for compiler feedback loop\n"}
          {"   \u2514\u2500 If block consistently escalates \u2192 update default tier\n"}
        </Pre>
      </Section>
      <Section title="Latency Budgeting">
        <InfoBox title="Where Time Actually Goes" color={C.orange}>
          <Pre>
            {"Handoff overhead per model switch:\n"}
            {"  Prompt construction:    ~10-30ms  (local)\n"}
            {"  Network round-trip:     ~30-80ms  (API setup)\n"}
            {"  Queue/scheduling:       ~0-500ms  (variable)\n"}
            {"  Trace extraction:       ~5-10ms   (parsing)\n"}
            {"  Total per handoff:      ~50-600ms\n\n"}
            {"Mitigation strategies:\n"}
            {"  1. Fuse blocks aggressively (fewer handoffs)\n"}
            {"  2. Warm model pools (pre-establish connections)\n"}
            {"  3. Parallel execution of independent branches\n"}
            {"  4. Speculative execution: start next block before\n"}
            {"     quality gate completes (cancel if gate fails)\n\n"}
            {"For a 6-block workflow fused to 4 execution units:\n"}
            {"  3 handoffs x ~150ms avg = ~450ms overhead\n"}
            {"  vs sequential 6-block: 5 x ~150ms = ~750ms\n"}
            {"  vs single Opus call: 0 handoffs, but 5-15s model\n"}
          </Pre>
        </InfoBox>
      </Section>
    </div>
  );
}

function WorkflowTab() {
  var blocks = [
    { label: "Classify Input", type: "route", tier: 0, desc: "Determine content type", trace: "none", fused: "A" },
    { label: "Extract Requirements", type: "analyze", tier: 0, desc: "Pull constraints", trace: "none", fused: "A" },
    { label: "Research & Outline", type: "reason", tier: 2, desc: "Deep reasoning on structure", trace: "summary \u2192 next", fused: "B" },
    { label: "Draft Content", type: "generate", tier: 1, desc: "Generate from outline + trace", trace: "receives trace", fused: "B" },
    { label: "Quality Check", type: "validate", tier: 0, desc: "Verify constraints met", trace: "none", fused: "C" },
    { label: "Format Output", type: "transform", tier: 0, desc: "Apply template formatting", trace: "none", fused: "C" },
  ];
  return (
    <div>
      <Section title={"Example: Research \u2192 Draft \u2192 Review"} sub="6-block workflow showing fusion, routing, and trace decisions">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {blocks.map(function(block, i) {
            var bt = BT.find(function(b) { return b.type === block.type; });
            var tier = TIERS[block.tier];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: "1px solid " + C.border, borderRadius: 6, padding: "8px 12px" }}>
                <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: bt.color + "18", border: "1px solid " + bt.color + "30", borderRadius: 4, fontSize: 11, flexShrink: 0 }}>{bt.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: C.text }}>{block.label}</div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}>{block.desc}</div>
                </div>
                <Badge color={tier.color} small>{tier.tier}</Badge>
                {block.trace !== "none" && <Badge color={C.yellow} small>{block.trace}</Badge>}
                <Badge color={C.accent} small>{"group " + block.fused}</Badge>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", background: C.green + "08", border: "1px solid " + C.green + "20", borderRadius: 6 }}>
          <span style={{ fontFamily: F.mono, fontSize: 10, color: C.green }}>{"\u2726 After fusion: 6 blocks \u2192 3 execution groups \u00B7 2 handoffs \u00B7 summary trace on B\u2192C boundary"}</span>
        </div>
      </Section>
      <Section title="Compiled Execution Plan (Post-Fusion)">
        <Pre>
          {"Phase 1 \u2014 Group A (parallel-eligible):\n"}
          {"  "}<Clr c={C.green}>{"Fused: Classify + Extract \u2192 Nano (Haiku 3.5)"}</Clr>{"\n"}
          {"  Prompt: \"Classify this input, then extract requirements.\"\n"}
          {"  Output: type, constraints\n"}
          {"  Trace: none\n"}
          {"  Est: ~500 tokens, ~180ms\n\n"}
          {"Phase 2 \u2014 Group B (depends on Phase 1):\n"}
          {"  "}<Clr c={C.orange}>{"Fused: Research + Draft \u2192 Standard (Opus 4.5)"}</Clr>{"\n"}
          {"  "}<Clr c={C.yellow}>Reasoning: ENABLED</Clr>{"\n"}
          {"  Prompt: \"Given constraints, research and outline, then draft.\n"}
          {"           Explain structural decisions in [trace] tags.\"\n"}
          {"  Output: outline, draft, trace\n"}
          {"  Est: ~5K tokens, ~3s\n\n"}
          {"Phase 3 \u2014 Group C (parallel-eligible):\n"}
          {"  "}<Clr c={C.green}>{"Fused: Validate + Format \u2192 Nano (Haiku 3.5)"}</Clr>{"\n"}
          {"  Prompt: \"Check draft against constraints, then format.\"\n"}
          {"  Input: draft (trace stripped)\n"}
          {"  Est: ~400 tokens, ~150ms\n"}
          {"  "}<Clr c={C.red}>{"Escalation: if validation fails \u2192 re-run Phase 2"}</Clr>{"\n"}
          {"  "}<Clr c={C.red}>{"at Heavy tier with: draft, errors, original_trace"}</Clr>{"\n\n"}
          {"\u2500".repeat(50) + "\n"}
          {"Total (happy path):  ~5.9K tokens \u00B7 ~3.3s \u00B7 ~$0.06\n"}
          {"Total (escalation):  ~12K tokens  \u00B7 ~8s   \u00B7 ~$0.18\n"}
          {"Single Opus 4.6:     ~30K tokens  \u00B7 ~12s  \u00B7 ~$0.45\n"}
          {"\u2500".repeat(50) + "\n"}
        </Pre>
      </Section>
      <InfoBox title="What the Reasoning Trace Buys You Here" color={C.yellow}>
        {"In Phase 2, outline and draft are fused into one Standard model call. But if escalation fires and a Heavy model re-drafts, it receives the original model\u2019s trace: \"Structured as problem\u2192analysis\u2192recommendation because financial reports need actionable conclusions.\" The Heavy model doesn\u2019t start from scratch \u2014 it understands the original reasoning and can correct or extend it. This typically saves 30-50% of the Heavy model\u2019s generation time compared to a cold start."}
      </InfoBox>
    </div>
  );
}

export default function App() {
  var _s = useState("overview");
  var tab = _s[0];
  var setTab = _s[1];
  var content = { overview: OverviewTab, fusion: FusionTab, reasoning: ReasoningTab, routing: RoutingTab, runtime: RuntimeTab, workflow: WorkflowTab };
  var TabContent = content[tab];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.sans, padding: "20px 16px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.04em" }}>Intent Compilation Layer</h1>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: C.textMuted }}>v0.2 \u2014 fusion + traces</span>
          </div>
          <p style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, margin: "4px 0 0 0" }}>{"Block-based intent \u2192 compiled DAG \u2192 block fusion \u2192 reasoning traces \u2192 multi-model execution"}</p>
        </div>
        <div style={{ display: "flex", gap: 2, background: C.surface, borderRadius: 7, padding: 3, border: "1px solid " + C.border, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(function(t) {
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }} style={{ flex: 1, minWidth: 80, padding: "7px 10px", background: tab === t.id ? C.accent + "15" : "transparent", border: tab === t.id ? "1px solid " + C.accent + "28" : "1px solid transparent", borderRadius: 5, fontFamily: F.mono, fontSize: 11, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? C.accent : C.textMuted, cursor: "pointer" }}>{t.label}</button>
            );
          })}
        </div>
        <TabContent />
      </div>
    </div>
  );
}
