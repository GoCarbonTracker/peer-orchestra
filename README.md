# Peer Orchestra

**Turn Claude Code terminals into a coordinated engineering team.** Themed personas, a structured dispatch protocol, and hooks that let agents recall past corrections across sessions.

```bash
npx peer-orchestra init
```

---

## What Is This?

Peer Orchestra scaffolds a multi-agent orchestration framework into any Claude Code project. One command installs 12 themed agent personas, dispatch protocols, team collaboration patterns, and self-learning hooks.

- **You** give direction and make decisions
- **Your orchestrator** plans, dispatches, and coordinates
- **11 domain agents** handle the work — backend, frontend, QA, data, research, infrastructure...

Each agent has a **personality**, **domain expertise**, and **persistent memory** — corrections you give them are saved and recalled in later sessions.

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

## How a Terminal Becomes an Agent (read this first)

This is the part that makes the whole thing work. Skip it and every terminal you open will just be a second orchestrator.

Every Claude Code terminal in your project runs the exact same scaffolded files — there's nothing that inherently makes one terminal "Kaveh" and another "Xiao". Each terminal figures out its own identity at session start, using this priority order (`templates/hooks/agent-persona-loader.py`):

1. **`PEER_AGENT` environment variable** — set before launching `claude`
2. **`.peer-identity` file** in the project root — its first line is the agent name
3. **Default: `orchestrator`**

If you just open more `claude` terminals with nothing set, **every one of them becomes the orchestrator.** No persona loads, no error is printed — the session just quietly runs as the default identity. This is the single most common way to think the tool is broken.

### Worked example

```bash
# Terminal 1 — the orchestrator (no PEER_AGENT needed, it's the default)
claude

# Terminal 2 — this terminal becomes Kaveh (frontend)
PEER_AGENT=kaveh claude

# Terminal 3 — this terminal becomes Xiao (QA)
PEER_AGENT=xiao claude
```

The agent name must match a file at `.claude/rules/agent-{name}.md` (lowercase, e.g. `kaveh`, `xiao`, `zhongli`). If you're not sure what's installed, run `ls .claude/rules/agent-*.md`.

### The `.peer-identity` alternative

If you'd rather not set an env var every time (or you're using a terminal multiplexer that makes that awkward), write the agent name to a file instead:

```bash
echo "kaveh" > .peer-identity
claude
```

`.peer-identity` is per-project and gitignored by default — each terminal/worktree can point at a different file if you're running agents from separate checkouts.

---

## Quick Start

### Prerequisites

- **[Claude Code](https://claude.ai/code)** installed
- **Node.js >= 18**
- **Python 3.8+** — the hooks are plain Python **standard library only** (`json`, `sqlite3`, `os`, `re`, `pathlib`). Nothing to `pip install`.
- **[claude-peers MCP](https://github.com/louislva/claude-peers-mcp)** installed — this is what lets terminals actually send messages to each other

`peer-orchestra init` checks Node and Python versions before writing anything and tells you plainly if either is missing or too old.

### Install

```bash
npx peer-orchestra init
```

The interactive wizard asks for a theme, then your orchestrator name. Done in under a minute.

**Non-interactive (CI/automation):**

```bash
npx peer-orchestra init --theme genshin --name Paimon --no-interactive
```

### Start Orchestrating

```bash
# Terminal 1: You are the orchestrator (default identity)
claude

# Terminal 2: An agent joins your team
PEER_AGENT=kaveh claude

# Terminal 3: Another agent joins
PEER_AGENT=xiao claude

# Tell the orchestrator what to build. It dispatches to agents by name.
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

The Genshin theme also installs **4 Archon personas** (Venti, Raiden Shogun, Mavuika, Tsaritsa) used for `/archon-council` strategic debates — see [Commands](#commands) below. That's 16 persona files total for this theme, not 12.

### Generic Theme

For teams that prefer straightforward role names: Orchestrator, Backend Engineer, Frontend Engineer, QA Engineer, Data Specialist, Data Processor, DevOps Engineer, Technical Writer, Researcher, Auditor, Reporter, Tooling Engineer. No Archon-equivalent personas ship with this theme.

```bash
npx peer-orchestra init --theme generic
```

### Coming Soon

Community themes: Naruto, Marvel, DC, LOTR, and custom. [Create your own](docs/theme-creation-guide.md).

---

## Architecture

```
peer-orchestra/
├── src/
│   ├── index.js                 # CLI entry point (83 lines — parseArgs, usage, command dispatch)
│   ├── commands/                # init.js, uninstall.js
│   └── lib/                     # fs-utils, settings, claude-md, preflight, python, state, version
├── templates/                   # Files scaffolded into your project
│   ├── hooks/                   # Self-learning hook scripts (Python stdlib)
│   ├── rules/                   # Dispatch protocol + common rules
│   ├── mcp/                     # claude-peers memory-recall helper script
│   └── CLAUDE.md.template       # Orchestrator instructions
├── themes/
│   ├── genshin/agents/          # 12 Genshin persona files
│   ├── genshin/archons/         # 4 Archon persona files (Genshin theme only)
│   └── generic/agents/          # 12 role-based alternatives
├── commands/                    # 4 slash commands — installed to .claude/commands/
└── tests/                       # Scaffold + hook smoke tests
```

### Four Layers

| Layer | Purpose | Component |
|-------|---------|-----------|
| **Messaging** | Agent-to-agent communication | [claude-peers](https://github.com/louislva/claude-peers-mcp) |
| **Personas** | Character personality + domain expertise | `themes/*/agents/` |
| **Dispatch** | Structured task routing + team patterns | `templates/rules/` |
| **Evolution** | Agents grow instincts across sessions | [homunculus](https://github.com/humanplane/homunculus) |

### What Gets Installed

`npx peer-orchestra init` writes into your project. This is the complete list — every path created or modified, and whether it's new or merged into something that already exists.

| Path | What | New or merged? |
|------|------|-----------------|
| `.claude/rules/agent-*.md` | Theme's agent personas (12, or 16 for genshin) + 4 common rule files (`agent-common.md`, `multi-agent-dispatch.md`, `self-improvement.md`, `team-dispatch.md`) | New files; skipped if already present unless `--force` |
| `.claude/hooks/*.py` | 4 self-learning hook scripts (`agent-router.py`, `agent-persona-loader.py`, `session-start-peer-memory.py`, `session-learning-extractor.py`) | New files; skipped if already present unless `--force` |
| `.claude/commands/*.md` | 4 slash commands (`/dispatch`, `/party`, `/orchestra-status`, `/archon-council`) | New files; skipped if already present unless `--force` |
| `.claude/agent-memory/` | Empty directory for per-agent SQLite learning DBs | Created if missing |
| `.claude/settings.json` | Hook registration (SessionStart, SessionEnd, UserPromptSubmit) + `plugins: { homunculus: true }` | **Merged** into an existing file if one is present — your existing hooks and plugins are preserved, not replaced |
| `.gitignore` | Appends a `.claude/agent-memory/` entry | Appended if not already present |
| `CLAUDE.md` | Orchestrator instructions (dispatch protocol, agent roster, self-learning explanation) | **Merged**: appended to an existing `CLAUDE.md`, or created if none exists. Skipped entirely if a `# Peer Orchestra` section is already there |
| `.claude/.peer-orchestra.json` | Small state file recording which theme and version were installed | Written by `init`, read by `uninstall` to know exactly which persona files it owns |

Nothing outside these paths is touched.

### Re-running `init` to upgrade

`init` is **skip-by-default**, not overwrite-by-default. Re-running it without `--force` will print `SKIP (exists)` for every persona, hook, and command file that's already on disk — that output means "left alone," not "updated." If you're trying to pick up a newer version of the framework files (new hook fixes, updated personas), you need:

```bash
npx peer-orchestra init --force
```

`--force` overwrites framework-owned files (personas, hooks, commands) but still merges (never replaces) `settings.json` and `CLAUDE.md`. If you've hand-edited a persona or hook file, `--force` will discard those edits — check `git diff` before running it on a project with local changes.

### Uninstalling / reverting

To remove everything Peer Orchestra installed:

```bash
npx peer-orchestra uninstall
```

This removes the paths listed in the table above: `.claude/rules/agent-*.md` (theme personas + archons) and the 4 common rule files, `.claude/hooks/*.py`, `.claude/commands/*.md`, `.claude/agent-memory/`, the hook entries this tool added to `.claude/settings.json` (your own hooks are left alone), the `.claude/agent-memory/` line it added to `.gitignore`, and the `# Peer Orchestra` block it appended to `CLAUDE.md`.

By default `uninstall` prints the plan and asks for confirmation before deleting anything. Pass `--dry-run` to see the plan without a prompt and without deleting anything, or `--force` (or `--no-interactive`) to skip the confirmation prompt and remove immediately.

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
  --no-interactive    Skip prompts (requires --theme and --name)
  --dry-run           Preview what would be installed
  --force             Overwrite existing framework files (personas, hooks, commands).
                      Does NOT touch settings.json/CLAUDE.md merge behavior — see
                      "Re-running init to upgrade" above.
  --version, -v       Print version
```

```bash
npx peer-orchestra uninstall [options]

Options:
  --dir <path>        Target directory (default: .)
  --dry-run           Preview what would be removed; asks nothing, deletes nothing
  --force             Skip the confirmation prompt and remove immediately
  --no-interactive    Same as --force here — skip the confirmation prompt
```

Interactive mode also prompts for the theme if `--theme` isn't passed and the wizard is running in a real TTY.

---

## Contributing

Contributions welcome, especially new themes and better hooks. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, running tests, and the theme submission process ([theme creation guide](docs/theme-creation-guide.md)).

---

## Credits

- **[claude-peers](https://github.com/louislva/claude-peers-mcp)** by Louis — multi-terminal agent communication
- **[homunculus](https://github.com/humanplane/homunculus)** — agent evolution engine
- **[Claude Code](https://claude.ai/code)** by Anthropic — the AI powering each agent

## Disclaimer

Character names from Genshin Impact and other franchises belong to their respective owners. Used as personality references for AI agent personas only.

## License

MIT
