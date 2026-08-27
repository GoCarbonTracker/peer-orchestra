# Quick Start Guide

Get from zero to your first multi-agent dispatch in a few minutes.

---

## Step 1: Prerequisites (one-time)

**Claude Code** must be installed:
```bash
# Verify Claude Code is available
claude --version
```

**Node.js >= 18** and **Python 3.8+** must be on `PATH`. The scaffolded hooks are plain Python standard library (`json`, `sqlite3`, `os`, `re`, `pathlib`) — nothing to `pip install`. `peer-orchestra init` checks both before writing any files and warns you if either is missing.

**claude-peers MCP** must be installed — this enables agent-to-agent communication:
```bash
# Follow instructions at:
# https://github.com/louislva/claude-peers-mcp
```

## Step 2: Install Peer Orchestra (30 seconds)

```bash
cd your-project/
npx peer-orchestra init
```

The wizard asks:
1. **Theme** — Genshin Impact characters or generic role names
2. **Orchestrator name** — who coordinates your team (default: your username)
3. **BMAD** — optional structured coding workflow (epic -> story -> implement)

That's it. Your `.claude/` directory now has agent personas (12, or 16 for the genshin theme, which adds 4 Archon personas), dispatch protocols, self-learning hooks, and slash commands.

**Prefer non-interactive?**
```bash
npx peer-orchestra init --theme genshin --name Paimon --no-interactive
```

## Step 3: Give Each Terminal an Identity

Every terminal runs the same scaffolded project files — nothing makes a terminal "become" an agent automatically. A terminal's identity resolves in this order: the `PEER_AGENT` environment variable, then a `.peer-identity` file in the project root, then it defaults to `orchestrator`. **If you skip this step, every terminal you open will just be another orchestrator** — no persona loads, and nothing errors to tell you that happened.

Open 2-3 Claude Code terminals in the same project:

```bash
# Terminal 1: The orchestrator (default identity — no env var needed)
claude

# Terminal 2: An agent — set PEER_AGENT to a persona installed in .claude/rules/
PEER_AGENT=kaveh claude

# Terminal 3: Another agent (optional)
PEER_AGENT=xiao claude
```

The value of `PEER_AGENT` must match an installed persona file, lowercase — run `ls .claude/rules/agent-*.md` to see what's available. Prefer not to set an env var each time? Write the name to `.peer-identity` in the project root instead (`echo "kaveh" > .peer-identity`); it's gitignored by default.

## Step 4: Dispatch Your First Task

In Terminal 1 (the orchestrator), type:

```
Build a REST API endpoint for user login with JWT authentication and tests.
```

The orchestrator will:
1. Identify which agents to dispatch to
2. Send structured task messages via claude-peers
3. Coordinate the work across agents
4. Synthesize results and report back

## What Happens Next

- Agents complete their tasks and report back to the orchestrator
- If you correct an agent, it saves the lesson to its memory database
- Next session, the agent recalls that correction and applies it automatically
- Your team gets better over time

## Verify Installation

Check what was installed:
```bash
ls .claude/rules/       # 12 agent personas (16 for genshin) + 4 common rule files
ls .claude/hooks/       # 4 self-learning hook scripts
ls .claude/commands/    # 4 slash commands
cat .claude/settings.json  # Hook configuration
```

Preview without installing:
```bash
npx peer-orchestra init --dry-run --theme genshin --name Paimon --no-interactive
```

## Troubleshooting

**"claude-peers not found"** — Install the claude-peers MCP server first. See [instructions](https://github.com/louislva/claude-peers-mcp).

**"Theme not found"** — Available themes: `genshin`, `generic`. Use `--theme genshin` or `--theme generic`.

**Existing settings.json** — Peer Orchestra merges its hooks alongside your existing configuration; it never overwrites `settings.json` wholesale.

**Re-ran `init` and nothing seems to have changed** — `init` skips any file that already exists unless you pass `--force`. A plain re-run without `--force` will print `SKIP (exists)` for every persona, hook, and command file — that's expected, not a bug. Use `--force` to update framework files to the version you just fetched.

**Want to start over, or remove Peer Orchestra entirely?** Run `npx peer-orchestra uninstall` (add `--dry-run` to preview first). This removes the personas, hooks, commands, `.claude/agent-memory/`, the hook entries and `.gitignore` line it added, and the `# Peer Orchestra` block in `CLAUDE.md`. It does not remove `_bmad/` or `_bmad-output/` — delete those manually if you opted into BMAD.
