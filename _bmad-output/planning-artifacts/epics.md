---
stepsCompleted: [1, 2]
inputDocuments:
  - _bmad-output/product-brief.md
  - _bmad-output/prd.md
  - _bmad-output/architecture.md
project_name: peer-orchestra
date: 2026-04-08
---

# peer-orchestra - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for peer-orchestra v0.1.0 public release, decomposing the PRD's 9-point Definition of Done and Architecture's 10-step implementation priority into 10 implementable stories across 2 sprints.

## Requirements Inventory

### Functional Requirements

FR1: `npx peer-orchestra init` interactive wizard completes on fresh project in < 30 seconds
FR2: Non-interactive mode (`--theme`, `--name`, `--no-interactive`) works for CI
FR3: `--dry-run` flag shows what would be installed without writing files
FR4: `--force` flag overwrites existing files
FR5: `--version` flag prints version from package.json
FR6: Zero references to `.claude-plugin/`, `plugin.json`, `${CLAUDE_PLUGIN_ROOT}`, or "Claude Code plugin" in any installed file
FR7: All 5 hooks functional (no placeholders, no no-ops)
FR8: session-end-peer-memory.py placeholder removed; learning extractor covers its function
FR9: Memory pipeline end-to-end: extract corrections -> store in per-agent SQLite -> recall at session start
FR10: Genshin and Generic orchestrators both at full parity (session modes, quality gates, synthesis protocol, retry limits, context budget, pushback handling, team dispatch checklist, dispatch sizing)
FR11: Scaffold test passes for both Genshin and Generic themes
FR12: GCT leak detection passes (zero GoCarbonTracker references in scaffolded files)
FR13: Settings.json merge preserves existing user hooks/plugins
FR14: CLAUDE.md merge appends orchestrator instructions (idempotent)
FR15: .gitignore updated with `.claude/agent-memory/`
FR16: README rewritten for npx model (< 2 min to first dispatch)
FR17: BMAD integration optional — scaffolds `_bmad/` when enabled
FR18: Commands converted from plugin format to CLAUDE.md instructions

### NonFunctional Requirements

NFR1: Node.js >= 18.0.0, zero npm dependencies (pure stdlib)
NFR2: Python 3.10+ for hooks (typing syntax)
NFR3: Hook scripts must never crash Claude Code — try/except with graceful fallback
NFR4: No secrets in scaffolded files
NFR5: SQLite WAL mode for concurrent access safety
NFR6: Agent persona files < 150 lines to minimize context budget impact
NFR7: Exit codes: 0 success, 1 error, 2 missing flags, 3 theme not found, 4 not writable
NFR8: Works on macOS, Linux, Windows (WSL)

### Additional Requirements

- AR1: DELETE `.claude-plugin/`, `agents/`, `scripts/`, `skills/`, `hooks/hooks.json` (plugin artifacts)
- AR2: DELETE `session-end-peer-memory.py` from templates (no-op placeholder)
- AR3: `themes/{theme}/agents/` is the single canonical source for agent files
- AR4: Archon agents live in `themes/genshin/archons/` — not installed as rules
- AR5: Lore pipeline excluded from npm package (.npmignore)
- AR6: Init idempotency: CLAUDE.md marker check, settings.json merge, .gitignore dedup
- AR7: Hook I/O: JSON on stdin, JSON on stdout
- AR8: `package.json` needs description, keywords, files field
- AR9: `src/templates/bmad/` directory needs creation

### FR Coverage Map

| Requirement | Story |
|-------------|-------|
| FR1 | STORY-002, STORY-006 |
| FR2 | STORY-002 |
| FR3 | STORY-002 |
| FR4 | STORY-002 |
| FR5 | STORY-002 |
| FR6 | STORY-001 |
| FR7 | STORY-004 |
| FR8 | STORY-001, STORY-004 |
| FR9 | STORY-004 |
| FR10 | STORY-003 |
| FR11 | STORY-007 |
| FR12 | STORY-007 |
| FR13 | STORY-006 |
| FR14 | STORY-006 |
| FR15 | STORY-006 |
| FR16 | STORY-008 |
| FR17 | STORY-005 |
| FR18 | STORY-005, STORY-008 |

## Epic List

1. **EPIC-V010-PUBLIC-RELEASE** — peer-orchestra v0.1.0 Public Release (10 stories, 2 sprints)

## Epic 1: peer-orchestra v0.1.0 Public Release

Ship peer-orchestra as a public npx tool on npm. Transform the brownfield codebase from plugin to npx, achieve theme parity, complete the self-learning pipeline, and publish.

**Sprint 1 — Foundation & Cleanup:** STORY-001 through STORY-005
**Sprint 2 — Quality & Ship:** STORY-006 through STORY-010

See `epics/v010-public-release/epic-overview.md` for full sprint plan and story details.
See `epics/v010-public-release/STORY-*.md` for individual story specifications.
