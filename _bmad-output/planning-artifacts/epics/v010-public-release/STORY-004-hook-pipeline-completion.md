---
story: STORY-004
epic: EPIC-V010-PUBLIC-RELEASE
title: "Hook Pipeline Completion"
sprint: 1
priority: P0
effort: L
status: planned
assigned: TBD
dependencies: [STORY-001]
traces_to: [FR7, FR8, FR9, AR7, NFR3, NFR5]
---

# STORY-004: Hook Pipeline Completion

**As a** developer using peer-orchestra agents,
**I want** the full self-learning pipeline to work end-to-end,
**So that** corrections I make in session N are automatically recalled in session N+1.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `src/templates/hooks/session-learning-extractor.py` | VERIFY/FIX | Already 390 lines — verify it produces valid SQLite output, handles missing transcripts gracefully |
| `src/templates/hooks/session-start-peer-memory.py` | VERIFY/FIX | Verify it reads from per-agent SQLite DBs (not just lessons.md) |
| `src/templates/hooks/agent-persona-loader.py` | VERIFY | Confirm agent identity resolution from `PEER_AGENT` env or `.peer-identity` file |
| `src/templates/hooks/agent-router.py` | VERIFY | Confirm keyword routing outputs correct JSON format |

## Acceptance Criteria

- [ ] `session-learning-extractor.py` runs on SessionEnd and PreCompact events without crashing
- [ ] Extractor parses JSONL transcripts and detects: corrections, quality gate outcomes, peer pushback
- [ ] Extractor stores patterns in `.claude/agent-memory/{agent}.db` SQLite database
- [ ] SQLite schema matches architecture spec: `memories` table with id, agent, topic, insight, memory_type, cognitive_type, confidence, importance, source_session, tags, created_at, superseded_by
- [ ] SQLite uses WAL mode for concurrent access safety
- [ ] FTS5 index on `insight` column for full-text search
- [ ] Deduplication: re-running extractor on same session produces no duplicate entries (keyed by session+topic+agent)
- [ ] `session-start-peer-memory.py` reads from per-agent SQLite and injects lessons as context
- [ ] Memory recall filters by current agent identity (not all agents' memories)
- [ ] All hooks output valid JSON on stdout: `{"hookEventName": "...", "message": "..."}`
- [ ] All hooks wrap in try/except — never crash Claude Code on error
- [ ] If transcript not found: exit 0 silently
- [ ] If SQLite write fails: log to stderr, exit 0

## Test Plan

**Unit tests (new file: `tests/extractor-test.js`):**
- Create a mock JSONL transcript with known correction patterns
- Run extractor against it
- Verify SQLite DB created with expected entries
- Run extractor again — verify no duplicates
- Test with empty/missing transcript — verify graceful exit

**Integration test (manual):**
1. Run `npx peer-orchestra init` in a test project
2. Start a Claude Code session as an agent
3. Make a correction ("don't use var, use const")
4. End session
5. Start new session as same agent
6. Verify the correction appears in session start context

**Hook I/O verification:**
- Pipe sample JSON to each hook's stdin
- Verify stdout is valid JSON with `hookEventName` field
- Verify stderr is empty on success
- Verify exit code 0 on all normal paths

## Notes

This is the largest story — the crown jewel of peer-orchestra. The session-learning-extractor.py already exists (390 lines) but has never been tested against the installed hook path. Key risk: the JSONL transcript format is undocumented Claude Code internal format that may change. Build defensively.

The `session-end-peer-memory.py` placeholder was deleted in STORY-001. Its function is fully covered by `session-learning-extractor.py` running on SessionEnd.
