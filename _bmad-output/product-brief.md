---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - docs/repo-audit-2026-04-08.md
  - docs/research/2026-04-05/sangam-peer-orchestra-research-summary.md
  - README.md
date: 2026-04-08
author: Varunmoka
---

# Product Brief: peer-orchestra

## Executive Summary

**Peer Orchestra** is an open-source npx tool that turns Claude Code terminals into a coordinated AI engineering team. It scaffolds themed agent personas, structured dispatch protocols, team collaboration patterns, and self-learning hooks into any project — giving developers a multi-agent orchestration engine out of the box.

One command (`npx peer-orchestra init`) runs an interactive wizard that installs everything: agent rules, communication protocols, memory hooks, and optional BMAD workflow integration. Users pick a theme (Genshin Impact characters, generic role names, or custom), name their orchestrator, and start dispatching tasks to specialized agents that learn and improve across sessions.

**Tagline:** "Your real AI team."

**License:** MIT. Free and open source, forever.

---

## Core Vision

### Problem Statement

Claude Code is powerful as a single agent, but real engineering work requires coordination across domains — backend, frontend, QA, data, infrastructure, research. Today, developers who want multi-agent workflows must manually open multiple terminals, write persona instructions from scratch, remember what each terminal is doing, and lose all context between sessions. There is no standard engine for giving Claude Code a team.

### Problem Impact

- **Wasted coordination overhead:** Developers spend more time managing agents than doing actual work — context-switching between terminals, repeating instructions, manually routing tasks.
- **No persistent learning:** Each session starts from zero. Corrections, preferences, and domain specializations are lost when the terminal closes.
- **No structure for collaboration:** Without dispatch protocols or team patterns, multi-agent work devolves into ad-hoc messaging with inconsistent results.
- **High barrier to entry:** Setting up a multi-agent system requires deep Claude Code knowledge (hooks, rules, MCP servers, settings.json). Most developers never attempt it.

### Why Existing Solutions Fall Short

| Approach | Limitation |
|----------|-----------|
| **Raw claude-peers MCP** | Communication only — no personas, dispatch protocol, learning, or team patterns |
| **Custom CLAUDE.md rules** | One-off, not portable, not shareable, no themes |
| **Claude Code plugins** | Limited distribution model, not npx-friendly, no interactive setup |
| **Other AI agent frameworks** (CrewAI, AutoGen, etc.) | Different runtime — not Claude Code native, can't leverage claude-peers or Claude's tool system |

No existing tool combines personality + persistent memory + structured dispatch + theme extensibility in a Claude Code-native package.

### Proposed Solution

An npx scaffolding tool that installs a complete multi-agent orchestration framework into any Claude Code project:

1. **`npx peer-orchestra init`** — interactive wizard asks for orchestrator name, theme choice, and optional BMAD integration
2. **Themed agent personas** — 12 specialized agents (orchestrator + 11 domain experts) installed as `.claude/rules/` files
3. **Structured dispatch protocol** — message templates, priority levels, team patterns, retry limits, escalation rules
4. **Self-learning hooks** — agents save lessons from corrections, recall context at session start, extract patterns automatically
5. **Optional BMAD layer** — epic -> story -> implement -> verify workflow discipline for agents that code

Users bring their own agents (open additional Claude Code terminals). Peer Orchestra provides the engine, rules, and starter themes — not a locked-in framework.

### Key Differentiators

1. **Personality-first agents** — themed character packs (Genshin, Generic, future: Naruto, Marvel, DC, custom) that make agents memorable and consistent, not just role labels
2. **Persistent cross-session learning** — agents remember corrections, build domain specializations, and improve over time via hooks and SQLite-backed memory
3. **Structured dispatch protocol** — not ad-hoc chat; typed message formats (dispatch, followup, relay, correction) with priority levels and retry limits
4. **Theme extensibility** — interactive wizard at install, community-contributed theme packs, separation of personality from capability
5. **Zero lock-in** — scaffolds files into your project's `.claude/` directory; you own everything, can customize anything, no runtime dependency
6. **BMAD workflow integration** — optional layer that gives agents structured coding discipline (the only multi-agent tool that also gives you an engineering methodology)
7. **Claude Code-native** — built for claude-peers MCP, not a separate runtime; agents use Claude's actual tool system

---

## Target Users

### Primary Users

#### Persona 1: The Vibe Coder — "Alex"

**Context:** Alex is a technical founder / indie developer who uses Claude Code daily for building their startup. They're strong on product vision and AI tooling but don't write production code line-by-line — they direct Claude Code to build features, fix bugs, and manage complexity. They've discovered that one Claude Code terminal isn't enough for complex projects.

**Problem Experience:** Alex currently opens 3-5 terminals, manually tells each one what to do, forgets what terminal 3 was working on, and loses all context when sessions end. They've tried writing custom CLAUDE.md rules for multi-agent work but it took days and isn't portable to their next project.

**Success Vision:** `npx peer-orchestra init`, pick a theme, and immediately have a coordinated team where agents know their roles, talk to each other, remember past corrections, and follow structured dispatch protocols. Alex directs the orchestrator; the orchestrator handles the rest.

**"Aha!" Moment:** When an agent remembers a correction from yesterday's session and applies it automatically.

#### Persona 2: The Power User — "Jordan"

**Context:** Jordan is a senior engineer who's been using Claude Code for months. They've built their own hooks, written custom rules, and experimented with claude-peers. They understand the internals but are tired of reinventing the orchestration wheel for every project.

**Problem Experience:** Jordan has a working multi-agent setup in one repo, but it's bespoke — hardcoded to their project's domain, not portable, and took weeks to refine. Starting a new project means copying files, rewriting personas, and debugging hook paths again.

**Success Vision:** A standardized engine they can install in any project, customize the theme and agents, and have a production-quality orchestration framework in minutes instead of weeks. They want to contribute themes back to the community.

**"Aha!" Moment:** When they `npx peer-orchestra init` in a brand new repo and have a full team operational in under 2 minutes.

#### Persona 3: The Curious Newcomer — "Sam"

**Context:** Sam started using Claude Code recently. They've heard about multi-agent setups on Twitter/Discord but don't know where to start. Hooks, MCP servers, and settings.json are intimidating. They just want agents that work together.

**Problem Experience:** Sam doesn't have a problem with their current setup — they don't know what's possible. They see power users running coordinated agent teams and want that capability without the learning curve.

**Success Vision:** A single npx command with an interactive wizard that asks simple questions and sets everything up. Themed agents with personality make the experience fun and approachable rather than intimidating.

**"Aha!" Moment:** When they dispatch their first task to an agent and it responds in character, completes the work, and saves what it learned.

### Secondary Users

#### Theme Creators

Community contributors who create and share agent theme packs (Naruto, Marvel, DC, custom). They don't use Peer Orchestra for orchestration — they use it as a creative platform for mapping fictional characters to engineering roles. Their contributions drive adoption and engagement.

#### BMAD Users

Developers who already use the BMAD Method for structured coding workflow. Peer Orchestra's optional BMAD layer gives their agents the same epic -> story -> implement -> verify discipline. They adopt Peer Orchestra specifically for the BMAD integration.

### User Journey

1. **Discovery:** Developer sees a demo on Twitter/GitHub showing a coordinated agent team with themed personalities dispatching tasks and learning across sessions. "I want that."
2. **Onboarding:** `npx peer-orchestra init` -> interactive wizard (30 seconds). Pick a theme, name the orchestrator, optionally enable BMAD. Done.
3. **First Session:** Open 2-3 terminals in the same project. The orchestrator identifies itself, lists available agents, and waits for a task. User says "build X" — orchestrator dispatches to the right agents.
4. **Success Moment:** An agent completes a task, saves what it learned, and the next session it applies that learning without being told. The team gets better over time.
5. **Long-term:** Peer Orchestra becomes the default first step in every new project. User customizes agents, contributes themes, and recommends it to their team.

---

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Time to first dispatch** | < 5 minutes from `npx peer-orchestra init` | CLI telemetry (opt-in) or user reports |
| **Init completion rate** | > 90% of users who run init complete the wizard | Error logs, GitHub issues |
| **Cross-session learning activation** | > 50% of active users see agent memory recall by session 3 | Presence of lessons.md / agent-memory files in installed projects |
| **Multi-agent adoption** | Users regularly run 3+ terminals with distinct agents | Community surveys, Discord feedback |
| **Theme satisfaction** | Users customize or create at least 1 custom agent persona | GitHub theme contributions, forks |

### Business Objectives

Since Peer Orchestra is MIT-licensed and free forever, "business" objectives are community and ecosystem growth:

| Objective | 3-Month Target | 12-Month Target |
|-----------|---------------|-----------------|
| **GitHub stars** | 500 | 5,000 |
| **Monthly npm installs** | 1,000 | 10,000 |
| **Community themes** | 2 additional themes (beyond Genshin + Generic) | 10+ themes from community contributors |
| **Active contributors** | 5 contributors with merged PRs | 25+ contributors |
| **Ecosystem recognition** | Mentioned in Claude Code community discussions | Listed in Claude Code ecosystem / awesome lists |

### Key Performance Indicators

| KPI | Definition | Leading Indicator |
|-----|-----------|-------------------|
| **Weekly Active Installs (WAI)** | Unique `npx peer-orchestra init` runs per week | npm download count |
| **Retention Signal** | Users who run init in 2+ distinct projects | Repeat npm downloads from same IP range (anonymized) |
| **Community Health** | Ratio of issues opened vs closed within 7 days | Issue response time, PR merge velocity |
| **Theme Ecosystem Growth** | Number of theme packs available (official + community) | Theme PRs opened, fork count |
| **Documentation Reach** | README views + docs page visits | GitHub traffic analytics |

**North Star Metric:** Weekly Active Installs (WAI) — the single number that tells us if developers are finding and adopting Peer Orchestra for new projects.

---

## MVP Scope

### Core Features (v0.1.0 — Public Release)

**1. Interactive Init Wizard**
- `npx peer-orchestra init` with theme selection (Genshin, Generic)
- Orchestrator naming
- Optional BMAD integration toggle
- Scaffolds all files into `.claude/` directory
- Non-interactive mode for CI: `npx peer-orchestra init --theme genshin --name Paimon --no-interactive`

**2. Agent Persona Framework**
- 12 themed agent personas per theme (orchestrator + 11 domain experts)
- Consistent format: Identity, Role, Personality, Abilities, Domain Rules, Self-Learning
- Two built-in themes: Genshin Impact, Generic (role-names only)
- Theme parity: Generic orchestrator must match Genshin orchestrator's depth (session modes, quality gates, synthesis protocol)

**3. Structured Dispatch Protocol**
- Message type templates: dispatch, followup, relay, correction
- Priority levels (P0-blocking, P1-normal, P2-when-idle)
- Team patterns: TDD Loop, Build+Validate, Research+Docs, Implement+Review
- Retry limits and escalation rules

**4. Self-Learning Hooks**
- Agent persona loader (SessionStart) — resolves agent identity from env or file
- Agent router (UserPromptSubmit) — keyword-based prompt routing to suggested agents
- Session memory recall (SessionStart) — loads past lessons filtered by agent
- Session learning extractor (SessionEnd + PreCompact) — extracts corrections, quality gates, pushback from transcripts into SQLite

**5. Communication Layer**
- claude-peers MCP as required dependency (documented prerequisite)
- Dispatch commands: `/dispatch`, `/orchestra-status`, `/party`, `/archon-council`

**6. Documentation**
- README rewritten for npx model (not plugin)
- Quick start guide (< 2 minutes to first dispatch)
- Theme creation guide for contributors
- Agent customization guide

### Out of Scope for MVP

| Feature | Reason | Target Version |
|---------|--------|---------------|
| **Bundled MCP server** | claude-peers dependency is acceptable for v1; zero-config messaging is v2 | v0.3.0 |
| **Auto multi-terminal launch** | Requires OS-level terminal automation; complex, fragile | v0.5.0+ |
| **Theme marketplace** | Needs registry infrastructure; community must exist first | v1.0.0 |
| **Smart routing with confidence scores** | Keyword routing is sufficient for launch; ML routing is P2 | v0.3.0 |
| **Event-driven inter-agent communication** | Durable queue semantics require significant infrastructure | v0.3.0 |
| **Growth-to-rule promotion CLI** | Useful but not launch-blocking; manual promotion works | v0.2.0 |
| **Agent status dashboard** | `/orchestra-status` command covers basic needs | v0.2.0 |
| **Additional themes (Naruto, Marvel, DC)** | Community contribution opportunity, not core team work | v0.2.0+ |
| **Observability dashboard** | Nice-to-have; activity timeline and ownership map | v1.0.0 |
| **Uninstall command** | Low priority; users can delete `.claude/` files manually | v0.2.0 |

### MVP Success Criteria

| Criterion | Gate | Evidence |
|-----------|------|----------|
| **Init works end-to-end** | `npx peer-orchestra init` completes in < 30 seconds on fresh project | Scaffold test passes for both themes |
| **Agents identify correctly** | Each agent loads its persona and sets summary on session start | Manual test: open 3 terminals, verify distinct personas |
| **Dispatch protocol works** | Orchestrator can dispatch a task and receive results | Manual test: dispatch a coding task, agent completes and reports back |
| **Learning persists** | Correction in session N appears in session N+1 recall | Manual test: correct an agent, restart session, verify recall |
| **No GCT leaks** | Zero GCT-specific references in installed files | Scaffold test leak detection (already exists) |
| **README clarity** | New user can go from zero to first dispatch in < 5 minutes | User testing with 3 external developers |

### Future Vision

**v0.2.0 — Visibility & Polish**
- Agent status dashboard (memory count, domains, last active)
- Growth-to-rule promotion CLI
- Uninstall command
- Generic theme parity with Genshin depth
- Community theme contributions begin

**v0.3.0 — Intelligence**
- Smart routing with confidence scores (capability-aware dispatch)
- Event-driven inter-agent communication (durable queue in SQLite)
- Bundled MCP server option (zero-config alternative to claude-peers)
- Memory recall relevance improvements (context-aware filtering)

**v0.5.0 — Automation**
- Auto multi-terminal launch (OS-aware terminal spawning)
- Cross-project agent memory (global agent profiles)
- Agent performance analytics

**v1.0.0 — Ecosystem**
- Theme marketplace (publish/install from npm or GitHub)
- Observability dashboard (activity timeline, dispatch history, growth trends)
- Enterprise features (team-wide agent configurations, shared memory pools)
- Plugin ecosystem for custom hook authors

**Long-term North Star:** Peer Orchestra becomes the default way developers set up multi-agent workflows in Claude Code — the way create-react-app became the default for React projects.
