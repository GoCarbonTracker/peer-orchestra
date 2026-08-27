---
story: STORY-009
epic: EPIC-V010-PUBLIC-RELEASE
title: "Package.json & npmignore"
sprint: 2
priority: P1
effort: S
status: planned
assigned: TBD
dependencies: [STORY-007]
traces_to: [AR5, AR8, NFR1]
---

# STORY-009: Package.json & npmignore

**As a** maintainer preparing for npm publish,
**I want** package.json and .npmignore properly configured,
**So that** the published package is clean, discoverable, and excludes internal-only files.

## Files to Modify

| File | Action | Details |
|------|--------|---------|
| `package.json` | MODIFY | Add description, keywords, files, repository URL fix |
| `.npmignore` | MODIFY | Exclude tools/, tests/, docs/research/, _bmad-output/, .claude/ |

## Acceptance Criteria

**package.json:**
- [ ] `"description"` field set to a clear one-liner
- [ ] `"keywords"` array includes: claude-code, multi-agent, orchestration, ai-team, npx, claude-peers
- [ ] `"files"` field lists: src/, themes/, commands/, README.md, LICENSE
- [ ] `"repository"` URL points to correct GitHub org (consistent between package.json and any other references)
- [ ] `"engines": { "node": ">=18.0.0" }` present
- [ ] `"version": "0.1.0"` confirmed
- [ ] `"license": "MIT"` confirmed
- [ ] `"test"` script configured (from STORY-007)

**.npmignore:**
- [ ] Excludes: `tools/`, `tests/`, `docs/research/`, `_bmad-output/`, `.claude/`, `.github/`
- [ ] Includes: `src/`, `themes/`, `commands/`, `README.md`, `LICENSE`, `package.json`
- [ ] `npm pack --dry-run` shows only intended files
- [ ] No internal research docs, audit files, or BMAD artifacts in published package

## Test Plan

- `npm pack --dry-run` — review file list, verify no test/research/internal files
- `cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'description' in d; assert 'keywords' in d; assert 'files' in d"` — fields present
- Package size check: `npm pack` produces tarball < 500KB
- Install from local tarball: `npm install ./peer-orchestra-0.1.0.tgz -g && peer-orchestra --version`

## Notes

The `files` field in package.json is the whitelist approach (preferred over .npmignore blacklist). Use both for safety — `files` is the primary control, `.npmignore` is the fallback for anything `files` doesn't catch.

The lore pipeline (AR5) is explicitly excluded — it's an internal authoring tool, not shipped to users.
