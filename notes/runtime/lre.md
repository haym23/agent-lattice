# Lattice Runtime Environment (LRE)

**Lattice Runtime Environment (LRE)** is a runtime system for executing agent workflows as **structured programs** over language models, tools, and external systems.

LRE makes **small, cheap, fast language models reliable** by shifting intelligence out of prompts and into:

* structure
* state
* validation
* deterministic control flow
* runtime repair and escalation

This is not prompt engineering.
This is not a chatbot framework.

LRE is an **execution substrate for agentic programs**.

---

## Why LRE Exists

Large language models are powerful, but:

* expensive
* slow
* unreliable when used as monolithic black boxes

Small models are fast and cheap, but:

* fragile
* bad at broad reasoning
* prone to format and tool-call errors

**LRE flips the problem.**

Instead of asking models to “be smart,” LRE:

* decomposes workflows into small, typed steps
* enforces schemas and invariants
* validates every output
* retries with targeted repairs
* escalates models only when strictly necessary

> **The system does the thinking. The model fills in the blanks.**

---

## Core Idea

LRE treats agent workflows like real programs:

* Nodes = instructions
* Edges = control flow
* State = explicit memory
* Validators = type system
* Retries = exception handling

Language models are used as **bounded execution units**, not as planners of last resort.

---

## Architecture Overview

```
UI Blocks / JSON Graph
        ↓ compile
Workflow Graph (AST)
        ↓ lower
Lattice IR (LIR)
        ↓ execute
LRE Runtime
        ↓
Prompt Compiler → LLM Calls (micro-prompts)
        ↓
Validators → Repair → Escalation
```

Key rule:

> **No model ever sees the full workflow.**

---

## What Is Lattice IR (LIR)?

**Lattice IR (LIR)** is the executable program format that LRE runs.

It is:

* JSON-based
* deterministic
* schema-validated
* vendor-neutral
* replayable

LIR describes:

* nodes (operations)
* edges (control flow)
* variable references
* validation rules
* retry and escalation policies

Think of LIR as **bytecode for agent workflows**.

---

## Runtime State Model

LRE uses explicit state instead of implicit model memory.

### Namespaces

* `$vars.*` – durable workflow state (handoffs between steps)
* `$tmp.*` – ephemeral scratch state
* `$ctx.*` – runtime metadata (read-only)
* `$in.*` – trigger input (read-only)

Passing data between “sub-agents” is done by writing to `$vars` and reading it later.

There is no hidden memory.

---

## Control Flow (No LLM Required)

All branching and looping is handled by the runtime.

* Edges have deterministic `when` conditions
* Conditions are evaluated by LRE, not by models
* Loops (`MAP`) and switches (`SWITCH`) are first-class runtime constructs

This guarantees:

* predictability
* debuggability
* reproducibility

---

## Core Operations

### Deterministic Ops

* `TOOL_CALL` – call tools or MCPs
* `PACK` – project and trim state for model inputs
* `MERGE` – combine structured state
* `SWITCH` – deterministic branching
* `MAP` – loop over lists

### LLM Ops (Small-Model Optimized)

* `LLM_EXTRACT` – structured extraction
* `LLM_CLASSIFY` – finite-label routing
* `LLM_CHOOSE` – pick an item by ID
* `LLM_WRITE` – bounded generation

All LLM ops:

* require output schemas
* are validated after execution
* support targeted repair
* escalate models only on defined failure conditions

---

## Validation & Repair

Every LLM output is checked.

### Validators

* JSON Schema validation
* Cross-field invariants
* Allow-list and membership checks

### Repair

When validation fails:

1. LRE generates a **repair packet** describing exactly what is wrong
2. The model is re-invoked with a minimal “fix-only” prompt
3. Only the broken fields are corrected

This makes retries cheap and reliable, even with small models.

---

## Model Strategy

LRE is **model-agnostic**.

### Model Classes

* `SMALL_EXEC` – default (cheap, fast)
* `MEDIUM_PLAN` – ambiguity or planning
* `LARGE_JUDGE` – rare adjudication

Escalation is:

* deterministic
* rule-based
* minimal

Most workflows run entirely on small models.

---

## What Makes LRE Different

| Traditional AI Workflows | LRE                    |
| ------------------------ | ---------------------- |
| One big prompt           | Many small typed steps |
| Model holds state        | Runtime holds state    |
| Hope-based retries       | Deterministic repair   |
| Expensive by default     | Cheap by design        |
| Hard to debug            | Fully inspectable      |

LRE is closer to a **runtime system** than an AI tool.

---

## Who Is LRE For?

* Developers building agent platforms
* Teams orchestrating tools + models
* Anyone who wants reliable automation without paying for giant models
* Open-source contributors interested in agent runtimes and compilers

You do **not** need to be a prompt expert to use LRE.

---

## Project Goals

* Make small models reliable
* Make workflows deterministic
* Make failures debuggable
* Make costs predictable
* Make agent systems composable

---

## Status

LRE is under active development.

The initial focus is:

* core runtime semantics
* JSON-based IR
* validation and repair
* small-model-first execution

---

## Philosophy

> **LLMs are not agents. Programs are agents.**

LRE provides the missing runtime that turns language models into dependable execution engines.

---

## License

Open source. Designed for collaboration, extensibility, and experimentation.

---

If you’re interested in contributing, experimenting, or building on top of LRE, you’re in the right place.
