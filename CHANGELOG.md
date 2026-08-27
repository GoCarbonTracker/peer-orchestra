# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-08-27

0.1.0 was never published to npm — this is the first public release. Everything below reflects work done since the plugin-to-npx pivot.

### Added
- `peer-orchestra uninstall` command — removes everything `init` installed (persona files, hooks, slash commands, `.claude/agent-memory/`, the hook entries and homunculus flag it added to `.claude/settings.json`, the `.gitignore` line, and the `# Peer Orchestra` block in `CLAUDE.md`). Prompts for confirmation unless `--force`/`--no-interactive` is passed; `--dry-run` previews the plan without deleting anything. Uses a small state file (`.claude/.peer-orchestra.json`) recorded at install time so it removes exactly the theme's files, not a guess.
- Preflight checks before any file is written: hard-fails if Node < 18 or if an existing `.claude/settings.json` isn't valid JSON; warns (without blocking) if no Python 3.8+ interpreter is found on `PATH`, since the hooks won't run without one.
- Interactive theme prompt — `init` now asks which theme to install when `--theme` isn't passed and the session is a real TTY. Previously it silently defaulted to `genshin` with no prompt.
- BMAD scaffold now substitutes `{{PROJECT_NAME}}` and `{{USER_NAME}}` into `_bmad/config.yaml` and `_bmad/README.md` instead of leaving the literal placeholders in the file.
- `.github/workflows/ci.yml` — runs `npm test` on push and PR, on Node 18/20/22, with Python 3 available (the extractor test suite exercises the Python hooks directly).
- `CONTRIBUTING.md` and this changelog.

### Fixed
- **Data loss on re-init:** three `copyDir` calls in the scaffolder hardcoded `force: true` while `--help` promised existing files would be skipped with a warning. A second `init` run silently overwrote any persona or hook file a user had hand-edited. All copy calls now honor `--force` correctly; a Suite 5 regression test in `tests/scaffold-test.js` verifies edited files survive a plain re-run and are only overwritten with `--force`.
- **Half-scaffold on non-interactive/non-TTY stdin:** `init` previously called `rl.question()` even when stdin was piped or redirected, which never resolves after EOF and left the process hanging mid-scaffold. `init` now only enters interactive mode when stdin is an actual TTY; anything else (CI, `printf ... | node index.js`) is treated as non-interactive.
- Slash commands and the 4 genshin Archon personas were documented in `commands/` and `themes/genshin/archons/` but never copied into a project by `init` — `/dispatch`, `/party`, `/orchestra-status`, and `/archon-council` didn't exist after running the tool. Both are now wired into the copy step.
- Agent identity resolution (`PEER_AGENT` env var → `.peer-identity` file → `orchestrator` default) had no bound on what it accepted, so a value containing `../` could be used to read files outside `.claude/rules/` or `.claude/agent-memory/`. Both hooks now sanitize the resolved name down to `[A-Za-z0-9_-]`, capped at 64 characters, before using it in a path.
- Agent router keyword extraction: `## Abilities` bullets were split into raw, mixed-case, unpunctuated word fragments, so `API.` and `api` never matched the same prompt text, and repeated words inflated an agent's match score. Keywords are now lowercased, stripped of punctuation, and deduplicated. Archon persona files (`## In Archon Council` section, no `## Abilities`) were being silently absorbed into the default keyword routes as if they were incomplete domain agents — they're now explicitly skipped, since they're for `/archon-council` debates, not task dispatch.
- `session-learning-extractor.py`'s FTS5 index insert used `INSERT OR IGNORE INTO memories_fts(id, insight)` against a contentless-style virtual table declared with `content_rowid='rowid'` — that requires the `rowid` column to be supplied explicitly (via `last_insert_rowid()`) or every insert after the first silently fails to index. Full-text search over saved memories was broken from the first commit that added it.
- Switching themes via `init --theme <other> --force` left both themes' persona files coexisting in `.claude/rules/` — the old theme's files were never removed, only the new theme's were added on top. `init` now records the installed theme in a small state file and removes the prior theme's persona files first when it detects a switch.

### Changed
- `session-learning-extractor.py` no longer registers on `PreCompact`. It fires repeatedly within one session, and the script re-read the entire transcript from byte zero on every firing with no offset tracking — on a long session that meant re-parsing an ever-growing transcript for patterns it had already saved. It now only runs on `SessionEnd`, which means a terminal killed uncleanly (not properly ended) can still lose that session's lessons — there's no fallback for that case yet.
- Every generated hook entry in `.claude/settings.json` now has an explicit `timeout: 10` (seconds); previously none did, so a hung hook could stall a session indefinitely.
- `agent-router.py`'s hook command no longer relies on `"$PROMPT"` shell interpolation on the command line — it reads the prompt from the JSON payload Claude Code sends on stdin, which is what the hook was already parsing.
- Hook scripts' type hints were converted from PEP 604/585 syntax (`list[str]`, `X | None`) to `typing` module equivalents (`List[str]`, `Optional[X]`) — the newer syntax requires Python 3.9/3.10+, and raised a `SyntaxError` at parse time on 3.8, which bypassed each hook's own try/except error handling entirely (a crash before the hook body even runs).

### Removed
- `docs/hooks-masterclass.md` — documented 29 hooks from an unrelated private project; `docs/hooks-guide.md` already covers the 4 hooks this tool actually ships.
- References to an unbuilt "lore pipeline" feature from differentiator lists.
- Remaining references to the private project this tool was originally extracted from.
