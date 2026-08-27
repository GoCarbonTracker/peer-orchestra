---
story: STORY-001
epic: EPIC-V010-PUBLIC-RELEASE
title: "Delete Plugin Artifacts"
sprint: 1
priority: P0
effort: S
status: planned
assigned: TBD
dependencies: none
traces_to: [FR6, FR8, AR1, AR2, AR3]
---

# STORY-001: Delete Plugin Artifacts

**As a** contributor to peer-orchestra,
**I want** all Claude Code plugin artifacts removed from the codebase,
**So that** the repo is clean for npx-only distribution with no confusing legacy files.

## Files to Modify

| File/Directory | Action | Reason |
|---------------|--------|--------|
| `.claude-plugin/` | DELETE entirely | Plugin manifest not needed for npx |
| `hooks/hooks.json` | DELETE | Plugin hook config with `${CLAUDE_PLUGIN_ROOT}` paths |
| `agents/` | DELETE entirely | Plugin subagent format; replaced by `themes/` |
| `scripts/` | DELETE entirely | Incomplete duplicate of `src/templates/hooks/` |
| `skills/` | DELETE entirely | Plugin skills format; moves to CLAUDE.md template |
| `src/templates/hooks/session-end-peer-memory.py` | DELETE | No-op placeholder; learning extractor covers this |

## Acceptance Criteria

- [ ] `.claude-plugin/` directory no longer exists
- [ ] `hooks/hooks.json` no longer exists
- [ ] `agents/` directory (16 files) no longer exists
- [ ] `scripts/` directory (4 files) no longer exists
- [ ] `skills/` directory (2 skill folders) no longer exists
- [ ] `session-end-peer-memory.py` removed from `src/templates/hooks/`
- [ ] No file in the repo references `${CLAUDE_PLUGIN_ROOT}`
- [ ] No file references `.claude-plugin/` or `plugin.json`
- [ ] `git status` shows only deletions (no unintended modifications)
- [ ] Remaining code still references `themes/` as canonical agent source

## Test Plan

- `grep -r "CLAUDE_PLUGIN_ROOT" .` returns zero results
- `grep -r "claude-plugin" .` returns zero results (excluding git history)
- `grep -r "plugin.json" .` returns zero results (excluding package.json which has different context)
- `ls .claude-plugin agents scripts skills` all return "No such file or directory"
- `ls src/templates/hooks/` shows 4 files (no session-end-peer-memory.py)

## Notes

This is the foundation story. Every subsequent story depends on this cleanup being complete. The `agents/` directory contains richer YAML-frontmatter agent definitions that are NOT needed — `themes/` is the canonical source per Architecture Decision 2.
