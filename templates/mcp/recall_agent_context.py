"""Template: recall_agent_context MCP tool for pull-based agent memory recall.

Add this tool to your project's unified memory MCP server so any dispatched
peer can explicitly load its condensed memory brief at task start.

Complements the push-based session-start-peer-memory hook:
- Hook (push): auto-recalls on session start for dedicated agent terminals
- This tool (pull): on-demand recall for peers dispatched via send_message

Usage in dispatch SETUP block:
    SETUP: Call `recall_agent_context(agent='{name}')` to load your memory brief.

Requires:
- An MCP server using FastMCP (mcp.server.fastmcp)
- A MemoryStore with a .search() method returning records with:
    agent, topic, insight, importance, created_at fields
- Adjust KNOWN_AGENTS, MemoryStore import, and _get_store() to match your project.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone
from typing import Optional

# --- Adapt these imports to your project ---
# from your_schema import KNOWN_AGENTS
# from your_store import MemoryStore
# from mcp.server.fastmcp import FastMCP
# mcp = FastMCP("your-memory-server")
# -------------------------------------------

# Minimum importance threshold for recall (memories below this are noise)
IMPORTANCE_THRESHOLD = 0.7
# How far back to look for shared cross-agent memories
SHARED_LOOKBACK_DAYS = 7
# Max chars per insight line in the brief
TRUNCATE_LENGTH = 150


def _truncate(text: str, length: int = TRUNCATE_LENGTH) -> str:
    return text[:length] + "..." if len(text) > length else text


# @mcp.tool()  # Uncomment when wiring into your MCP server
def recall_agent_context(
    agent: str,
    max_results: int = 7,
    include_shared: bool = False,
) -> str:
    """Load a condensed memory brief for an agent at task start.

    Returns the agent's most important memories as a formatted brief,
    plus optionally recent cross-agent shared memories.

    Args:
        agent: Agent name (e.g., "researcher", "reviewer")
        max_results: Max agent memories to return (default 7)
        include_shared: Also include recent cross-agent memories (default false)
    """
    # Validate agent name against your project's known agents
    # if agent.lower() not in KNOWN_AGENTS:
    #     return json.dumps({"error": f"Unknown agent '{agent}'"})

    agent_lower = agent.lower()
    store = _get_store()  # noqa: F821 — replace with your store accessor

    # Over-fetch to allow importance filtering and re-sorting
    results = store.search(agent=agent_lower, limit=max_results * 3)
    results = [r for r in results if r.importance >= IMPORTANCE_THRESHOLD]
    results.sort(key=lambda r: r.importance, reverse=True)
    results = results[:max_results]

    lines = [f"=== {agent_lower.title()} Memory Brief ==="]
    for r in results:
        lines.append(f"- [{r.topic}] {_truncate(r.insight)}")

    # Shared memories: recent cross-agent memories
    shared_lines: list[str] = []
    if include_shared:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=SHARED_LOOKBACK_DAYS)).isoformat()
        shared_results = store.search(limit=50)
        shared_results = [
            r for r in shared_results
            if r.agent != agent_lower
            and r.importance >= IMPORTANCE_THRESHOLD
            and r.created_at >= cutoff
        ]
        shared_results.sort(key=lambda r: r.importance, reverse=True)
        shared_results = shared_results[:max_results]
        if shared_results:
            shared_lines.append("")
            shared_lines.append("=== Recent Shared Memories ===")
            for r in shared_results:
                shared_lines.append(f"- [{r.agent}] ({r.topic}) {_truncate(r.insight)}")

    lines.append(f"=== {len(results)} memories loaded ===")
    lines.extend(shared_lines)

    return "\n".join(lines)
