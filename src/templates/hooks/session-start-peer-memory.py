#!/usr/bin/env python3
"""Recalls past learnings for this agent on session start."""

import json
import os
import sys


def get_agent_name():
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return agent
    identity_file = os.path.join(os.getcwd(), ".peer-identity")
    if os.path.exists(identity_file):
        with open(identity_file) as f:
            return f.read().strip()
    return "orchestrator"


def main():
    agent = get_agent_name()
    lessons_file = os.path.join(os.getcwd(), ".claude", "lessons.md")

    if not os.path.exists(lessons_file):
        return

    with open(lessons_file) as f:
        content = f.read()

    # Filter lessons relevant to this agent
    lines = content.split("\n")
    relevant = [l for l in lines if agent.lower() in l.lower() or "all" in l.lower()]

    if relevant:
        print(f"Past learnings for {agent} (most recent 5):")
        for lesson in relevant[-5:]:
            print(f"- {lesson.strip()}")


if __name__ == "__main__":
    main()
