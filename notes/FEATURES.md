# Feature Idea List

## Visual Workflow
- [ ] Launch with and coding agent (Claude, Codex, OpenCode, Github Copilot)
  - [ ] Configure with your local agent, import skills and mcps
- [ ] Progress workflow markers
  - [ ] Green lines indicating flows that were successful
  - [ ] Red lines indicating failures (give human readable error report and remediation)
  - [ ] Border around tasks in progress
  - [ ] Full logging of each step (under debug mode)

## Lattice Runtime Environment (LRE)
- [ ] Custom runtime setup capable of orchestrating LLMs of any size to run effectively and consistently
- [ ] Lattice Intermediate Representation (IR) made to translate between the visual blocks and the LLM prompts
- [ ] Delegate LLM calls to model for max performance, consider speed, creativity, etc
  - [ ] Handle model selection, create multi-model system if applicable
  - [ ] Analyze workflow to determine model layout plan
  - [ ] Keep models "warm" without bloating memory
- [ ] Inject only dependent parts of the LLM prompts
  - [ ] Agents with different models share context, context is as large as necessary

# LatticeBox
- [ ] Run Lattice on Mini PC with pre-loaded models and run like ClawdBot
# MicroLattice
- [ ] Run Lattice on Raspberry Pi with ultra lightweight models (LFM2.5-1.2B)
- [ ] Specialize microcontrollers with optimized models 


# MVP

Need at least these for an MVP

- [ ] Basic compiler/runtime environment
- [ ] Launch Codex from UI
- [ ] Export to claude, codex, opencode, etc
- [ ] Easy login for Codex, MCPs, other accounts
- [ ] Highly reliable, start with current models