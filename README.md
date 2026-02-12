# Agent Lattice

[![](https://img.shields.io/github/stars/haym23/agent-lattice)](https://github.com/haym23/agent-lattice/stargazers)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js: >=20](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript: 5.x](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm: 9.0.0](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![](https://github.com/haym23/agent-lattice/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/haym23/agent-lattice/actions/workflows/ci.yaml)
[![](https://codecov.io/gh/haym23/agent-lattice/branch/main/graph/badge.svg)](https://codecov.io/gh/haym23/agent-lattice)
[![](https://snyk.io/test/github/haym23/agent-lattice/badge.svg)](https://snyk.io/test/github/haym23/agent-lattice)
[![Ask: DeepWiki](https://img.shields.io/badge/Ask-DeepWiki-009485)](https://deepwiki.com/haym23/agent-lattice)

## Overview

### **Goal:**

To simplify the way we create and interact with LLM models, giving us the ability to make ultra high fidelity agents.

### **Problem Statement:**

Users are not perfect in their instructions, and LLMs pay the price. They misuse words, give conflicting tasks, and don't utilize proper spelling and grammar. They don't properly convey what is important, and what their idea of "acceptable" looks like. This results in LLMs wasting time and context trying to figure out what they mean. Every person in their own head knows what they're talking about, but sometimes there are parts that get lost in translation between your brain and what you give the LLM.

### **Solution:**

Standardize interactions taking place with LLM agents by giving users drag and drop boxes to wire together. Blocks take in parameterized input, then get converted to intermediate processing types, and eventually outputted as a structured LLM prompt.

Each block is built on a node. A node is the smallest unit of data accessible to the user at runtime, before it begins its transformation into a prompt. The runtime wires nodes together, and injects a section to the prompt outlining to the LLM the flow between nodes. This allows the LLM to easily jump around the context and execute tasks.

This gives a way to make the information exchange between humans and LLMs consistent. Easier interface leads to a better definition of *intent*. Well defined intent leads to better results. This increased fidelity of agents means you can build any kind of personal assistant. While LLM interfaces like ChatGPT are limited to a chat interface, this would allow integrations with all of your tools. 

Whether its learning a new hobby or becoming a rockstar at work, your solution is just a few building blocks away.

---

## Notes

### Use Cases

- Developer: Well structured workflows could replace APIs. Run cheap models with lots of validation and coverage and you have replaced the need for a backend API
- Busy Mom: Organize dinner plans between family. Send a text in the morning, family deliberates, short summary and shopping list is ready for when mom goes to grocery store after work.
- Young Professional: A busy employee takes a call while driving to meet a customer. The entire meeting is summarized and waiting in his notes by the time he is back to the office.
- Developer: Come in Monday morning, have a flow to summarize Jira tasks for the sprint and give suggested solution. Using a series of templates and AI tools, you make workflows for each task in just a few hours. Once workflows are approved they can be run and you can have PRs ready by the time you're back from lunch
- Fantasy Diehard: You love fantasy football, but live a busy life and don't have time to check all the news. Automatically get NFL news from RSS feeds, then place waiver claims through Sleeper API. You also get automated trade ideas based on team and player news.

### Good MCPs

- **Google Maps, Gmail, Calendar, etc:** Connect to any Google app
- **Slack:** Parse messages
- **Notion:** Note taking, to do lists, planning
- **Github:** Interacting with code repos
- **Reddit:** Search through Reddit quickly for ideas
- **Context7:** Code formatting and standards
- **Playwright:** Web tools, browsing, crawling
- Future:
  - **Blender:** 3D graphic rendering
  - **Sleeper:** Fantasy football
- Still need:
  - Meeting summarizer
  - Slide show maker
  - ResumeTitan
  - Voice generation
  - Video generation
  - Photo generation
  - Good web scraper/crawler

---

## Resources
- [Vercel AI SDK](https://ai-sdk.dev/)
  - For streaming LLM events as they happen
  - Used in workflow tracking and debugging
- [CC Workflow Studio](https://breaking-brake.com/)
  - Inspiration behind block-based prompt building
  - Forked repo to begin Agent Lattice

---

## Stack
- Typescript
- UI: Vite React
- Linter: Biome
- Package Manager: pnpm

## Inspirations

- [n8n](https://n8n.io/): Visual workflow building
- [Scratch](https://scratch.mit.edu/): Block semantics
- [LangChain/LangGraph](https://www.langchain.com/langgraph): LLM primitives and linking
- [Temporal](https://temporal.io/): Workflow tracking and state resiliance
- [CrewAi](https://www.crewai.com/open-source): Multi-agent orchestration framework

---
---
---
