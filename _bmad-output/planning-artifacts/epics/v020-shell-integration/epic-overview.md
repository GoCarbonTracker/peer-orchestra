---
epic: EPIC-V020-SHELL-INTEGRATION
title: "peer-orchestra v0.2.0 Shell Integration & Auto-Titled Tabs"
status: planned
priority: P1
stories: 5
sprints: 1
created: 2026-04-30
traceability:
  product_brief: _bmad-output/product-brief.md
  prd: _bmad-output/prd.md
  architecture: _bmad-output/architecture.md
---

# Epic: peer-orchestra v0.2.0 Shell Integration & Auto-Titled Tabs

## Goal

Eliminate the manual setup gap between `npx peer-orchestra init` and
"agents are launchable by name." Add a `setup-shell` command that
installs shell shortcuts (one per agent in the user's project) and
patches the host terminal's tab-title settings so every peer terminal
auto-displays its persona name.

After v0.1.0 ships, a user runs `npx peer-orchestra init` and gets the
agent files scaffolded — but they still have to remember to launch each
peer with an explicit env-var (`PEER_AGENT=<name> claude`) and their
tab titles still show generic shell numbers. v0.2.0 closes that gap so
the user types a one-word command (e.g. `<agent-name>`) and gets a
Claude Code session correctly tagged with that persona and a matching
tab title — across machines, accounts, and fresh installs.

## Definition of Done

All 8 must pass before tagging `v0.2.0`:

1. `npx peer-orchestra setup-shell` runs cleanly on a fresh machine
   (zsh + bash supported; fish optional).
2. Idempotent — running it twice leaves the rc file with a single
   guarded block (not two duplicates).
3. Reversible — `npx peer-orchestra setup-shell --uninstall` removes
   the block cleanly without touching surrounding user content.
4. `--dry-run` flag shows what would be written without modifying any
   files.
5. Detects `$TERM_PROGRAM`. For VS Code-family editors (Cursor, VS
   Code) auto-patches `settings.json`. For other terminals (Apple
   Terminal, iTerm2, Warp, Tabby, Hyper) prints per-terminal manual
   instructions instead of failing.
6. Auto-derives per-agent shortcuts from
   `<project>/.claude/rules/agent-*.md` — no hardcoded list. Adding a
   new agent rule file in the project gives an instant new shortcut
   on next shell start.
7. Tests cover the rc-file patcher (idempotency, marker boundaries,
   uninstall) and the editor-settings merger (preserves existing
   keys, replaces tab-title keys cleanly) using temp fixtures —
   never touching the real `~/.zshrc` during CI.
8. README + `docs/quick-start.md` updated so the canonical user
   journey is `init` → `setup-shell` → "type `<agent-name>`, see the
   agent's tab title".

## Sprint Plan

### Sprint 1: Build & Ship (Stories 1-5)

| Story | Title | Effort | Priority | Dependencies |
|-------|-------|--------|----------|-------------|
| STORY-001 | Shell Templates (zsh + bash snippets) | S | P0 | None |
| STORY-002 | Shell-RC Installer Utility (idempotent + reversible) | M | P0 | STORY-001 |
| STORY-003 | VS Code-family Editor Settings Patcher | M | P0 | None |
| STORY-004 | `setup-shell` Command + CLI Wiring | M | P0 | STORY-002, STORY-003 |
| STORY-005 | Tests + README + docs/quick-start update | M | P0 | STORY-001..004 |

Single-sprint epic. ~60-90 min implementation budget for a single
operator; can be split across peers if dispatched as a team.

## Non-Goals (explicitly out of scope for v0.2.0)

- **Fish shell support.** Add later if requested. Stub the templates
  dir for it but do not block ship.
- **Windows / WSL / PowerShell.** Out of scope. Document as known gap.
- **iTerm2 / Warp / Tabby auto-patching.** v0.2.0 prints manual
  instructions for these; auto-patching is a future epic if demand
  appears.
- **Auto-running `setup-shell` from `init`.** Keeping it as a separate
  opt-in command. Modifying user shell-rc files at `init` time would
  be invasive without explicit consent.

## Key Design Decisions

### D1: Env var name
**Decision:** `PEER_AGENT` is the canonical env var that identifies a
launched peer's persona to MCP servers, hooks, and downstream
tooling.
**Rationale:** Theme-agnostic, namespaced to peer-orchestra, and
predictable for downstream consumers.

### D2: rc-file patching strategy
**Decision:** Insert a guarded block between
`# >>> peer-orchestra >>>` and `# <<< peer-orchestra <<<` markers.
On re-run, the block is replaced atomically. On uninstall, the entire
block (including markers) is removed.
**Rationale:** Standard pattern (mirrors conda init, asdf, fnm). Safe
to re-run, cleanly reversible, easy for a user to inspect before
trusting.

### D3: Shortcut derivation
**Decision:** Read agent names from
`<project>/.claude/rules/agent-*.md`, NOT from peer-orchestra's
internal `themes/<theme>/agents/`. The reason: by the time
`setup-shell` runs, the user has already scaffolded a theme into their
project via `init` — those scaffolded files are the source of truth
for that user's setup.
**Rationale:** Honors per-project agent customization. If a user
removes an agent from their project, that shortcut shouldn't linger
on their machine.

### D4: Tab-title watchdog frequency
**Decision:** Background watchdog re-sends the OSC title escape on a
two-phase cadence: a fast burst (5 sends at 0.5s intervals) for the
first 2.5 seconds after launch, then a steady-state 2-second
re-send for the remainder of the session.
**Rationale:** Terminal user-interface programs frequently overwrite
the tab title during boot animations. The fast-burst phase wins the
race against startup-time clobbering; the steady-state phase keeps the
title stable across redraws and screen clears.

### D5: VS Code-family editor differentiation
**Decision:** Both Cursor and VS Code report `TERM_PROGRAM=vscode`.
Patch the same two settings keys for both, but write to whichever
`User/settings.json` is present on disk:

- Cursor:  `~/Library/Application Support/Cursor/User/settings.json`
- VS Code: `~/Library/Application Support/Code/User/settings.json`

If both exist, patch both. Linux paths fall under
`~/.config/<editor>/User/settings.json` and are detected the same way.
**Rationale:** Same fix works for both forks. Detection is by file
presence, not by env-var disambiguation (the env var doesn't
distinguish them).

### D6: Settings keys to write
**Decision:** For VS Code-family editors, the patcher writes:

```json
{
  "terminal.integrated.tabs.title": "${sequence}",
  "terminal.integrated.tabs.description": "${task}${separator}${cwdFolder}"
}
```

`${sequence}` is the editor's escape-sequence variable that surfaces
OSC title strings sent by the shell. Without this, the editor falls
back to its internal numbering scheme and ignores OSC escapes.
**Rationale:** Minimal patch surface. Two keys, both well-documented,
both reversible.

## Story Index

- [STORY-001 — Shell Templates](stories/STORY-001-shell-templates.md)
- [STORY-002 — Shell-RC Installer](stories/STORY-002-shell-rc-installer.md)
- [STORY-003 — VS Code-family Editor Settings Patcher](stories/STORY-003-editor-settings-patcher.md)
- [STORY-004 — `setup-shell` Command](stories/STORY-004-setup-shell-command.md)
- [STORY-005 — Tests + Docs](stories/STORY-005-tests-and-docs.md)
