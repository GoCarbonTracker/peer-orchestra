# Quick Start Guide

Get from zero to your first multi-agent dispatch in under 2 minutes.

---

## Step 1: Prerequisites (one-time)

**Claude Code** must be installed:
```bash
# Verify Claude Code is available
claude --version
```

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
1. **Orchestrator name** — who coordinates your team (default: your username)
2. **Theme** — Genshin Impact characters or generic role names
3. **BMAD** — optional structured coding workflow (epic -> story -> implement)

That's it. Your `.claude/` directory now has 12 agent personas, dispatch protocols, and self-learning hooks.

**Prefer non-interactive?**
```bash
npx peer-orchestra init --theme genshin --name Paimon --no-interactive
```

## Step 3: Open Terminals (30 seconds)

Open 2-3 Claude Code terminals in the same project:

```bash
# Terminal 1: The orchestrator
claude

# Terminal 2: An agent
claude

# Terminal 3: Another agent (optional)
claude
```

Terminal 1 automatically identifies as the orchestrator. Other terminals become available agents.

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
ls .claude/rules/       # 12 agent personas + 4 rule files
ls .claude/hooks/       # 5 self-learning hook scripts
cat .claude/settings.json  # Hook configuration
```

Preview without installing:
```bash
npx peer-orchestra init --dry-run --theme genshin --name Paimon --no-interactive
```

## Troubleshooting

**"claude-peers not found"** — Install the claude-peers MCP server first. See [instructions](https://github.com/louislva/claude-peers-mcp).

**"Theme not found"** — Available themes: `genshin`, `generic`. Use `--theme genshin` or `--theme generic`.

**Existing settings.json** — Peer Orchestra merges its hooks alongside your existing configuration. Use `--force` to overwrite instead.

**Want to start over?** Delete `.claude/rules/agent-*.md`, `.claude/hooks/`, and `.claude/agent-memory/`, then re-run init.
