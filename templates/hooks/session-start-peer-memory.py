#!/usr/bin/env python3
"""Recalls past learnings for this agent from per-agent SQLite DB — SessionStart Hook"""

import json
import os
import re
import sqlite3
import sys
from pathlib import Path
from typing import List


PROJECT_ROOT = Path.cwd()
AGENT_MEMORY_DIR = PROJECT_ROOT / ".claude" / "agent-memory"


def sanitize_agent_name(agent: str) -> str:
    """Strip anything but safe filename chars so `agent` can't escape AGENT_MEMORY_DIR."""
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", agent)[:64]
    return cleaned or "orchestrator"


def get_agent_name() -> str:
    """Determine agent identity. Priority: env var > .peer-identity file > default."""
    agent = os.environ.get("PEER_AGENT")
    if agent:
        return sanitize_agent_name(agent.lower())
    identity_file = PROJECT_ROOT / ".peer-identity"
    if identity_file.exists():
        lines = identity_file.read_text().splitlines()
        first_line = lines[0].strip() if lines else ""
        if first_line:
            return sanitize_agent_name(first_line.lower())
    return "orchestrator"


def recall_memories(agent: str, limit: int = 10) -> List[str]:
    """Read recent memories from agent's SQLite DB."""
    db_path = AGENT_MEMORY_DIR / f"{agent}.db"
    if not db_path.exists():
        return []

    conn = sqlite3.connect(str(db_path))
    try:
        conn.execute("PRAGMA journal_mode=WAL")
        # Check if memories table exists
        table_check = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='memories'"
        ).fetchone()
        if not table_check:
            return []

        rows = conn.execute(
            "SELECT insight, created_at FROM memories "
            "WHERE agent = ? AND superseded_by IS NULL "
            "ORDER BY created_at DESC LIMIT ?",
            (agent, limit),
        ).fetchall()
        return [row[0] for row in rows]
    finally:
        conn.close()


def main() -> int:
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    agent = get_agent_name()
    memories = recall_memories(agent)

    if memories:
        lines = [f"**Past learnings for {agent} (most recent {len(memories)}):**"]
        for m in memories:
            lines.append(f"- {m}")
        message = "\n".join(lines)
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
            "message": f"Session memory recall error (non-fatal): {e}",
        }), file=sys.stderr)
        sys.exit(0)
