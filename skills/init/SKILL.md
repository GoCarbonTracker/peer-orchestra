---
name: init
description: Initialize peer-orchestra in the current project. Sets up agent rules, dispatch protocols, and self-learning hooks. Use when someone says "set up peer orchestra", "initialize agents", or "start orchestrating".
---

# Initialize Peer Orchestra

Set up the multi-agent orchestration framework in the current project.

## Steps

1. **Check for existing config** — look for `.claude/rules/agent-*.md` files. If they exist, ask before overwriting.

2. **Create `.claude/rules/`** directory if it doesn't exist.

3. **Copy agent rules** from the plugin's `themes/genshin/agents/` to `.claude/rules/`:
   - All 12 agent files (paimon + 11 domain agents)
   - `agent-common.md` from `src/templates/rules/`
   - `multi-agent-dispatch.md`
   - `team-dispatch.md`
   - `self-improvement.md`

4. **Copy hooks** from `src/templates/hooks/` to `.claude/hooks/`:
   - `agent-router.py`
   - `agent-persona-loader.py`
   - `session-start-peer-memory.py`
   - `session-end-peer-memory.py`

5. **Merge CLAUDE.md** — if one exists, append the orchestrator section. If not, create it.

6. **Print next steps**:
   ```
   Peer Orchestra is ready!

   Add these aliases to your ~/.zshrc:
     alias cl='claude --dangerously-skip-permissions'
     alias clp='claude --dangerously-skip-permissions --dangerously-load-development-channels server:claude-peers'

   Then:
     Terminal 1: clp  (you are the Traveler — the orchestrator)
     Terminal 2+: clp  (these become your agents)
   ```

## Important

- Never overwrite existing files without asking
- Keep the init idempotent — running twice should be safe
- Don't add project-specific domain rules — the user does that
