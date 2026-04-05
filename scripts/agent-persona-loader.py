#!/usr/bin/env python3
"""Loads agent persona on session start based on environment or .peer-identity file."""

import os
import sys


def get_agent_identity():
    """Determine which agent this terminal is. Priority: env var > file > default."""
    # 1. Environment variable
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return agent

    # 2. .peer-identity file in project root
    identity_file = os.path.join(os.getcwd(), ".peer-identity")
    if os.path.exists(identity_file):
        with open(identity_file) as f:
            return f.read().strip()

    # 3. Default: orchestrator
    return "orchestrator"


def main():
    agent = get_agent_identity()
    rules_dir = os.path.join(os.getcwd(), ".claude", "rules")
    agent_file = os.path.join(rules_dir, f"agent-{agent.lower()}.md")

    if os.path.exists(agent_file):
        print(f"Agent persona loaded: {agent}")
        print(f"Rules: .claude/rules/agent-{agent.lower()}.md")
    else:
        print(f"No persona file found for '{agent}' at {agent_file}")
        print("Running as generic agent. Create the rules file to customize behavior.")


if __name__ == "__main__":
    main()
