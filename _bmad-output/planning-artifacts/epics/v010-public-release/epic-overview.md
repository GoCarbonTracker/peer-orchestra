---
epic: EPIC-V010-PUBLIC-RELEASE
title: "peer-orchestra v0.1.0 Public Release"
status: planned
priority: P0
stories: 10
sprints: 2
created: 2026-04-08
author: Furina (dispatched by MOKA)
traceability:
  product_brief: _bmad-output/product-brief.md
  prd: _bmad-output/prd.md
  architecture: _bmad-output/architecture.md
---

# Epic: peer-orchestra v0.1.0 Public Release

## Goal

Ship peer-orchestra as a public npx tool on npm. Transform the existing brownfield codebase (68 files, plugin format) into a clean npx scaffolding tool that passes all 9 v1 Definition of Done criteria.

## Definition of Done (from PRD)

All 9 must pass before `npm publish`:

1. `npx peer-orchestra init` works cleanly (interactive + non-interactive)
2. No "plugin" references in any installed file
3. README < 2 min to first dispatch
4. All hooks work (no placeholders)
5. Memory pipeline end-to-end (extract -> SQLite -> recall)
6. 2 themes at parity (Genshin + Generic orchestrators match depth)
7. npm test passes (both themes, leak detection, hook presence)
8. No GCT leaks
9. Published to npm

## Sprint Plan

### Sprint 1: Foundation & Cleanup (Stories 1-5)

**Goal:** Clean codebase, fix CLI, achieve theme parity, implement all hooks.

| Story | Title | Effort | Priority | Dependencies |
|-------|-------|--------|----------|-------------|
| STORY-001 | Delete Plugin Artifacts | S | P0 | None |
| STORY-002 | CLI Hardening | M | P0 | STORY-001 |
| STORY-003 | Generic Theme Parity | M | P1 | STORY-001 |
| STORY-004 | Hook Pipeline Completion | L | P0 | STORY-001 |
| STORY-005 | BMAD Scaffold | M | P1 | STORY-001 |

### Sprint 2: Quality & Ship (Stories 6-10)

**Goal:** Tests, docs, package config, publish.

| Story | Title | Effort | Priority | Dependencies |
|-------|-------|--------|----------|-------------|
| STORY-006 | Init Idempotency & Merge Logic | M | P0 | STORY-002, STORY-004 |
| STORY-007 | Scaffold Test Expansion | M | P0 | STORY-003, STORY-004, STORY-006 |
| STORY-008 | README Rewrite | M | P1 | STORY-002 |
| STORY-009 | Package.json & npmignore | S | P1 | STORY-007 |
| STORY-010 | npm Publish & Smoke Test | S | P0 | ALL |

## Requirements Coverage Map

| Requirement | Story |
|-------------|-------|
| FR1 (init wizard < 30s) | STORY-002, STORY-006 |
| FR2 (non-interactive mode) | STORY-002 |
| FR3 (--dry-run) | STORY-002 |
| FR4 (--force) | STORY-002 |
| FR5 (--version) | STORY-002 |
| FR6 (zero plugin refs) | STORY-001 |
| FR7 (all hooks functional) | STORY-004 |
| FR8 (remove placeholder hook) | STORY-001, STORY-004 |
| FR9 (memory pipeline e2e) | STORY-004 |
| FR10 (theme parity) | STORY-003 |
| FR11 (scaffold test both themes) | STORY-007 |
| FR12 (GCT leak detection) | STORY-007 |
| FR13 (settings.json merge) | STORY-006 |
| FR14 (CLAUDE.md merge) | STORY-006 |
| FR15 (.gitignore update) | STORY-006 |
| FR16 (README rewrite) | STORY-008 |
| FR17 (BMAD integration) | STORY-005 |
| FR18 (commands conversion) | STORY-005, STORY-008 |
| NFR1-8 (all) | Cross-cutting, verified in STORY-007, STORY-010 |
| AR1 (delete plugin artifacts) | STORY-001 |
| AR2 (remove placeholder hook) | STORY-001 |
| AR3 (canonical theme source) | STORY-001 |
| AR4 (archon agents placement) | STORY-003 |
| AR5 (lore pipeline excluded) | STORY-009 |
| AR6 (init idempotency) | STORY-006 |
| AR7 (hook I/O format) | STORY-004 |
| AR8 (package.json fields) | STORY-009 |
| AR9 (BMAD scaffold) | STORY-005 |

## Effort Summary

- **Small (S):** 2 stories
- **Medium (M):** 6 stories
- **Large (L):** 1 story
- **Sprint 1:** 5 stories (foundation)
- **Sprint 2:** 5 stories (quality + ship)
- **Total:** 10 stories
