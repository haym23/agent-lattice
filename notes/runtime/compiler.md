# Agent Lattice Compiler Specification

## Purpose

This document defines the **Agent Lattice Compiler**: the system responsible for deterministically converting **UI blocks** into **model-optimized prompt packages** via an intermediate representation (IR). The compiler exists to maximize correctness, reliability, and performance of *individual agent/model executions* before any multi-agent orchestration is introduced.

The compiler is explicitly **not** a planner, runtime, or executor. It is a *lowering and optimization pipeline*.

---

## Design Goals

1. **Determinism** – Same inputs produce the same prompts.
2. **Target Awareness** – Prompts are optimized per model/tool environment.
3. **Contract Enforcement** – Outputs are machine-validated, not best-effort.
4. **Context Efficiency** – Only necessary data is passed to each step.
5. **Composable Correctness** – Each step is independently verifiable.

---

## Compiler Responsibilities

### The Compiler DOES:

* Normalize UI blocks into canonical forms
* Infer types, effects, and constraints
* Lower declarative intent into executable steps
* Generate prompt + tool-call packages optimized per model
* Attach validation and repair logic

### The Compiler DOES NOT:

* Perform high-level planning or goal decomposition
* Execute tools or LLM calls
* Manage long-term memory or persistence
* Coordinate multi-agent negotiation or delegation

---

## High-Level Pipeline

```
UI Blocks
   ↓
BlockIR (Normalized)
   ↓
PlanIR (Declarative Intent)
   ↓
ExecIR (Executable Graph)
   ↓
PromptPackage[] (Target-Optimized)
```

Each stage is pure, testable, and serializable.

---

## IR Layers

### 1. BlockIR

**Purpose:** Remove UI ambiguity.

**Characteristics:**

* One-to-one with user blocks
* All defaults resolved
* All ports and wires explicit
* Provenance attached to every value

**BlockIR Schema (Conceptual)**

```ts
BlockIR {
  id: string
  type: BlockType
  inputs: Record<string, ValueRef>
  outputs: Record<string, OutputPort>
  config: Record<string, any>
  provenance: Record<string, "user" | "default" | "upstream">
}
```

---

### 2. PlanIR

**Purpose:** Make *intent* explicit and typed.

**Characteristics:**

* Declarative (what should happen)
* Fully typed edges
* Effects and constraints inferred
* No execution details

**Key Additions:**

* Data types: `string | number | json | table | file | email | ...`
* Effects: `READ`, `WRITE`, `NET`, `FS`, `LLM`
* Constraints: privacy, safety class, citation requirements

**PlanIR Node (Conceptual)**

```ts
PlanNode {
  id: string
  intent: IntentType
  inputs: TypedInput[]
  outputs: TypedOutput[]
  effects: Effect[]
  constraints: Constraint[]
}
```

---

### 3. ExecIR

**Purpose:** Make execution deterministic.

**Characteristics:**

* Explicit operations
* Explicit control flow
* Explicit IO contracts
* Explicit failure modes

**Canonical ExecIR Node Types**

| Node Type | Description                 |
| --------- | --------------------------- |
| LLMCall   | Model inference step        |
| ToolCall  | Deterministic external call |
| Branch    | Conditional execution       |
| ForEach   | Bounded iteration           |
| Join      | Deterministic merge         |
| Validate  | Schema/semantic validation  |
| Repair    | Structured retry            |
| Load      | Read from runtime memory    |
| Store     | Write to runtime memory     |

**ExecIR Node (Conceptual)**

```ts
ExecNode {
  id: string
  op: ExecOpType
  inputs: IOContract
  outputs: IOContract
  failure_modes: FailureMode[]
  on_failure: ExecNodeId[]
}
```

---

## TargetProfile Specification

The compiler always targets a **TargetProfile**.

### Purpose

To encode model and environment quirks so the compiler can generate *optimal* prompts.

### TargetProfile Schema

```ts
TargetProfile {
  id: string
  model_family: string
  max_context_tokens: number
  max_output_tokens: number
  tool_calling: {
    supported: boolean
    strict: boolean
  }
  json_reliability: "low" | "medium" | "high"
  strengths: string[]
  weaknesses: string[]
  preferred_prompt_patterns: string[]
  known_failure_modes: string[]
  default_decode: DecodeParams
}
```

---

## PromptPackage Specification

**This is the compiler’s primary output.**

### PromptPackage Schema

```ts
PromptPackage {
  id: string
  exec_node_id: string
  messages: Message[]
  tools?: ToolSchema[]
  response_contract: ResponseContract
  decode: DecodeParams
  context_refs: ContextHandle[]
  validation: ValidationSpec
  repair: RepairSpec
}
```

### ResponseContract

```ts
ResponseContract {
  format: "json_schema" | "tool_call" | "text" | "markdown"
  schema?: JSONSchema
  strict: boolean
}
```

---

## Compiler Passes (Ordered)

### Pass 1: Block Normalization

* Resolve defaults
* Canonicalize configs
* Assign stable IDs

### Pass 2: Type & Effect Inference

* Infer edge data types
* Annotate side effects
* Detect unsafe or disallowed flows

### Pass 3: Execution Shaping

* Insert Validate / Repair nodes
* Convert conditionals into Branch nodes
* Bound loops

### Pass 4: Context Planning

* Compute token budget per node
* Slice inputs to minimum required fields
* Replace raw context with runtime handles

### Pass 5: Prompt Lowering

* Select prompt template family
* Emit system/instruction/data separation
* Attach tool schemas

### Pass 6: Optimization

* Fuse or split steps
* Prefer tools over LLM calls
* Tune decode params

---

## Context Planning Rules

1. No node receives full history by default
2. Inputs must be explicitly referenced
3. Prefer handles over inline text
4. Summarization must be deterministic
5. Token budgets are enforced at compile time

---

## Validation & Repair Model

### Validation

* JSON schema validation
* Semantic constraints (e.g. confidence thresholds)
* Tool usage checks

### Repair

* Format-only repair prompts
* Max retry count specified
* No re-instruction of task semantics

---

## Block → ExecIR Mapping Table

| UI Block     | ExecIR Node(s)            |
| ------------ | ------------------------- |
| Prompt       | LLMCall                   |
| Tool         | ToolCall                  |
| If / Else    | Branch + PredicateEval    |
| Loop         | ForEach / While (bounded) |
| Merge        | Join                      |
| Memory Read  | Load                      |
| Memory Write | Store                     |
| Guard        | Validate                  |
| Retry        | Repair                    |

---

## Step Shaping Heuristics

* **High precision output** → split + validate
* **Creative output** → fuse, higher temperature
* **Machine-consumed output** → strict schema, low temp
* **Deterministic task** → tool-first

---

## Safety & Policy Injection

Policies are injected:

* As a dedicated system segment
* Never mixed with task data
* Always referenced by constraint ID

---

## Acceptance Criteria

The compiler is considered correct when:

* Given the same BlockIR + TargetProfile, it emits identical PromptPackages
* Every PromptPackage has:

  * Explicit IO contract
  * Validation spec
  * Repair path
* No prompt exceeds its token budget
* All machine-consumed outputs are schema-validated

---

## Non-Goals (Explicit)

* Automatic agent delegation
* Emergent planning
* Implicit memory recall
* Chain-of-thought extraction

---

## Summary

The Agent Lattice Compiler is a **target-aware code generator** for LLM execution. By enforcing contracts, shaping steps, and optimizing prompts per model, it ensures each agent operates at maximum capacity *before* introducing multi-agent complexity.

Multi-agent workflows build on this foundation — they do not replace it.
