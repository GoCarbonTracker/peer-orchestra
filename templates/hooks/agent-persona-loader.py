#!/usr/bin/env python3
"""Loads agent persona on session start based on environment or .peer-identity file — SessionStart Hook"""

import json
import os
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path.cwd()

# Personas are typically 2-4KB. Cap generously so a pathological file cannot
# flood the session context, while leaving normal personas untouched.
MAX_PERSONA_CHARS = 20000


def sanitize_agent_name(agent: str) -> str:
    """Strip anything but safe filename chars so `agent` can't escape the rules dir."""
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", agent)[:64]
    return cleaned or "orchestrator"


def get_agent_identity() -> str:
    """Determine which agent this terminal is. Priority: env var > file > default."""
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return sanitize_agent_name(agent)

    identity_file = PROJECT_ROOT / ".peer-identity"
    if identity_file.exists():
        lines = identity_file.read_text().splitlines()
        first_line = lines[0].strip() if lines else ""
        if first_line:
            return sanitize_agent_name(first_line)

    return "orchestrator"


def main() -> int:
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    agent = get_agent_identity()
    rel_path = f".claude/rules/agent-{agent.lower()}.md"
    agent_file = PROJECT_ROOT / ".claude" / "rules" / f"agent-{agent.lower()}.md"

    if not agent_file.exists():
        # No persona for this identity — say so, but don't fail the session.
        context = (
            f"No persona file found for '{agent}' (looked for {rel_path}). "
            "Running without a persona."
        )
    else:
        # Inject the persona ITSELF, not its filename. .claude/rules/ is not a
        # directory Claude Code auto-loads, so naming the file here would leave
        # the persona unread unless something later chose to open it.
        try:
            persona = agent_file.read_text(errors="replace").strip()
        except OSError as exc:
            context = f"Could not read {rel_path}: {exc}"
        else:
            if len(persona) > MAX_PERSONA_CHARS:
                persona = (
                    persona[:MAX_PERSONA_CHARS]
                    + f"\n\n[persona truncated at {MAX_PERSONA_CHARS} characters — "
                    f"see {rel_path} for the rest]"
                )
            context = (
                f"You are {agent}. The following persona is loaded from {rel_path} "
                f"and applies for this session.\n\n{persona}"
            )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({
            "hookEventName": "SessionStart",
            "message": f"Agent persona loader error (non-fatal): {e}",
        }), file=sys.stderr)
        sys.exit(0)
