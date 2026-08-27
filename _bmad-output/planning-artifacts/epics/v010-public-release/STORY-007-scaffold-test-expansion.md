---
story: STORY-007
epic: EPIC-V010-PUBLIC-RELEASE
title: "Scaffold Test Expansion"
sprint: 2
priority: P0
effort: M
status: planned
assigned: TBD
dependencies: [STORY-003, STORY-004, STORY-006]
traces_to: [FR11, FR12, NFR7]
---

# STORY-007: Scaffold Test Expansion

**As a** maintainer of peer-orchestra,
**I want** comprehensive scaffold tests for both themes, hook verification, and leak detection,
**So that** every release is validated automatically before npm publish.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `tests/scaffold-test.js` | MODIFY | Add Generic theme test, hook presence verification, merge idempotency tests |
| `tests/extractor-test.js` | CREATE | Unit tests for session-learning-extractor |
| `package.json` | MODIFY | Add `"test": "node --test tests/"` script |

## Acceptance Criteria

**Scaffold tests:**
- [ ] Genshin theme: all 12 agent files installed, correct structure
- [ ] Generic theme: all 12 agent files installed, correct structure
- [ ] Common rules: all 4 rule files installed (agent-common.md, multi-agent-dispatch.md, self-improvement.md, team-dispatch.md)
- [ ] Hooks: all 4 hook files installed (agent-router.py, agent-persona-loader.py, session-start-peer-memory.py, session-learning-extractor.py)
- [ ] settings.json: correct hook configuration, homunculus plugin enabled
- [ ] CLAUDE.md: orchestrator instructions present
- [ ] .gitignore: `.claude/agent-memory/` entry present
- [ ] Agent files have Identity and Role sections
- [ ] GCT leak detection: zero matches for "GoCarbonTracker", "go-carbon-insights", "GCT", "varunmoka" (case-insensitive) in any scaffolded file
- [ ] No "plugin" references in scaffolded files

**Extractor tests:**
- [ ] Creates SQLite DB from mock transcript
- [ ] Detects correction patterns
- [ ] Deduplication works (no duplicates on re-run)
- [ ] Handles missing transcript gracefully (exit 0)
- [ ] Handles empty transcript gracefully

**Merge/idempotency tests:**
- [ ] Running init twice produces no duplicate hooks in settings.json
- [ ] Running init twice produces no duplicate CLAUDE.md sections

**npm test:**
- [ ] `npm test` runs all tests and exits with code 0
- [ ] `package.json` has `"test"` script configured

## Test Plan

- `npm test` — all tests green
- Manually inspect test output for clear pass/fail reporting
- Verify tests run in < 30 seconds total

## Notes

The existing `scaffold-test.js` (130 lines) already tests Genshin theme and leak detection. Extend it rather than rewriting. The extractor test is new — create `tests/extractor-test.js` with mock JSONL data.
