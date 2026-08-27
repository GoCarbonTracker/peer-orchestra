# Peer Orchestra — Full Repo Audit

**Date:** 2026-04-08
**Purpose:** Complete inventory before BMAD greenfield workflow. Foundation for product brief.
**Target:** Pivot from Claude Code plugin to standalone npx tool.

---

## 1. Directory Structure

```
peer-orchestra/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (v1.0.0) — NEEDS REMOVAL/REPLACEMENT for npx pivot
├── .claude/
│   └── homunculus/
│       └── observations.jsonl   # Homunculus observation log
├── agents/                      # 16 subagent persona files (root-level, used by plugin)
│   ├── paimon.md                # Orchestrator (Opus, maxTurns: 50)
│   ├── nahida.md                # KB & Data (Sonnet)
│   ├── zhongli.md               # Backend & Architecture (Sonnet)
│   ├── albedo.md                # Data Processing (Sonnet)
│   ├── furina.md                # Documentation & Research (Sonnet)
│   ├── kaveh.md                 # Frontend & UI (Sonnet)
│   ├── alhaitham.md             # Infrastructure & Security (Sonnet)
│   ├── xiao.md                  # QA & Testing (Sonnet)
│   ├── yelan.md                 # Research & Intelligence (Sonnet)
│   ├── neuvillette.md           # Audit & Review (Sonnet)
│   ├── ganyu.md                 # Reporting & Admin (Sonnet)
│   ├── lisa.md                  # Tooling & Internals (Sonnet)
│   ├── venti.md                 # Archon: Freedom/Simplicity (Sonnet, medium effort)
│   ├── raiden-shogun.md         # Archon: Eternity/Maintainability (Sonnet)
│   ├── mavuika.md               # Archon: War/Speed (Sonnet)
│   └── tsaritsa.md              # Archon: Love/User Empathy (Sonnet, medium effort)
├── commands/                    # 4 slash commands (plugin format)
│   ├── dispatch.md              # /dispatch <agent> <task>
│   ├── orchestra-status.md      # /orchestra-status
│   ├── archon-council.md        # /archon-council <topic>
│   └── party.md                 # /party <name>
├── docs/
│   └── research/2026-04-05/
│       └── sangam-peer-orchestra-research-summary.md  # Prior research doc
├── hooks/
│   └── hooks.json               # Plugin hooks config (uses $CLAUDE_PLUGIN_ROOT)
├── scripts/                     # Hook implementations (plugin runtime copies)
│   ├── agent-router.py          # Keyword-based prompt routing
│   ├── agent-persona-loader.py  # Loads agent identity on session start
│   ├── session-start-peer-memory.py  # Recalls past lessons
│   └── session-end-peer-memory.py    # PLACEHOLDER — does nothing
├── skills/                      # 2 plugin skills
│   ├── init/SKILL.md            # /init — set up peer-orchestra in a project
│   └── theme-switch/SKILL.md    # /theme-switch — swap agent themes
├── src/
│   ├── index.js                 # CLI entry point (shebang, interactive init wizard)
│   └── templates/               # Files copied to target projects during init
│       ├── CLAUDE.md.template   # Orchestrator instructions template
│       ├── hooks/               # 5 hook scripts (templates for target project)
│       │   ├── agent-router.py
│       │   ├── agent-persona-loader.py
│       │   ├── session-start-peer-memory.py
│       │   ├── session-end-peer-memory.py
│       │   └── session-learning-extractor.py  # REAL — full implementation (390 lines)
│       ├── mcp/
│       │   └── recall_agent_context.py  # MCP tool template (not wired, reference only)
│       └── rules/               # Rule templates copied to target .claude/rules/
│           ├── agent-common.md
│           ├── multi-agent-dispatch.md
│           ├── self-improvement.md
│           └── team-dispatch.md
├── tests/
│   └── scaffold-test.js         # Smoke test for init scaffolding
├── themes/
│   ├── genshin/agents/          # 12 agent persona files (Genshin-themed)
│   │   ├── agent-orchestrator.md (135 lines — very detailed)
│   │   ├── agent-nahida.md, agent-zhongli.md, agent-albedo.md,
│   │   │   agent-furina.md, agent-kaveh.md, agent-alhaitham.md,
│   │   │   agent-xiao.md, agent-yelan.md, agent-neuvillette.md,
│   │   │   agent-ganyu.md, agent-lisa.md
│   └── generic/agents/          # 12 agent persona files (role-name only)
│       ├── agent-orchestrator.md (28 lines — minimal)
│       ├── agent-backend-engineer.md, agent-data-specialist.md,
│       │   agent-data-processor.md, agent-technical-writer.md,
│       │   agent-frontend-engineer.md, agent-devops-engineer.md,
│       │   agent-qa-engineer.md, agent-researcher.md,
│       │   agent-auditor.md, agent-reporter.md, agent-tooling-engineer.md
├── .gitignore
├── .npmignore
├── LICENSE                      # MIT, Copyright (c) 2026 Moka
├── package.json                 # v0.1.0, bin: "peer-orchestra" -> src/index.js
└── README.md                    # Full project docs (232 lines)
```

**Total files:** 68 (excluding .git)

---

## 2. Agents — Complete Roster

### Domain Agents (11)

| Agent | File | Model | Effort | MaxTurns | Role | Status |
|-------|------|-------|--------|----------|------|--------|
| Paimon | agents/paimon.md | opus | high | 50 | Orchestrator | COMPLETE — rich, detailed |
| Nahida | agents/nahida.md | sonnet | high | 30 | KB & Data | COMPLETE |
| Zhongli | agents/zhongli.md | sonnet | high | 30 | Backend & Architecture | COMPLETE |
| Albedo | agents/albedo.md | sonnet | high | 30 | Data Processing | COMPLETE |
| Furina | agents/furina.md | sonnet | high | 30 | Documentation & Research | COMPLETE |
| Kaveh | agents/kaveh.md | sonnet | high | 30 | Frontend & UI | COMPLETE |
| Alhaitham | agents/alhaitham.md | sonnet | high | 30 | Infrastructure & Security | COMPLETE |
| Xiao | agents/xiao.md | sonnet | high | 30 | QA & Testing | COMPLETE |
| Yelan | agents/yelan.md | sonnet | high | 30 | Research & Intelligence | COMPLETE |
| Neuvillette | agents/neuvillette.md | sonnet | high | 30 | Audit & Review | COMPLETE |
| Ganyu | agents/ganyu.md | sonnet | high | 30 | Reporting & Admin | COMPLETE |
| Lisa | agents/lisa.md | sonnet | high | 30 | Tooling & Internals | COMPLETE |

### Archon Agents (4 — strategic council, not implementation)

| Agent | File | Model | Effort | MaxTurns | Philosophy |
|-------|------|-------|--------|----------|------------|
| Venti | agents/venti.md | sonnet | medium | 20 | Freedom/Simplicity |
| Raiden Shogun | agents/raiden-shogun.md | sonnet | high | 25 | Eternity/Maintainability |
| Mavuika | agents/mavuika.md | sonnet | high | 25 | War/Speed |
| Tsaritsa | agents/tsaritsa.md | sonnet | medium | 20 | Love/User Empathy |

**Note:** Nahida, Zhongli, and Furina are both domain agents AND Archons (listed in Paimon's roster). Venti, Raiden Shogun, Mavuika, and Tsaritsa are Archon-only (strategic debate, no implementation).

All 16 agent files have: YAML frontmatter (name, description, model, effort, maxTurns), Identity section, Role, Personality, Abilities, Domain Rules, Self-Learning section. Consistent format across all.

---

## 3. Themes

### Genshin Theme (12 files in `themes/genshin/agents/`)

Full personas with Genshin Impact character flavor. The `agent-orchestrator.md` is the most detailed file in the entire repo (135 lines) — includes session modes, quality gates, synthesis protocol, retry limits, context budget, pushback handling.

### Generic Theme (12 files in `themes/generic/agents/`)

Stripped-down role-name equivalents without character personality. Much shorter (20-30 lines each). The `agent-orchestrator.md` is bare-bones (28 lines) compared to Genshin's.

### Theme Parity Issues

- Generic `agent-orchestrator.md` is missing: session modes, quality gates, synthesis protocol, retry limits, context budget, pushback handling, team dispatch checklist, dispatch sizing — all present in Genshin version.
- Generic agents lack the Personality section — they have Identity, Role, Abilities, Domain Rules, Self-Learning but no character voice.
- README mentions future themes (Naruto, Marvel, DC) — none exist yet.

---

## 4. Hooks and Scripts

### Plugin Hooks (`hooks/hooks.json`)

Uses `${CLAUDE_PLUGIN_ROOT}` variable — this is plugin-specific infrastructure. All paths reference `scripts/` directory.

| Event | Hook | Script |
|-------|------|--------|
| UserPromptSubmit | agent-router | `scripts/agent-router.py` |
| SessionStart | agent-persona-loader | `scripts/agent-persona-loader.py` |
| SessionStart | session-start-peer-memory | `scripts/session-start-peer-memory.py` |
| SessionEnd | session-end-peer-memory | `scripts/session-end-peer-memory.py` |
| SessionEnd | session-learning-extractor | *MISSING from scripts/* — only in templates |
| PreCompact | session-learning-extractor | *MISSING from scripts/* — only in templates |

### Script Status

| Script | Location | Status |
|--------|----------|--------|
| agent-router.py | scripts/ + templates/hooks/ | COMPLETE — keyword matching, outputs agent suggestions |
| agent-persona-loader.py | scripts/ + templates/hooks/ | COMPLETE — reads PEER_AGENT env or .peer-identity file |
| session-start-peer-memory.py | scripts/ + templates/hooks/ | COMPLETE — reads lessons.md, filters by agent |
| session-end-peer-memory.py | scripts/ + templates/hooks/ | PLACEHOLDER — `pass` in main(), does nothing |
| session-learning-extractor.py | templates/hooks/ ONLY | COMPLETE — full 390-line implementation, parses JSONL transcripts, extracts corrections/quality gates/pushback, saves to SQLite |
| recall_agent_context.py | templates/mcp/ | TEMPLATE ONLY — not wired, imports commented out, reference implementation |

### Issues

1. `session-learning-extractor.py` exists in templates but NOT in scripts/ — hooks.json references it from scripts/ via `${CLAUDE_PLUGIN_ROOT}/scripts/session-learning-extractor.py` but the file doesn't exist there.
2. `session-end-peer-memory.py` is a no-op placeholder.
3. `recall_agent_context.py` is a reference template, not functional.
4. All hooks use `${CLAUDE_PLUGIN_ROOT}` — needs replacement for npx model.

---

## 5. Skills and Commands

### Skills (2)

| Skill | File | Purpose | Status |
|-------|------|---------|--------|
| init | skills/init/SKILL.md | Set up peer-orchestra in a project | COMPLETE — step-by-step instructions |
| theme-switch | skills/theme-switch/SKILL.md | Switch agent theme packs | COMPLETE — step-by-step instructions |

Both are instruction-based skills (no code) — they tell Claude what to do, not executable scripts.

### Commands (4)

| Command | File | Purpose | Status |
|---------|------|---------|--------|
| /dispatch | commands/dispatch.md | Send structured task to agent | COMPLETE — protocol format |
| /orchestra-status | commands/orchestra-status.md | Show who's online, what they're doing | COMPLETE |
| /archon-council | commands/archon-council.md | 7-Archon strategic debate | COMPLETE — detailed format |
| /party | commands/party.md | Spawn pre-configured team | COMPLETE — 5 party definitions |

All commands are markdown instruction files — they guide Claude behavior, no executable code.

---

## 6. src/index.js — CLI Behavior

**Entry point:** `#!/usr/bin/env node`, registered as `peer-orchestra` bin in package.json.

**Only command:** `peer-orchestra init [--theme <theme>] [--dir <path>]`

**What it does (interactive wizard):**
1. Asks for orchestrator name (interactive readline prompt)
2. Copies theme agent files to `.claude/rules/`
3. Copies common rule templates to `.claude/rules/`
4. Creates `.claude/agent-memory/` directory + adds to .gitignore
5. Copies hook templates to `.claude/hooks/`
6. Generates `.claude/settings.json` with hooks + homunculus plugin
7. Merges CLAUDE.md with orchestrator template
8. Optionally installs BMAD (references `_bmad` template — doesn't exist in repo)

**Issues:**
- Prints "Peer Orchestra v0.1.0" — hardcoded, doesn't read from package.json
- References BMAD template at `src/templates/bmad/` — directory doesn't exist
- Interactive readline prompt won't work in non-TTY (CI, piped input)
- No `--dry-run` flag
- No uninstall/remove command
- No version command
- Hook paths in generated settings.json use relative paths (`python3 .claude/hooks/...`) — correct for npx model
- Plugin hooks.json uses `${CLAUDE_PLUGIN_ROOT}` — only relevant for plugin model

---

## 7. package.json State

```json
{
  "name": "peer-orchestra",
  "version": "0.1.0",
  "bin": { "peer-orchestra": "src/index.js" },
  "main": "src/index.js",
  "engines": { "node": ">=18.0.0" },
  "author": "Varun Moka",
  "license": "MIT",
  "repository": "https://github.com/varunmoka7/peer-orchestra.git"
}
```

**Issues for npx release:**
- No dependencies listed (none needed currently — pure Node.js stdlib)
- `repository` URL points to `varunmoka7` but plugin.json points to `GoCarbonTracker` org — inconsistent
- No `files` field — .npmignore handles it instead
- No `description` in package.json (it exists but matches the plugin description)
- No `prepublishOnly` or validation scripts

> **Resolved (2026-08-27):** the repo was transferred to `varunmoka7`, `.claude-plugin/plugin.json` has since been removed as part of the plugin -> npx migration, and `package.json`'s `repository.url` was corrected to `https://github.com/varunmoka7/peer-orchestra.git`. This section is left unedited as a historical record of the org/URL inconsistency at the time of this audit.

---

## 8. plugin.json State (`.claude-plugin/plugin.json`)

```json
{
  "name": "peer-orchestra",
  "version": "1.0.0",
  "description": "Multi-agent orchestration for Claude Code...",
  "author": { "name": "Varun Moka", "url": "https://github.com/varunmoka7" },
  "homepage": "https://github.com/GoCarbonTracker/peer-orchestra",
  "repository": "https://github.com/GoCarbonTracker/peer-orchestra",
  "license": "MIT",
  "userConfig": {
    "orchestrator_name": { ... },
    "theme": { ... }
  }
}
```

**Issues:**
- Version mismatch: plugin.json says 1.0.0, package.json says 0.1.0
- This entire file/directory is plugin-specific — irrelevant for npx model
- `userConfig` concept doesn't exist in npx — needs CLI flags instead

---

## 9. Tests

**Single test file:** `tests/scaffold-test.js` (130 lines)

**What it tests:**
- Runs `src/index.js init --theme genshin --dir <tmpdir>` with piped input
- Verifies: CLAUDE.md created, settings.json created, all 12 genshin agent files installed, common rules installed, hooks installed, settings.json has correct structure, homunculus plugin enabled, CLAUDE.md has orchestrator reference, no GCT-specific references leaked, each agent file has Identity/Role section

**Status:** COMPLETE and well-designed. Includes leak detection for GCT-specific references.

**Issues:**
- Doesn't test generic theme
- Doesn't test error cases (missing theme, existing files, etc.)
- Doesn't test session-learning-extractor (the most complex code)

---

## 10. Templates (src/templates/)

### Rules Templates (4 files)

| File | Lines | Status |
|------|-------|--------|
| agent-common.md | 44 | COMPLETE — peer protocol, self-learning, verification, shared rules |
| multi-agent-dispatch.md | 74 | COMPLETE — dispatch template, message types, retry limits |
| self-improvement.md | 38 | COMPLETE — correction loop, verification standard, lessons format |
| team-dispatch.md | 69 | COMPLETE — team patterns, anti-patterns, escalation rules |

### CLAUDE.md.template

Complete orchestrator instructions template with `{{ORCHESTRATOR_NAME}}` placeholder. Covers: dispatch protocol, agent roster, session management, self-learning system.

### MCP Template

`recall_agent_context.py` — reference implementation for pull-based memory recall. Not functional (imports commented out). Documents the concept of on-demand agent context loading.

---

## 11. Duplicate/Overlapping Content

| Content | Locations | Issue |
|---------|-----------|-------|
| Agent router | `scripts/agent-router.py` + `src/templates/hooks/agent-router.py` | Identical copies |
| Persona loader | `scripts/agent-persona-loader.py` + `src/templates/hooks/agent-persona-loader.py` | Identical copies |
| Session start memory | `scripts/session-start-peer-memory.py` + `src/templates/hooks/session-start-peer-memory.py` | Identical copies |
| Session end memory | `scripts/session-end-peer-memory.py` + `src/templates/hooks/session-end-peer-memory.py` | Identical copies |
| Agent personas | `agents/*.md` + `themes/genshin/agents/agent-*.md` | Similar but not identical — root agents are frontmatter-rich (subagent format), theme agents are simpler rules format |
| Orchestrator rules | `agents/paimon.md` + `themes/genshin/agents/agent-orchestrator.md` | Different detail levels — paimon.md is agent format, orchestrator.md is rules format with much more detail |

**Key distinction:** `agents/*.md` are subagent definition files (with YAML frontmatter: model, effort, maxTurns). `themes/*/agents/*.md` are rules files (plain markdown, no frontmatter). These serve different purposes in the plugin model but create confusion.

---

## 12. "Plugin" References That Need Updating

### Must Change (structural/code references)

| File | Line | Reference | Action |
|------|------|-----------|--------|
| `.claude-plugin/plugin.json` | entire file | Plugin manifest | REMOVE — not needed for npx |
| `hooks/hooks.json` | 9,20,24,35,39,50 | `${CLAUDE_PLUGIN_ROOT}/scripts/...` | REMOVE — plugin hooks file not needed for npx |
| `README.md` | 3 | "Multi-agent orchestration plugin for Claude Code" | Rewrite — "npx tool" |
| `README.md` | 6, 48 | `claude plugin install peer-orchestra` | Replace with `npx peer-orchestra init` |
| `README.md` | 13 | "Claude Code plugin" | Replace |
| `README.md` | 75 | "Plugin Commands" | Rename to "Commands" |
| `README.md` | 120-122 | Plugin architecture diagram | Remove `.claude-plugin/` from tree |
| `README.md` | 194 | "plugin adds alongside" | Rewrite |
| `skills/init/SKILL.md` | 16 | "from the plugin's themes/" | Rewrite for npx model |
| `skills/theme-switch/SKILL.md` | 13 | "from the plugin's themes/ directory" | Rewrite |
| `src/index.js` | 125 | "homunculus plugin" | Keep — this refers to Claude Code's homunculus plugin, not peer-orchestra as a plugin |
| `tests/scaffold-test.js` | 102 | "homunculus plugin enabled" | Keep — same reason |

### Keep As-Is (refers to other plugins, not peer-orchestra-as-plugin)

| File | Line | Reference | Reason |
|------|------|-----------|--------|
| Agent files | various | "plugins" in abilities | Refers to Claude Code plugins in general |
| `src/index.js` | 111-120 | `plugins: { homunculus: true }` | Configures homunculus as a dependency |

---

## 13. What's Complete vs Placeholder

### Complete and Functional

- All 16 agent persona files (well-written, consistent format)
- All 4 commands (detailed protocol docs)
- Both skills (step-by-step instructions)
- 4 rule templates (dispatch, teams, self-improvement, common rules)
- CLAUDE.md template
- src/index.js init wizard (works end-to-end)
- scaffold-test.js (runs, verifies structure)
- session-learning-extractor.py (390 lines, full implementation)
- agent-router.py (keyword matching)
- agent-persona-loader.py (identity resolution)
- session-start-peer-memory.py (lessons recall)
- Genshin theme (12 complete agent files)
- Generic theme (12 agent files, less detailed)
- Research summary doc

### Placeholder / Incomplete

- `session-end-peer-memory.py` — no-op `pass`
- `recall_agent_context.py` — template with commented imports
- BMAD integration — `src/index.js` references `src/templates/bmad/` which doesn't exist
- Future themes (Naruto, Marvel, DC) — mentioned in README, none exist
- Generic theme orchestrator — much less detailed than Genshin version
- `scripts/` missing `session-learning-extractor.py` — hooks.json references it but file not there

### Not Started

- `--dry-run` flag for init
- Uninstall command
- Version command
- Status dashboard (beyond the command doc)
- Growth-to-rule promotion
- Event-driven inter-agent communication
- Smart routing with confidence scores
- Theme marketplace

---

## 14. Prior Research

`docs/research/2026-04-05/sangam-peer-orchestra-research-summary.md` contains a detailed roadmap:

**P1 (Launch-Critical):** Install robustness, memory recall quality, status dashboard, growth-to-rule promotion, narrative persona blocks, mature example.

**P2 (Intelligence Upgrades):** Event-driven communication, smart routing, extended themes, example maturity package.

**P3 (Growth Differentiators):** Auto-growth digest, character interaction protocols, theme marketplace, observability dashboard.

**Key insight from research:** "The moat is personality + persistent memory + specialization growth + explainable orchestration." Sequence: reliability -> visibility -> intelligence -> expansion.

---

## 15. Summary for Product Brief

**What exists:** A working scaffolding tool (npx-ready via `bin` in package.json) that sets up a multi-agent orchestration framework in any Claude Code project. 16 themed agent personas, structured dispatch protocol, team patterns, self-learning hooks, and a 390-line session learning extractor.

**What's strong:** Agent persona quality, dispatch protocol design, team pattern documentation, the Archon Council concept, and the session-learning-extractor implementation.

**What needs work for public release:** Plugin-to-npx pivot (remove .claude-plugin/, rewrite README), missing session-learning-extractor in scripts/, placeholder session-end hook, BMAD template reference to nonexistent directory, generic theme parity, version consistency, CLI robustness (--dry-run, uninstall, non-interactive mode).

**Core value prop:** Turn Claude Code terminals into a coordinated engineering team with themed personalities, structured communication, and agents that learn across sessions.
