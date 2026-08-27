# Contributing

## Setup

```bash
git clone https://github.com/varunmoka7/peer-orchestra.git
cd peer-orchestra
```

No install step — this is a zero-dependency Node CLI. `src/index.js` runs on Node's built-in `fs`, `path`, `readline`, and `child_process` modules only. The scaffolded hooks (`src/templates/hooks/*.py`) use only the Python standard library — no `pip install` needed to run or test them, just Python 3.8+ on `PATH`.

## Running Tests

```bash
npm test
```

This runs two suites:
- `tests/scaffold-test.js` — runs `peer-orchestra init` against temp directories with both themes, checks the full file structure, merge idempotency (re-running doesn't duplicate hooks/plugins/CLAUDE.md sections), `--force` overwrite behavior, BMAD scaffolding, and scans output for accidentally leaked project-specific references.
- `tests/extractor-test.js` — exercises `session-learning-extractor.py` directly against a mock session transcript: pattern detection (corrections, quality gates, pushback), SQLite schema, deduplication on re-run, and graceful handling of missing/malformed input.

Both need `python3` on `PATH` (the extractor test shells out to it). CI runs this on Node 18/20/22 with Python 3 available — see `.github/workflows/ci.yml`.

## File Layout

```
src/index.js              # CLI entry point — the init/uninstall wizard
src/templates/             # Files scaffolded into a target project
  hooks/                    # Self-learning hook scripts (Python stdlib)
  rules/                    # Dispatch protocol + common rules, theme-independent
  bmad/                     # Minimal BMAD workflow scaffold (--bmad flag)
  mcp/                      # claude-peers memory-recall helper script
  CLAUDE.md.template        # Orchestrator instructions merged into the target project
themes/
  genshin/agents/           # 12 Genshin persona files
  genshin/archons/          # 4 Archon persona files (genshin-only)
  generic/agents/           # 12 role-based persona files
commands/                  # 4 slash commands, installed to .claude/commands/
tests/                     # scaffold-test.js + extractor-test.js
docs/                      # User-facing guides (not code — read before changing behavior they document)
```

If you change what `init` or `uninstall` writes, update `README.md`'s "What Gets Installed" table and `docs/quick-start.md` in the same change — they list every path by hand and will drift silently otherwise.

## Adding a Theme

See the [theme creation guide](docs/theme-creation-guide.md) for the full persona file format, the orchestrator's required sections, and the theme submission checklist. Short version: 12 agent files under `themes/your-theme/agents/`, run `npm test` before opening a PR (the scaffold test validates structure and checks for leaked references), and keep each persona file under ~150 lines since it's loaded into the agent's context window.

## Pull Requests

- Keep changes focused — one concern per PR.
- Run `npm test` locally before pushing; CI runs the same suite on Node 18/20/22.
- If you're changing hook behavior, check `docs/hooks-guide.md` for claims that describe the old behavior and update them in the same PR.
