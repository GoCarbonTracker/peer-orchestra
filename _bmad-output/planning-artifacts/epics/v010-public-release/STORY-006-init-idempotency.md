---
story: STORY-006
epic: EPIC-V010-PUBLIC-RELEASE
title: "Init Idempotency & Merge Logic"
sprint: 2
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: [STORY-002, STORY-004]
traces_to: [FR1, FR13, FR14, FR15, AR6]
---

# STORY-006: Init Idempotency & Merge Logic

**As a** developer running init in a project with existing Claude Code config,
**I want** peer-orchestra to merge cleanly with my existing settings,
**So that** my custom hooks, plugins, and CLAUDE.md content are preserved.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/index.js` | MODIFY | Implement merge logic for settings.json, CLAUDE.md, .gitignore |

## Acceptance Criteria

**settings.json merge:**
- [ ] If `settings.json` exists, hooks arrays are MERGED (appended), not overwritten
- [ ] Existing plugins config is preserved
- [ ] Existing user hooks (non-peer-orchestra) remain untouched
- [ ] If `settings.json` doesn't exist, created from scratch

**CLAUDE.md merge:**
- [ ] Checks for `# Peer Orchestra` marker before appending
- [ ] If marker found, SKIPS append (idempotent)
- [ ] If no marker, appends orchestrator instructions below existing content
- [ ] Existing CLAUDE.md content is fully preserved

**.gitignore merge:**
- [ ] Checks for `.claude/agent-memory` before appending
- [ ] If already present, SKIPS (no duplicate lines)
- [ ] If not present, appends `.claude/agent-memory/`

**Agent files (re-init / theme switch):**
- [ ] `.claude/rules/agent-*.md` files are OVERWRITTEN on re-init (supports theme switching)
- [ ] `.claude/rules/` non-agent files (agent-common.md, multi-agent-dispatch.md, etc.) are also overwritten

**General:**
- [ ] Running init twice produces identical results to running once
- [ ] Running init with different theme replaces agent files but preserves non-theme config
- [ ] Error mid-init shows clear message and does NOT leave partial state

## Test Plan

1. Create a project with existing `settings.json` containing custom hooks
2. Run init — verify custom hooks preserved alongside peer-orchestra hooks
3. Run init again — verify no duplicate hooks in settings.json
4. Create a project with existing CLAUDE.md content
5. Run init — verify existing content preserved, orchestrator section appended
6. Run init again — verify no duplicate orchestrator section
7. Create a project with existing .gitignore
8. Run init — verify `.claude/agent-memory/` added once
9. Run init again — verify no duplicate .gitignore entries
10. Run init with `--theme genshin`, then with `--theme generic` — verify agent files switched

## Notes

This is the story most likely to cause user frustration if done wrong. A user who runs init and loses their existing settings.json hooks will not trust the tool. Test the merge paths thoroughly.
