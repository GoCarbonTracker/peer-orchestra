#!/usr/bin/env python3
"""Loads agent persona on session start based on environment or .peer-identity file — SessionStart Hook"""

import json
import os
import re
import sys
from pathlib import Path


PROJECT_ROOT = Path.cwd()


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
    agent_file = PROJECT_ROOT / ".claude" / "rules" / f"agent-{agent.lower()}.md"

    if agent_file.exists():
        message = f"Agent persona loaded: {agent} (rules: .claude/rules/agent-{agent.lower()}.md)"
    else:
        message = f"No persona file found for '{agent}'. Running as generic agent."

    print(json.dumps({
        "hookEventName": "SessionStart",
        "message": message,
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
