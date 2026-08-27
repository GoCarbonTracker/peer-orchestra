#!/usr/bin/env python3
"""Loads agent persona on session start based on environment or .peer-identity file — SessionStart Hook"""

import json
import os
import sys
from pathlib import Path


PROJECT_ROOT = Path.cwd()


def get_agent_identity() -> str:
    """Determine which agent this terminal is. Priority: env var > file > default."""
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return agent

    identity_file = PROJECT_ROOT / ".peer-identity"
    if identity_file.exists():
        return identity_file.read_text().strip()

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
