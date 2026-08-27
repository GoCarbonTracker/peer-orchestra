---
stepsCompleted: [1, 2, 2b, 2c, 3, 4, 5, 6, 7, 8, 9, 10, 11, step-11-complete]
status: complete
classification:
  projectType: cli_tool + developer_tool
  domain: developer-tooling-ai-orchestration
  complexity: medium
  projectContext: brownfield
inputDocuments:
  - _bmad-output/product-brief.md
  - docs/repo-audit-2026-04-08.md
  - docs/research/2026-04-05/sangam-peer-orchestra-research-summary.md
  - README.md
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 2
  brainstorming: 0
  projectDocs: 1
date: 2026-04-08
author: Varunmoka
---

# Product Requirements Document - peer-orchestra

**Author:** Varunmoka
**Date:** 2026-04-08

## Executive Summary

Peer Orchestra is an open-source npx tool that transforms Claude Code terminals into a coordinated AI engineering team. A single command (`npx peer-orchestra init`) runs an interactive wizard that scaffolds themed agent personas, structured dispatch protocols, team collaboration patterns, and self-learning hooks into any project's `.claude/` directory. Users pick a theme (Genshin Impact characters, generic role names, or custom), name their orchestrator, and immediately have a team of 12 specialized agents that communicate via claude-peers, follow structured dispatch protocols, and improve across sessions.

The tool targets three user segments: vibe coders who direct AI but don't write code line-by-line, power users tired of rebuilding bespoke multi-agent setups per project, and newcomers who want coordinated agents without understanding hooks/MCP/settings.json. The core value loop is: install in 30 seconds, dispatch first task in under 5 minutes, and by session 3 experience agents that remember and apply past corrections automatically.

This is a brownfield project — a functional codebase (68 files) exists with 16 agent personas, an init wizard, hooks, commands, and a scaffold test. The primary work is pivoting from Claude Code plugin distribution to standalone npx, achieving theme parity between Genshin and Generic, replacing placeholder hooks with real implementations, and shipping BMAD workflow integration.

### What Makes This Special

1. **Orchestrator design as IP** — the dispatch protocol (typed messages, priority levels, retry limits, escalation rules), quality gates, synthesis protocol, context budget management, and team patterns (TDD Loop, Build+Validate, Research+Docs, Implement+Review) are the real intellectual property. This is an orchestration engine, not just a persona installer.
2. **Persistent cross-session learning** — agents save corrections, domain specializations, and quality gate outcomes to SQLite. Session N+1 recalls session N's lessons filtered by agent identity. Agents genuinely improve the more you use them.
3. **BMAD workflow integration** — optional but native. Gives agents structured coding discipline: epic -> story -> implement -> verify. The only multi-agent tool that also provides an engineering methodology.
4. **Zero lock-in** — scaffolds files into `.claude/`; users own everything, can customize anything, no runtime dependency. MIT licensed, free forever.

## Project Classification

| Dimension | Value |
|-----------|-------|
| **Project Type** | CLI tool + developer framework (npx scaffolding tool) |
| **Domain** | Developer tooling — AI agent orchestration |
| **Complexity** | Medium — no regulated industry, but novel design space with no established patterns |
| **Project Context** | Brownfield — functional codebase exists, pivoting distribution model from plugin to npx |
| **Distribution** | npm registry via `npx peer-orchestra init` |
| **License** | MIT, open source |

## Success Criteria

### User Success

| Criterion | Metric | Target |
|-----------|--------|--------|
| **Time to first dispatch** | Minutes from `npx peer-orchestra init` to first structured task dispatched | < 5 minutes |
| **Init completion rate** | Users who run init and complete the wizard without errors | > 90% |
| **Cross-session learning** | Users who observe agent memory recall by session 3 | > 50% of active users |
| **Multi-agent adoption** | Users regularly running 3+ terminals with distinct agents | Measurable via community surveys |
| **Theme engagement** | Users who customize or create at least 1 custom persona | Tracked via GitHub theme contributions |
| **README clarity** | New user goes from zero to first dispatch | < 2 minutes reading time |

**User "aha!" moments:**
1. An agent remembers a correction from yesterday and applies it automatically
2. The orchestrator dispatches to the right agent without being told which one to use
3. Two agents collaborate on a task (TDD loop, build+validate) without manual coordination

### Business Success

Since Peer Orchestra is MIT-licensed and free forever, "business" objectives are community and ecosystem growth:

| Objective | 3-Month Target | 12-Month Target |
|-----------|---------------|-----------------|
| GitHub stars | 500 | 5,000 |
| Monthly npm installs | 1,000 | 10,000 |
| Community themes | 2 additional (beyond Genshin + Generic) | 10+ from community |
| Active contributors | 5 with merged PRs | 25+ |
| Ecosystem recognition | Mentioned in Claude Code community | Listed in ecosystem/awesome lists |

**North Star Metric:** Weekly Active Installs (WAI) — unique `npx peer-orchestra init` runs per week.

### Technical Success

| Criterion | Target |
|-----------|--------|
| Init completes on fresh project | < 30 seconds, zero errors |
| All hooks functional | No placeholders, no no-ops |
| Memory pipeline end-to-end | Extract corrections -> SQLite -> recall at session start |
| Scaffold test passes | Both Genshin and Generic themes |
| GCT leak detection | Zero GCT-specific references in installed files |
| npm test passes | All tests green before publish |
| Node.js compatibility | >= 18.0.0 |

### Measurable Outcomes

| Signal | Measurement Method |
|--------|-------------------|
| Retention | Users who run init in 2+ distinct projects (repeat npm downloads) |
| Community health | Issues opened vs closed within 7 days |
| Theme ecosystem | Theme packs available (official + community) |
| Documentation reach | README views + docs page visits (GitHub analytics) |

## Product Scope

### MVP — v0.1.0 Public Release

**v1 Definition of Done** (all must pass before npm publish):

1. **`npx peer-orchestra init` works cleanly** — interactive wizard completes on fresh project in < 30 seconds, non-interactive mode works for CI (`--theme genshin --name Paimon --no-interactive`)
2. **No "plugin" references** — zero references to `.claude-plugin/`, `plugin.json`, `${CLAUDE_PLUGIN_ROOT}`, or "Claude Code plugin" in any installed file
3. **README < 2 min to first dispatch** — rewritten for npx model, clear quick-start path
4. **All hooks work (no placeholders):**
   - `agent-persona-loader.py` — resolves agent identity from env or file (DONE)
   - `agent-router.py` — keyword-based prompt routing (DONE)
   - `session-start-peer-memory.py` — recalls past lessons filtered by agent (DONE)
   - `session-end-peer-memory.py` — saves session learnings (CURRENTLY PLACEHOLDER — must implement)
   - `session-learning-extractor.py` — parses transcripts, extracts corrections/quality gates/pushback, saves to SQLite (EXISTS in templates, must be wired into scripts/)
5. **Memory pipeline end-to-end:** Extract corrections from transcripts -> store in per-agent SQLite -> recall at session start. Full loop must work, not just individual hooks.
6. **2 themes at parity** — Genshin and Generic orchestrators both have: session modes, quality gates, synthesis protocol, retry limits, context budget, pushback handling, team dispatch checklist, dispatch sizing
7. **npm test passes** — scaffold test for both themes, leak detection, hook presence verification
8. **No GCT leaks** — zero GoCarbonTracker-specific references in any scaffolded file
9. **Published to npm** — `npm publish` successful, `npx peer-orchestra init` works globally

**Core MVP Features:**

| Feature | Status | Work Needed |
|---------|--------|------------|
| Interactive init wizard | DONE | Add `--no-interactive`, `--dry-run`, version command |
| 12 Genshin agent personas | DONE | Minor polish |
| 12 Generic agent personas | DONE | Orchestrator needs parity with Genshin (currently 28 vs 135 lines) |
| Structured dispatch protocol | DONE | Already in rule templates |
| Team patterns (TDD, Build+Validate, etc.) | DONE | Already in team-dispatch.md template |
| 4 commands (/dispatch, /orchestra-status, /party, /archon-council) | DONE | Convert from plugin commands to skill/rule format |
| Agent persona loader hook | DONE | Already functional |
| Agent router hook | DONE | Already functional |
| Session start memory recall | DONE | Already functional |
| Session end memory save | PLACEHOLDER | Must implement (currently `pass`) |
| Session learning extractor | DONE (in templates) | Must wire into scripts/, add to hooks.json |
| BMAD integration | PARTIAL | Template directory missing (`src/templates/bmad/`), must create |
| Lore-grounded theme pipeline | NOT STARTED | Wiki scrape -> KB -> agent.md generation. v1: manual for Genshin/Generic |
| Scaffold test (Genshin) | DONE | Already passing |
| Scaffold test (Generic) | NOT STARTED | Must add |
| Plugin artifact removal | NOT STARTED | Remove `.claude-plugin/`, rewrite README, clean hooks.json |

### Growth Features — v0.2.0

| Feature | Description |
|---------|-------------|
| Agent status dashboard | Memory count, domains, last active per agent |
| Growth-to-rule promotion | Frequently repeated learnings auto-promote to permanent rules |
| Uninstall command | `npx peer-orchestra uninstall` to clean up `.claude/` files |
| Additional themes | Community theme contribution pipeline + 2 new themes |
| Generic theme depth | Match Genshin-level personality richness with professional personas |

### Growth Features — v0.3.0

| Feature | Description |
|---------|-------------|
| Smart routing with confidence | Capability-aware dispatch based on agent growth/file-touch data |
| Event-driven inter-agent communication | Durable queue in SQLite (`task_assigned`, `task_completed`, `blocker_found`, `review_requested`) |
| Bundled MCP server option | Zero-config alternative to claude-peers dependency |
| Memory recall relevance | Context-aware filtering beyond naive recent-N |
| Per-agent trust levels | Orchestrator tracks which agents user relies on vs double-checks |

### Vision — v0.5.0+

| Feature | Target |
|---------|--------|
| Auto multi-terminal launch | OS-aware terminal spawning |
| Proactive dispatch | Orchestrator routes tasks without being told which agent |
| Orchestrator-user relationship evolution | Week 1: asks questions -> Month 1: knows patterns -> Month 3: acts like an engineering manager |
| Theme marketplace | Publish/install from npm or GitHub |
| Cross-project agent memory | Global agent profiles that span repos |
| Open-source lore pipeline | Wiki scrape -> character KB -> agent.md generation, shipped as CLI tool |
| Observability dashboard | Activity timeline, dispatch history, growth trends |
| Enterprise features | Team-wide agent configs, shared memory pools |

**Long-term North Star:** Peer Orchestra becomes the default way developers set up multi-agent workflows in Claude Code — the way create-react-app became the default for React projects.

## User Journeys

### Journey 1: Alex the Vibe Coder — First Install

**Opening Scene:** Alex is a technical founder building a SaaS product with Claude Code. They currently have 4 terminals open — one for the API, one for the dashboard, one for tests, one general. They're constantly context-switching, repeating instructions, and forgetting which terminal was doing what. They just saw a demo on Twitter showing a coordinated agent team and want that.

**Rising Action:** Alex runs `npx peer-orchestra init` in their project directory. The wizard asks three questions: orchestrator name ("Paimon"), theme (Genshin), and BMAD integration (yes). In 20 seconds, the wizard scaffolds 12 agent files, hooks, dispatch rules, and team patterns into `.claude/`. Alex opens 3 terminals. The first one auto-identifies as the orchestrator and lists available agents. Alex says: "Build a user auth system with tests."

**Climax:** The orchestrator dispatches structured tasks to three agents — Zhongli designs the API, Xiao writes tests, Kaveh builds the login UI. Alex watches agents coordinate via messages, complete their work, and report back with file paths and test results. The orchestrator synthesizes results and presents a summary. Alex didn't have to manage any of it.

**Resolution:** Alex's auth system is built, tested, and integrated. They correct Xiao's test naming convention. The next day, Alex starts a new session — Xiao remembers the correction and applies it automatically. Alex realizes their team gets better over time.

### Journey 2: Jordan the Power User — Migration from Bespoke Setup

**Opening Scene:** Jordan is a senior engineer with a working multi-agent setup they built over weeks in one repo. Custom CLAUDE.md rules, handwritten persona files, ad-hoc hooks. It works, but it's not portable — starting a new project means copying files, rewriting personas, and debugging hook paths for days.

**Rising Action:** Jordan runs `npx peer-orchestra init --theme generic --name Commander` in a new repo. The Generic theme installs professional role-based agents (Backend Engineer, QA Engineer, DevOps, etc.) with the same dispatch protocol, quality gates, and team patterns they had in their custom setup. Jordan compares the installed dispatch rules with their bespoke version — the structured protocol is more comprehensive (retry limits, escalation rules, context budget management).

**Climax:** Jordan opens a PR with a complex refactor. They dispatch to three agents — the Backend Engineer implements, the QA Engineer validates, and the Auditor reviews for security. The TDD Loop team pattern kicks in: Backend writes, QA tests, they iterate three rounds until green. Jordan realizes this took 10 minutes to set up instead of 2 weeks.

**Resolution:** Jordan contributes a "DevSecOps" theme back to the community — mapping security operations characters to the agent framework. They become a regular contributor and help shape the dispatch protocol for v0.3.0.

### Journey 3: Sam the Newcomer — Discovering Multi-Agent

**Opening Scene:** Sam started using Claude Code last month. They've seen power users on Discord talking about "dispatching to agents" and "peer networks" but have no idea where to start. Hooks, MCP servers, and settings.json feel intimidating.

**Rising Action:** Sam finds the Peer Orchestra README on GitHub. The quick start says: prerequisites (Claude Code + claude-peers), then `npx peer-orchestra init`. Sam picks the Genshin theme because the character names look fun. The wizard handles everything — agent files, hooks, settings.json, memory directory. Sam doesn't need to understand any of the internals.

**Climax:** Sam opens two terminals. Terminal 1 identifies as the orchestrator. Terminal 2 is free. Sam types "Fix the login bug in src/auth.ts" — the orchestrator dispatches to a QA agent with a structured task message. The agent finds the bug, fixes it, runs tests, and reports back. Sam sees a structured dispatch message for the first time and thinks: "So that's what dispatch protocol means."

**Resolution:** By week 2, Sam is running 4 terminals. Agents remember Sam's preferences — error message style, test naming conventions, commit message format. Sam tells a friend: "It's like having a junior team that learns your style."

### Journey 4: Theme Creator — Building a Naruto Pack

**Opening Scene:** A community member loves Peer Orchestra but wants Naruto characters instead of Genshin. They find the theme creation guide in the docs.

**Rising Action:** They create `themes/naruto/agents/` with 12 agent files: Shikamaru as orchestrator (strategic, lazy-brilliant), Kakashi for security (Copy Ninja pattern recognition), Sakura for QA (precise, healing/fixing), Naruto for frontend (bold, flashy UI), Sasuke for backend (efficient, dark mode default). Each file follows the standard format: Identity, Role, Personality, Abilities, Domain Rules, Self-Learning.

**Climax:** They use the lore pipeline to scrape Narutopedia, extract character profiles, and ground each persona in real character data — Shikamaru's shadow tactics map to dependency analysis, Kakashi's Sharingan maps to code review pattern matching.

**Resolution:** They submit a PR. The scaffold test catches two GCT-specific references that leaked in. They fix it, tests pass, theme merges. Now `npx peer-orchestra init --theme naruto` works for everyone.

### Journey 5: Error Recovery — Init Fails Mid-Way

**Opening Scene:** A user runs `npx peer-orchestra init` in a project that already has a `.claude/settings.json` with custom hooks. The init wizard detects existing configuration.

**Rising Action:** The wizard reports: "Existing settings.json detected. I'll merge Peer Orchestra hooks alongside your existing configuration." It shows a diff of what will change. The user approves. Mid-way through, a file copy fails because `.claude/rules/` has a read-only file from a previous tool.

**Climax:** The wizard rolls back partial changes, reports the specific error with the file path, and suggests: "Run with `--force` to overwrite, or manually remove the read-only file and retry."

**Resolution:** The user fixes the permission, reruns init, and it completes successfully. Their existing hooks are preserved alongside Peer Orchestra's new hooks.

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| Alex (Vibe Coder) | Init wizard, agent auto-identification, structured dispatch, multi-agent coordination, cross-session memory recall |
| Jordan (Power User) | Non-interactive init, Generic theme parity, team patterns (TDD Loop), community contribution pipeline, theme extensibility |
| Sam (Newcomer) | Zero-config install, README clarity, agent personality engagement, progressive learning, intuitive dispatch protocol |
| Theme Creator | Theme creation guide, lore pipeline, scaffold test with leak detection, PR contribution flow |
| Error Recovery | Settings merge, rollback on failure, `--force` flag, clear error messages, existing config preservation |

## Domain-Specific Requirements

### Platform Constraints (Claude Code Ecosystem)

Peer Orchestra operates within Claude Code's extension ecosystem. These constraints shape every design decision:

| Constraint | Impact |
|-----------|--------|
| **claude-peers MCP required** | Users must install [claude-peers](https://github.com/louislva/claude-peers-mcp) separately. Cannot bundle MCP servers in v1. |
| **No programmatic terminal launch** | Cannot auto-open terminals. Users must manually open each agent terminal. |
| **Hook execution model** | Hooks run as shell commands via `settings.json`. Python hooks must be self-contained (no pip dependencies beyond stdlib + sqlite3). |
| **Agent identity is convention-based** | No runtime API for "which agent am I." Identity resolved via `PEER_AGENT` env var or `.peer-identity` file — fragile, relies on user setting it. |
| **Settings.json merge risk** | `npx peer-orchestra init` must merge into existing `settings.json` without clobbering user's existing hooks/plugins. |
| **No persistent daemon** | Hooks fire per-event, not as a long-running process. Learning extraction must parse JSONL transcripts after the fact, not observe in real-time. |
| **Context window limits** | Agent rule files (`.claude/rules/`) are loaded into context. Large rule files compete with code for context budget. Keep agent personas concise. |

### Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **No secrets in scaffolded files** | Init must never write API keys, tokens, or credentials into any installed file |
| **Hook script safety** | All hook scripts must be readable Python — users must be able to audit what runs in their project |
| **SQLite memory DB permissions** | `.claude/agent-memory/` should be `.gitignore`'d by default to prevent committing agent learnings |
| **Theme content safety** | Community theme submissions must be reviewed for malicious content in agent rule files |

### Integration Requirements

| Integration | Type | Status |
|------------|------|--------|
| **claude-peers MCP** | Required prerequisite | Documented, not bundled |
| **homunculus plugin** | Optional dependency | Configured in generated `settings.json` |
| **BMAD Method** | Optional integration | Template scaffolding for `_bmad/` directory |
| **npm registry** | Distribution channel | `npx peer-orchestra init` |

### Risk Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| claude-peers API changes | Medium | High | Pin compatible version in docs, test against latest in CI |
| Claude Code settings.json format changes | Low | High | Version-detect settings format, graceful fallback |
| Hooks break on Claude Code updates | Medium | Medium | Minimal hook surface area, defensive error handling, stdout-only communication |
| Theme contributions with poor quality | High | Medium | Scaffold test as quality gate, automated leak detection |
| Large agent rule files degrade performance | Low | Medium | Keep persona files < 150 lines, measure context impact |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Orchestrator Intelligence Design (Novel Combination)**

The orchestrator's dispatch protocol combines patterns from engineering management, military command structures, and game party systems into a novel AI coordination framework:
- **Typed message protocol** (dispatch/followup/relay/correction) — not ad-hoc chat
- **Quality gates with retry limits** — max 3 rework attempts, then escalation report
- **Synthesis protocol** — comparison tables across 2+ agent reports, conflict resolution, decision artifacts
- **Context budget management** — switches to file-only handoffs at >50% context consumption
- **Session modes** (Micro/Sprint/Full) — dispatch intensity calibrated to task scope
- **Team patterns** — pre-defined collaboration templates (TDD Loop, Build+Validate, Research+Docs)

No comparable framework combines all of these in one system.

**2. Self-Learning Agent Evolution (AI-Native Growth)**

Agents don't just persist data — they evolve through a structured learning pipeline:
- Corrections extracted from session transcripts via JSONL parsing
- Quality gate outcomes tracked (which agents pass vs fail)
- Pushback patterns captured (when agents correctly challenged bad instructions)
- Lessons stored in per-agent SQLite with agent identity filtering
- Session N+1 recalls session N's learnings automatically

Post-v1 vision extends this to: trust levels, proactive dispatch, growth-to-rule promotion, and orchestrator-user relationship evolution.

### Market Context & Competitive Landscape

| Tool | What It Does | What It Lacks |
|------|-------------|---------------|
| **Raw claude-peers** | Communication between Claude Code terminals | No personas, no dispatch protocol, no learning |
| **Custom CLAUDE.md** | One-off agent instructions | Not portable, not shareable, no themes, no memory |
| **CrewAI** | Multi-agent framework | Different runtime (not Claude Code native), no personality depth |
| **AutoGen** | Multi-agent conversations | Not Claude Code native, no persistent learning |
| **Claude Code plugins** | Extension distribution | Limited model, no interactive setup, no themed orchestration |

No existing tool combines: personality depth + persistent memory + structured dispatch + theme extensibility + Claude Code native.

### Validation Approach

| Innovation | Validation Method | Success Signal |
|-----------|------------------|----------------|
| Lore-grounded personas | User survey: "Do agents feel consistent and unique?" | >70% say personas influence their interaction style |
| Orchestrator intelligence | Measure: dispatch success rate, rework rate, escalation frequency | <15% rework rate after 10 sessions |
| Self-learning evolution | Measure: corrections recalled vs corrections made | >80% recall rate by session 5 |
| Theme extensibility | Community: theme contributions in first 3 months | 2+ community themes submitted |

### Risk Mitigation

| Innovation Risk | Fallback |
|----------------|----------|
| Lore pipeline too complex for v1 | Ship manually-crafted Genshin + Generic themes; pipeline is v0.2.0+ |
| Learning extractor misparses transcripts | Fail gracefully — never corrupt existing memory, log parse failures for debugging |
| Orchestrator protocol too rigid | All protocol rules are in editable .md files — users can customize |
| Theme quality varies wildly | Scaffold test as automated quality gate; reject themes that fail leak detection or format validation |

## CLI & Developer Tool Requirements

### Command Structure

| Command | Syntax | Mode | Description |
|---------|--------|------|-------------|
| `init` | `npx peer-orchestra init [options]` | Interactive + non-interactive | Scaffold multi-agent framework into project |
| `version` | `npx peer-orchestra --version` | Non-interactive | Print version from package.json |

**Init Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--theme <name>` | string | (interactive prompt) | Theme to install: `genshin`, `generic` |
| `--name <name>` | string | (interactive prompt) | Orchestrator persona name |
| `--dir <path>` | string | `.` | Target project directory |
| `--bmad` | boolean | false | Enable BMAD workflow integration |
| `--no-interactive` | boolean | false | Skip interactive prompts (requires `--theme` and `--name`) |
| `--dry-run` | boolean | false | Show what would be installed without writing files |
| `--force` | boolean | false | Overwrite existing files (default: merge/skip) |

**Future Commands (post-MVP):**

| Command | Target Version |
|---------|---------------|
| `npx peer-orchestra uninstall` | v0.2.0 |
| `npx peer-orchestra status` | v0.2.0 |
| `npx peer-orchestra promote` | v0.2.0 |
| `npx peer-orchestra theme-list` | v0.2.0 |

### Installation Method

**Primary:** npm registry via `npx` (zero-install, always latest)
```bash
npx peer-orchestra init
```

**Alternative:** Global install for frequent use
```bash
npm install -g peer-orchestra
peer-orchestra init
```

**Requirements:**
- Node.js >= 18.0.0
- No native dependencies (pure Node.js stdlib)
- No build step required
- Works on macOS, Linux, Windows (WSL)

### Configuration Schema

Init generates `.claude/settings.json` with this structure:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "type": "command", "command": "python3 .claude/hooks/agent-router.py" }
    ],
    "SessionStart": [
      { "type": "command", "command": "python3 .claude/hooks/agent-persona-loader.py" },
      { "type": "command", "command": "python3 .claude/hooks/session-start-peer-memory.py" }
    ],
    "SessionEnd": [
      { "type": "command", "command": "python3 .claude/hooks/session-end-peer-memory.py" }
    ],
    "PreCompact": [
      { "type": "command", "command": "python3 .claude/hooks/session-learning-extractor.py" }
    ]
  },
  "plugins": {
    "homunculus": true
  }
}
```

**Merge behavior:** If `settings.json` already exists, init merges hooks arrays (appending, not replacing) and preserves existing plugin configuration.

### Scaffolded File Structure

After `npx peer-orchestra init --theme genshin --name Paimon`:

```
.claude/
  rules/
    agent-orchestrator.md      # Orchestrator persona (themed)
    agent-nahida.md            # 11 domain agent personas
    agent-zhongli.md
    agent-albedo.md
    agent-furina.md
    agent-kaveh.md
    agent-alhaitham.md
    agent-xiao.md
    agent-yelan.md
    agent-neuvillette.md
    agent-ganyu.md
    agent-lisa.md
    agent-common.md            # Shared rules
    multi-agent-dispatch.md    # Dispatch protocol
    self-improvement.md        # Learning loop
    team-dispatch.md           # Team patterns
  hooks/
    agent-router.py            # Prompt routing
    agent-persona-loader.py    # Identity resolution
    session-start-peer-memory.py  # Memory recall
    session-end-peer-memory.py    # Memory save
    session-learning-extractor.py # Correction extraction
  agent-memory/                # Per-agent SQLite DBs (gitignored)
  settings.json                # Hook configuration
CLAUDE.md                      # Orchestrator instructions (merged)
```

### Documentation Requirements

| Document | Purpose | Max Length |
|----------|---------|-----------|
| README.md | Quick start, team roster, architecture overview | < 250 lines |
| Quick Start section | Zero to first dispatch | < 2 minutes reading |
| Theme Creation Guide | How to create and contribute themes | Separate doc |
| Agent Customization Guide | How to modify agent personas | Separate doc |

### API Surface (for Theme Creators)

**Agent persona file format:**

```markdown
# Agent: {Name} — {Title}

**Identity:** {Name}, {description}. {Personality traits}.
**Domain:** {Domain area} — {specific capabilities}.

## Abilities
- {capability 1}
- {capability 2}

## Domain Rules
- {rule 1}
- {rule 2}

## Self-Learning
- Save corrections to memory on task completion
- Recall past lessons at session start
- Track domain-specific patterns
```

**Required fields:** Identity, Domain, Abilities, Domain Rules, Self-Learning.
**Optional fields:** Personality, Key Files, Verification Commands, Learnings.

### Scripting Support

**Non-interactive mode for CI/automation:**
```bash
npx peer-orchestra init --theme generic --name Commander --no-interactive --dir ./my-project
```

**Exit codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Missing required flags in non-interactive mode |
| 3 | Theme not found |
| 4 | Target directory not writable |

## Scoping Strategy & Risk Analysis

### MVP Philosophy

**Approach:** Problem-solving MVP — the minimum that makes multi-agent orchestration accessible and functional.

**Core Principle:** Ship reliability before intelligence. Sequence: reliability -> visibility -> intelligence -> expansion.

**Resource Requirements:** Solo developer (Varunmoka) + Claude Code agent team. No external team needed for v0.1.0.

**MVP Journeys Supported:** Alex (Vibe Coder), Sam (Newcomer), Error Recovery. Jordan (Power User) and Theme Creator journeys are partially supported but reach full coverage in v0.2.0.

See **Product Scope** section above for the complete v1 Definition of Done, feature status matrix, and phased roadmap.

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|-----------|
| JSONL transcript format changes between Claude Code versions | Defensive parsing with fallback — extract what you can, never crash |
| Hook execution timing unreliable (especially SessionEnd) | Dual save: PreCompact + SessionEnd both trigger learning extraction |
| Settings.json merge corrupts existing config | Read-modify-write with JSON schema validation; `--dry-run` for preview |

**Market Risks:**

| Risk | Mitigation |
|------|-----------|
| Claude Code changes plugin/extension model | Zero runtime dependency — scaffolded files work independently |
| claude-peers MCP discontinued | Document migration path; v0.3.0 bundles own MCP server |
| Low adoption due to claude-peers prerequisite | Clear prerequisite docs; v0.3.0 removes this dependency |

**Resource Risks:**

| Risk | Mitigation |
|------|-----------|
| Solo developer bandwidth | Prioritize ruthlessly — 9-item v1 DoD, nothing else |
| Community themes low quality | Automated scaffold test as quality gate |
| Scope creep from feature requests | Clear version roadmap; everything has a target version |

## Functional Requirements

### Installation & Setup

- FR1: User can install the orchestration framework into any Claude Code project via a single npx command
- FR2: User can select a theme for agent personas during installation
- FR3: User can name their orchestrator agent during installation
- FR4: User can optionally enable BMAD workflow integration during installation
- FR5: System can merge hooks into existing `.claude/settings.json` without destroying user's existing configuration
- FR6: User can preview what will be installed without writing files (dry-run mode)
- FR7: User can install in non-interactive mode by providing flags (for CI/automation)
- FR8: System can detect and report conflicts with existing files, offering resolution options

### Agent Personas & Themes

- FR9: System installs 12 themed agent persona files (1 orchestrator + 11 domain experts) into `.claude/rules/`
- FR10: Each agent persona file defines identity, domain, abilities, domain rules, and self-learning sections
- FR11: User can switch between installed themes
- FR12: Theme creator can add new themes by creating agent files in the standard format
- FR13: System validates theme files for format compliance and content leaks via scaffold test
- FR14: Generic theme orchestrator provides equivalent orchestration capability (session modes, quality gates, synthesis, retry limits, context budget) to themed orchestrators

### Dispatch & Orchestration

- FR15: Orchestrator can send structured dispatch messages to agents with task, context, output, and priority
- FR16: Orchestrator can send followup, relay, and correction messages using typed formats
- FR17: Orchestrator can assign priority levels (P0-blocking, P1-normal, P2-when-idle) to dispatched tasks
- FR18: Orchestrator can track retry count per task and escalate after 3 failed attempts
- FR19: Orchestrator can synthesize results from 2+ agents into comparison tables with conflict resolution
- FR20: Orchestrator can manage context budget by switching to file-only handoffs at high utilization
- FR21: Orchestrator can select appropriate session mode (Micro/Sprint/Full) based on task scope

### Team Collaboration

- FR22: Agents can work in predefined team patterns (TDD Loop, Build+Validate, Research+Docs, Implement+Review)
- FR23: Team members can communicate directly with each other via claude-peers messaging
- FR24: Team members can escalate unresolved disagreements to the orchestrator
- FR25: Orchestrator can dispatch team tasks with partner assignment and role definition

### Self-Learning & Memory

- FR26: System extracts corrections, quality gate outcomes, and pushback patterns from session transcripts
- FR27: System stores extracted learnings in per-agent SQLite databases
- FR28: System recalls relevant past learnings filtered by agent identity at session start
- FR29: Agent can save learnings immediately on task completion (not just session end)
- FR30: System resolves agent identity from environment variable or identity file at session start
- FR31: System routes user prompts to suggested agents based on keyword matching

### BMAD Workflow Integration

- FR32: User can optionally install BMAD workflow templates during init
- FR33: Agents can follow epic -> story -> implement -> verify workflow discipline
- FR34: Orchestrator enforces BMAD readiness checks before dispatching implementation tasks

### Quality & Verification

- FR35: Scaffold test verifies all theme files are installed correctly
- FR36: Scaffold test detects GCT-specific or project-specific reference leaks
- FR37: Scaffold test validates settings.json structure and hook configuration
- FR38: System provides exit codes for scripting and CI integration

## Non-Functional Requirements

### Performance

- NFR1: `npx peer-orchestra init` completes in < 30 seconds on a fresh project
- NFR2: Hook scripts execute in < 2 seconds per invocation (no noticeable delay to user)
- NFR3: Memory recall (session start) processes in < 3 seconds even with 1000+ stored learnings
- NFR4: Agent persona files are < 150 lines each to minimize context window consumption

### Reliability

- NFR5: Init wizard handles existing settings.json without data loss (merge, not overwrite)
- NFR6: Hook failures are silent to the user (stderr only) — never block Claude Code operation
- NFR7: Learning extractor handles malformed or truncated JSONL transcripts without crashing
- NFR8: SQLite memory databases handle concurrent reads from multiple agent sessions
- NFR9: Init wizard rolls back partial changes on failure — no half-installed state

### Compatibility

- NFR10: Works on macOS, Linux, and Windows (WSL) with Node.js >= 18.0.0
- NFR11: Hook scripts require only Python 3.8+ with stdlib (no pip dependencies)
- NFR12: Generated settings.json is compatible with Claude Code's current hook format
- NFR13: Scaffolded files work independently of peer-orchestra being installed globally

### Security

- NFR14: No secrets, API keys, or credentials written to any scaffolded file
- NFR15: All hook scripts are human-readable Python — no obfuscated or minified code
- NFR16: Agent memory databases are gitignored by default
- NFR17: Theme content undergoes automated leak detection before merge

### Maintainability

- NFR18: Theme files follow a documented format contract — breaking changes require major version bump
- NFR19: Hook scripts are self-contained (no cross-file imports) for easy debugging
- NFR20: Error messages include actionable remediation steps, not just error codes
