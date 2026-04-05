# Peer Orchestra

**Multi-agent orchestration plugin for Claude Code.** Turn multiple Claude Code terminals into a coordinated engineering team — each with a distinct persona, domain expertise, and self-learning capabilities.

```bash
claude plugin install peer-orchestra
```

---

## What is this?

Peer Orchestra is a **Claude Code plugin** that gives you a team of specialized AI agents:

- **You** are the **Traveler** — you give direction and make decisions
- **Paimon** is your **orchestrator** — she plans, dispatches, and coordinates
- **11 domain agents** handle the actual work — backend, frontend, QA, data, research...

Each agent has a **personality** (from Genshin Impact characters), **domain expertise**, and **self-learning** (they improve across sessions).

### Before Peer Orchestra
```
You: open 3 terminals, context-switch between all of them,
     remember what each one is doing, manually coordinate
```

### After Peer Orchestra
```
You: "Build a user auth system with tests"
Paimon dispatches:
  → Zhongli (backend): designs the auth API
  → Xiao (QA): writes test suite
  → Kaveh (frontend): builds login UI
  → All three coordinate via messages, you review the results
```

---

## Quick Start

### Prerequisites
- [Claude Code](https://claude.ai/code) installed
- [claude-peers MCP server](https://github.com/louislva/claude-peers-mcp) installed

### Install

```bash
claude plugin install peer-orchestra
```

### Shell Aliases (recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias cl='claude --dangerously-skip-permissions'
alias clp='claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers'
```

### Start Orchestrating

```bash
# Terminal 1: You are the Traveler
clp

# Terminal 2: An agent joins your team
clp

# Terminal 3: Another agent joins
clp

# Tell Paimon what to build. She dispatches to agents.
```

### Plugin Commands

| Command | What it does |
|---------|-------------|
| `/orchestra-status` | Show who's online, what they're working on |
| `/dispatch <agent> <task>` | Send a structured task to an agent |
| `/init` | Set up peer-orchestra in your project |
| `/theme-switch` | Switch between agent theme packs |

---

## The Team (Genshin Theme)

| Character | Role | Personality |
|-----------|------|-------------|
| **Paimon** | Orchestrator | Enthusiastic guide, coordinates everything |
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

For teams that prefer straightforward role names without character flavor. Install with `/theme-switch generic`.

### Coming Soon

- **Naruto** — Shikamaru (strategy), Kakashi (security), Sakura (QA)...
- **Marvel** — Nick Fury (orchestrator), Tony Stark (architect), Jarvis (infra)...
- **DC** — Batman (orchestrator), Oracle (intelligence), Cyborg (infra)...

**Want to create a theme?** See [Contributing](#contributing).

---

## Architecture

```
peer-orchestra/                    (Claude Code Plugin)
├── .claude-plugin/
│   └── plugin.json                # Plugin manifest
├── agents/                        # 12 subagent personas
│   ├── paimon.md                  # Orchestrator (Opus)
│   ├── nahida.md                  # KB & Data (Sonnet)
│   ├── zhongli.md                 # Backend (Sonnet)
│   └── ...                        # 9 more agents
├── skills/
│   ├── init/SKILL.md              # Project initialization
│   └── theme-switch/SKILL.md      # Switch theme packs
├── commands/
│   ├── orchestra-status.md        # /orchestra-status
│   └── dispatch.md                # /dispatch <agent> <task>
├── hooks/
│   └── hooks.json                 # Agent router, memory hooks
├── scripts/                       # Hook implementations
├── themes/
│   ├── genshin/agents/            # Genshin persona files
│   └── generic/agents/            # Role-based alternatives
└── src/templates/                 # Rule templates (dispatch, teams)
```

### Five Layers

| Layer | Purpose | Component |
|-------|---------|-----------|
| **Messaging** | Agent-to-agent communication | [claude-peers](https://github.com/louislva/claude-peers-mcp) |
| **Personas** | Character personality + domain expertise | `agents/*.md` |
| **Dispatch** | Structured task routing + team patterns | `src/templates/rules/` |
| **Workflow** | Epic → Story → Implement discipline | BMAD engine (optional) |
| **Evolution** | Agents grow instincts across sessions | [homunculus](https://github.com/humanplane/homunculus) |

### Dispatch Protocol

Paimon sends structured tasks to agents:

```
[dispatch] P1-normal

TASK: Create REST API endpoints for user authentication

CONTEXT: We're using Express + PostgreSQL. JWT for tokens.
         No existing auth code — greenfield.

OUTPUT: src/routes/auth.ts

RESPOND: File path when done + test results
```

### Team Patterns

Agents work in pairs for tasks that need iteration:

| Pattern | Example | How |
|---------|---------|-----|
| **TDD Loop** | Builder + Xiao | Builder writes → Xiao tests → iterate |
| **Build + Validate** | Builder + Nahida | Builder proposes → Nahida validates data |
| **Research + Docs** | Yelan + Furina | Yelan researches → Furina structures |
| **Implement + Review** | Builder + Neuvillette | Builder implements → Neuvillette audits |

### Self-Learning + Evolution

**Lessons (immediate):** You correct an agent → it saves the lesson → next session it remembers.

**Homunculus (deep):** The [homunculus](https://github.com/humanplane/homunculus) plugin observes sessions, extracts instincts, clusters patterns, and evolves agent behavior automatically. Agents that genuinely improve the more you use them.

---

## Works With Existing Projects

Peer Orchestra is non-invasive. Use `/init` in any existing codebase — nothing breaks:

- **Any language/framework** — agents adapt to your stack
- **Existing Claude Code config** — plugin adds alongside, doesn't replace
- **Solo or team** — use 1 agent or all 12

---

## Customization

### Add Project-Specific Context

After installing, tell your agents about your project. They learn through conversation and save lessons automatically.

### Create Your Own Theme

Add a directory under `themes/your-theme/agents/` with agent markdown files following the frontmatter format. Each needs: name, description, model, personality, abilities, domain rules, and self-learning sections.

---

## Contributing

Contributions welcome! Especially:

- **New themes** — map your favorite franchise characters to engineering roles
- **Better hooks** — smarter routing, better memory
- **New agent roles** — DevRel, ML Engineer, Mobile Dev...
- **Documentation** — guides, tutorials, examples

---

## Credits

- **[claude-peers](https://github.com/louislva/claude-peers-mcp)** by [Louis](https://github.com/louislva) — the MCP server that makes multi-terminal agent communication possible
- **[homunculus](https://github.com/humanplane/homunculus)** — the evolution engine that makes agents learn and grow
- **[BMAD Method](https://github.com/bmadcode/BMAD-METHOD)** — workflow discipline engine
- **[Claude Code](https://claude.ai/code)** by Anthropic — the AI coding assistant powering each agent

## Disclaimer

Character names from Genshin Impact, Naruto, Marvel, DC, and other franchises belong to their respective owners. Used as personality references for AI agent personas only. Not affiliated with or endorsed by any franchise owner.

---

## License

MIT
