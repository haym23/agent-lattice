# Lattice Runtime Notes

Topics to consider:

- Complexity scoring - how to determine what model a block needs
  - Reasoning depth - does the block require multi-step inference?
  - Context dependencies - how many upstream blocks feed into this one?
  - Domain specificity - does it require specialized knowledge?
  - User override - Explicit flags for "high reasoning"