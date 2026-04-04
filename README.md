# Peer Orchestra

**Multi-agent orchestration for Claude Code.** Run multiple Claude Code terminals as a coordinated team — each with a distinct persona, domain expertise, and self-learning capabilities.

One command to set up. Open terminals and start building.

```bash
npx peer-orchestra init --theme genshin
```

---

## What is this?

Peer Orchestra turns multiple Claude Code terminals into a coordinated engineering team:

- **Terminal 1** — You, the orchestrator. You plan and dispatch tasks.
- **Terminal 2** — A QA agent that writes and runs tests.
- **Terminal 3** — A backend agent designing your API.
- **Terminal 4** — A frontend agent building the UI.

Each agent has a **personality** (from your chosen theme), **domain expertise** (what they're good at), and **self-learning** (they improve across sessions).

### Before Peer Orchestra
```
You: open 3 terminals, context-switch between all of them,
     remember what each one is doing, manually coordinate
```

### After Peer Orchestra
```
You: "Build a user auth system with tests"
Orchestrator dispatches:
  → Zhongli (backend): designs the auth API
  → Xiao (QA): writes test suite
  → Kaveh (frontend): builds login UI
  → All three coordinate via messages, you review the results
```

---

## Quick Start

### Prerequisites
- [Claude Code](https://claude.ai/code) installed
- Node.js 18+

### Install

```bash
npx peer-orchestra init --theme genshin
```

This scaffolds everything into your project:
- `.claude/rules/` — agent persona files
- `.claude/hooks/` — self-learning hooks
- `.claude/settings.json` — hook configuration
- `CLAUDE.md` — orchestrator instructions

### Shell Aliases (recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias cl='claude --dangerously-skip-permissions'
alias clp='claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers'
```

### Start Orchestrating

```bash
# Terminal 1: You are the orchestrator
clp

# Terminal 2: An agent joins your team
clp

# Terminal 3: Another agent joins
clp

# Tell the orchestrator what to build. It dispatches to agents.
```

---

## Themes

Peer Orchestra ships with themed agent packs. Each theme maps fictional characters to engineering roles — the LLM already knows these characters' personalities from its training data, giving you rich persona grounding for free.

### Genshin Impact (default)

| Character | Role | Personality |
|-----------|------|-------------|
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

### Generic (role-based, no characters)

For teams that prefer straightforward role names without character flavor.

### Coming Soon

- **Naruto** — Shikamaru (strategy), Kakashi (security), Sakura (QA)...
- **Marvel** — Nick Fury (orchestrator), Tony Stark (architect), Jarvis (infra)...
- **DC** — Batman (orchestrator), Oracle (intelligence), Cyborg (infra)...

**Want to create a theme?** See [Contributing](#contributing).

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Your Project                      │
│                                                      │
│  Terminal 1 (clp)    Terminal 2 (clp)   Terminal 3   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │ Orchestrator  │◄─►│   Nahida     │◄─►│  Xiao    │ │
│  │ (you)         │   │  KB & Data   │   │  QA      │ │
│  └──────────────┘   └──────────────┘   └──────────┘ │
│         │                   │                │       │
│         └───────── claude-peers messages ─────┘       │
│                                                      │
│  .claude/rules/agent-*.md    ← Persona layer         │
│  .claude/hooks/              ← Self-learning layer   │
│  CLAUDE.md                   ← Orchestrator config    │
└─────────────────────────────────────────────────────┘
```

### Four Layers

| Layer | Purpose | What Ships |
|-------|---------|-----------|
| **Messaging** | Agent-to-agent communication | [claude-peers](https://github.com/louislva/claude-peers-mcp) (dependency) |
| **Personas** | Character personality + domain expertise | `.claude/rules/agent-*.md` |
| **Workflow** | Epic → Story → Implement discipline | BMAD engine (optional `_bmad/`) |
| **Learning** | Agents improve across sessions | `.claude/hooks/` + lessons file |
| **Evolution** | Agents grow instincts and evolve behaviors | [homunculus](https://github.com/humanplane/homunculus) plugin (included) |

### Dispatch Protocol

The orchestrator sends structured tasks to agents:

```
[dispatch] P1-normal

TASK: Create REST API endpoints for user authentication

CONTEXT: We're using Express + PostgreSQL. JWT for tokens.
         No existing auth code — greenfield.

OUTPUT: src/routes/auth.ts

RESPOND: File path when done + test results
```

### Team Patterns

Agents can work in pairs for tasks that need iteration:

| Pattern | Example | How |
|---------|---------|-----|
| **TDD Loop** | Builder + Tester | Builder writes code → Tester runs tests → iterate |
| **Build + Validate** | Builder + Data Expert | Builder proposes → Expert validates against real data |
| **Research + Docs** | Researcher + Writer | Researcher gathers → Writer structures |
| **Implement + Review** | Builder + Auditor | Builder implements → Auditor reviews |

### Self-Learning + Evolution

Agents learn and evolve automatically via two systems:

**Lessons (immediate):** You correct an agent → it saves the lesson → next session it remembers. Simple file-based learning.

**Homunculus (deep):** The [homunculus](https://github.com/humanplane/homunculus) plugin observes every session — what tools were used, what patterns emerged, what corrections happened. Over time it:
- Extracts **instincts** — small behavioral rules with triggers and actions
- **Clusters** related instincts into higher-level capabilities
- **Evolves** agent behavior automatically based on observed patterns

The result: agents that genuinely improve the more you use them. Not just remembering corrections, but developing intuition about your codebase.

---

## Works With Existing Projects

Peer Orchestra is non-invasive. Run `init` in any existing codebase:

- **Existing CLAUDE.md?** Orchestrator instructions are merged, not replaced
- **Existing `.claude/`?** Agent files are added alongside your existing rules
- **Any language/framework** — agents adapt to your stack

```bash
cd my-existing-rails-app
npx peer-orchestra init --theme genshin
# Ready to orchestrate — nothing broken
```

---

## Customization

### Add Project-Specific Rules

After init, edit any agent file to add your project's specifics:

```markdown
# In .claude/rules/agent-xiao.md, add:

## Project-Specific Rules

- Test framework: pytest
- Run tests: `cd backend && python -m pytest tests/ -v`
- Test data lives in: `tests/fixtures/`
- Never mock the database — use test containers
```

### Create Your Own Theme

```
themes/
  your-theme/
    agents/
      agent-orchestrator.md
      agent-your-character-1.md
      agent-your-character-2.md
      ...
```

Each agent file needs: Identity, Role, Personality, Abilities, Domain Rules, Self-Learning sections.

---

## Contributing

Contributions welcome! Especially:

- **New themes** — map your favorite franchise characters to engineering roles
- **Better hooks** — smarter self-learning, better routing
- **BMAD improvements** — workflow engine enhancements
- **Documentation** — guides, tutorials, examples

### Creating a Theme

1. Fork this repo
2. Create `themes/your-theme/agents/`
3. Write agent files following the template structure
4. Submit a PR with a description of the character-to-role mapping

---

## Credits

- **[claude-peers](https://github.com/louislva/claude-peers-mcp)** by [Louis](https://github.com/louislva) — the MCP server that makes multi-terminal agent communication possible. Peer Orchestra is built on top of this.
- **[BMAD Method](https://github.com/bmadcode/BMAD-METHOD)** — the workflow engine that keeps agents disciplined.
- **[homunculus](https://github.com/humanplane/homunculus)** — the evolution engine that makes agents learn and grow across sessions.
- **[Claude Code](https://claude.ai/code)** by Anthropic — the AI coding assistant that powers each agent.

## Disclaimer

Character names from Genshin Impact, Naruto, Marvel, DC, and other franchises belong to their respective owners. They are used here as personality references for AI agent personas only. This project is not affiliated with or endorsed by any franchise owner.

---

## License

MIT
