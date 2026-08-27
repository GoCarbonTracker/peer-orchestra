# BMAD Method — Peer Orchestra Integration

This is a minimal BMAD v6 scaffold installed by `npx peer-orchestra init --bmad`.

## What This Provides

BMAD gives your agent orchestra structured coding discipline:

1. **Epic** — define what you're building
2. **Story** — break it into implementable pieces
3. **Readiness Check** — validate before coding
4. **Implement** — agents execute with discipline
5. **Verify** — quality gate before shipping

## Usage

With BMAD enabled, your orchestrator follows this workflow:
- Never dispatch code work without stories
- Stories need acceptance criteria and test plans
- Quality gates must pass before marking done

## Full BMAD Method

For the complete BMAD v6 tooling (workflows, templates, skills), install the BMAD npm package:

```bash
npx bmad-method init
```

This scaffold provides the project structure. The full BMAD package provides the workflows.

## Directory Structure

```
_bmad/
  config.yaml           # BMAD configuration
  README.md             # This file
_bmad-output/
  planning-artifacts/
    plans/
      STATUS.md         # Project status tracker
    epics/              # Epic directories
    lessons.md          # Cross-session lessons
  implementation-artifacts/
```
