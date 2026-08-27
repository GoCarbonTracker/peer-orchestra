# Peer Orchestra

**Your real AI team.** Turn Claude Code terminals into a coordinated engineering team with themed personas, structured dispatch, and agents that learn across sessions.

```bash
npx peer-orchestra init
```

---

## What Is This?

Peer Orchestra scaffolds a complete multi-agent orchestration framework into any Claude Code project. One command installs 12 themed agent personas, structured dispatch protocols, team collaboration patterns, and self-learning hooks.

- **You** give direction and make decisions
- **Your orchestrator** plans, dispatches, and coordinates
- **11 domain agents** handle the work — backend, frontend, QA, data, research, infrastructure...

Each agent has a **personality**, **domain expertise**, and **persistent memory** — they improve across sessions.

### Before

```
You: open 4 terminals, context-switch between all of them,
     remember what each one is doing, manually coordinate
```

### After

```
You: "Build a user auth system with tests"
Orchestrator dispatches:
  -> Backend agent: designs the auth API
  -> QA agent: writes test suite
  -> Frontend agent: builds login UI
  -> All three coordinate via messages, you review the results
```

---

## Quick Start

### Prerequisites

- [Claude Code](https://claude.ai/code) installed
- [claude-peers MCP](https://github.com/louislva/claude-peers-mcp) installed

### Install

```bash
npx peer-orchestra init
```

The interactive wizard asks for your orchestrator name and theme. Done in 30 seconds.

**Non-interactive (CI/automation):**

```bash
npx peer-orchestra init --theme genshin --name Paimon --no-interactive
```

### Start Orchestrating

```bash
# Terminal 1: You are the orchestrator
claude

# Terminal 2: An agent joins your team
claude

# Terminal 3: Another agent joins
claude

# Tell the orchestrator what to build. It dispatches to agents.
```

See [docs/quick-start.md](docs/quick-start.md) for the full walkthrough.

---

## The Team

### Genshin Theme

| Character | Role | Personality |
|-----------|------|-------------|
| **Paimon** (default) | Orchestrator | Enthusiastic guide, coordinates everything |
| Nahida | KB & Data | Curious, precise, deeply knowledgeable |
| Zhongli | Backend & Architecture | Methodical, thorough, unshakeable |
| Albedo | Data Processing | Analytical, systematic, cost-conscious |
| Furina | Documentation & Research | Theatrical, decisive, detail-oriented |
| Kaveh | Frontend & UI | Creative, passionate about design |
| Alhaitham | Infrastructure & Security | Rational, efficient, uncompromising |
| Xiao | QA & Testing | Silent, relentless bug hunter |
| Yelan | Research & Intelligence | Sharp, concise, source-verified |
| Neuvillette | Audit & Review | Calm, impartial, evidence-first |
| Ganyu | Reporting & Admin | Thorough, organized, never misses details |
| Lisa | Tooling & Internals | Scholarly, understands systems deeply |

### Generic Theme

For teams that prefer straightforward role names: Orchestrator, Backend Engineer, Frontend Engineer, QA Engineer, Data Specialist, Data Processor, DevOps Engineer, Technical Writer, Researcher, Auditor, Reporter, Tooling Engineer.

```bash
npx peer-orchestra init --theme generic
```

### Coming Soon

Community themes: Naruto, Marvel, DC, LOTR, and custom. [Create your own](docs/theme-creation-guide.md).

---

## Architecture

```
peer-orchestra/
├── src/index.js                 # CLI entry point (init wizard)
├── src/templates/               # Files scaffolded into your project
│   ├── hooks/                   # Self-learning hook scripts
│   ├── rules/                   # Dispatch protocol + common rules
│   └── CLAUDE.md.template       # Orchestrator instructions
├── themes/
│   ├── genshin/agents/          # 12 Genshin persona files
│   └── generic/agents/          # 12 role-based alternatives
├── commands/                    # Slash command docs
└── tests/                       # Scaffold smoke tests
```

### Five Layers

| Layer | Purpose | Component |
|-------|---------|-----------|
| **Messaging** | Agent-to-agent communication | [claude-peers](https://github.com/louislva/claude-peers-mcp) |
| **Personas** | Character personality + domain expertise | `themes/*/agents/` |
| **Dispatch** | Structured task routing + team patterns | `src/templates/rules/` |
| **Workflow** | Epic -> Story -> Implement discipline | BMAD engine (optional) |
| **Evolution** | Agents grow instincts across sessions | [homunculus](https://github.com/humanplane/homunculus) |

### What Gets Installed

After `npx peer-orchestra init`, your project gets:

```
.claude/
  rules/          # 12 agent personas + dispatch protocol
  hooks/          # Self-learning hooks (5 scripts)
  agent-memory/   # Per-agent SQLite DBs (gitignored)
  settings.json   # Hook configuration
CLAUDE.md         # Orchestrator instructions (merged)
```

---

## Commands

| Command | What it does |
|---------|-------------|
| `/dispatch <agent> <task>` | Send a structured task to an agent |
| `/orchestra-status` | Show who's online, what they're working on |
| `/party <name>` | Spawn a pre-configured team |
| `/archon-council <topic>` | Strategic debate (Genshin theme) |

### Dispatch Protocol

The orchestrator sends typed messages with priority levels:

```
[dispatch] P1-normal

TASK: Create REST API endpoints for user authentication
CONTEXT: Express + PostgreSQL. JWT for tokens. Greenfield.
OUTPUT: src/routes/auth.ts
RESPOND: File path when done + test results
```

### Team Patterns

| Pattern | Example | How |
|---------|---------|-----|
| **TDD Loop** | Builder + QA | Builder writes -> QA tests -> iterate |
| **Build + Validate** | Builder + Data | Builder proposes -> Data validates |
| **Research + Docs** | Researcher + Writer | Research findings -> structured docs |
| **Implement + Review** | Builder + Auditor | Builder implements -> Auditor reviews |

---

## Self-Learning + Evolution

**Lessons (immediate):** Correct an agent -> it saves the lesson -> next session it remembers.

**How it works:**
1. Session learning extractor parses transcripts for corrections, quality gate outcomes, and pushback
2. Patterns saved to per-agent SQLite databases (`.claude/agent-memory/`)
3. At session start, each agent recalls its past lessons automatically

**Homunculus (deep):** The [homunculus](https://github.com/humanplane/homunculus) evolution engine observes sessions, extracts instincts, clusters patterns, and evolves agent behavior. Agents genuinely improve the more you use them.

---

## CLI Options

```bash
npx peer-orchestra init [options]

Options:
  --theme <name>      Theme: genshin (default), generic
  --name <name>       Orchestrator persona name
  --dir <path>        Target directory (default: .)
  --bmad              Enable BMAD workflow integration
  --no-interactive    Skip prompts (requires --theme and --name)
  --dry-run           Preview what would be installed
  --force             Overwrite existing files
  --version, -v       Print version
```

---

## Contributing

Contributions welcome! Especially:

- **New themes** — map your favorite franchise characters to engineering roles. See [theme creation guide](docs/theme-creation-guide.md).
- **Better hooks** — smarter routing, better memory recall
- **Documentation** — guides, tutorials, examples

---

## Credits

- **[claude-peers](https://github.com/louislva/claude-peers-mcp)** by Louis — multi-terminal agent communication
- **[homunculus](https://github.com/humanplane/homunculus)** — agent evolution engine
- **[BMAD Method](https://github.com/bmadcode/BMAD-METHOD)** — workflow discipline
- **[Claude Code](https://claude.ai/code)** by Anthropic — the AI powering each agent

## Disclaimer

Character names from Genshin Impact and other franchises belong to their respective owners. Used as personality references for AI agent personas only.

## License

MIT
