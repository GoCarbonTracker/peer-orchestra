---
name: theme-switch
description: Switch the agent theme pack (genshin, generic, or custom). Use when someone says "switch theme", "change agents to generic", or "use naruto theme".
---

# Switch Agent Theme

Replace the current agent persona files with a different theme pack.

## Steps

1. **Identify current theme** — check `.claude/rules/agent-*.md` for character names
2. **List available themes** from the plugin's `themes/` directory
3. **Confirm with user** — "Switch from {current} to {new}? This replaces agent persona files."
4. **Back up current agents** — copy to `.claude/rules/.theme-backup/`
5. **Copy new theme agents** to `.claude/rules/`
6. **Preserve custom rules** — any user-added sections in agent files should be noted (they'll be lost)

## Available Themes

- **genshin** — Nahida, Zhongli, Albedo, Furina, Kaveh, Alhaitham, Xiao, Yelan, Neuvillette, Ganyu, Lisa
- **generic** — data-specialist, backend-engineer, data-processor, technical-writer, frontend-engineer, devops-engineer, qa-engineer, researcher, auditor, reporter, tooling-engineer

## Important

- Always back up before switching
- Warn about custom rule loss
- The orchestrator (Paimon/orchestrator) stays the same role regardless of theme
