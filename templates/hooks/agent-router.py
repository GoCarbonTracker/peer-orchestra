#!/usr/bin/env python3
"""Routes user prompts to the appropriate agent based on keyword matching — UserPromptSubmit Hook"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List


PROJECT_ROOT = Path.cwd()

# Connector words that add noise to auto-extracted keywords
STOPWORDS = {"and", "the", "for", "with", "from", "into", "this", "that", "via"}

# Default keyword routes — used when agent files lack ## Abilities sections
DEFAULT_ROUTES: Dict[str, List[str]] = {
    "backend": ["API", "database", "backend", "performance", "system design", "architecture"],
    "frontend": ["frontend", "UI", "dashboard", "React", "CSS", "component", "design", "visualization"],
    "data": ["data", "extract", "enrich", "entity", "knowledge base", "KB", "schema", "quality"],
    "devops": ["deploy", "CI/CD", "security", "infrastructure", "Docker", "hook", "config"],
    "qa": ["test", "QA", "regression", "benchmark", "edge case", "coverage", "bug"],
    "research": ["competitive", "research", "market", "intelligence", "compare", "competitor"],
    "audit": ["review", "audit", "compliance", "quality", "verify", "check"],
    "reporting": ["report", "summary", "metrics", "status", "export", "KPI"],
    "docs": ["document", "paper", "epic", "story", "plan", "literature"],
    "pipeline": ["pipeline", "ETL", "transform", "batch", "parse", "process", "CSV", "PDF"],
    "tooling": ["tooling", "plugin", "build system", "configuration", "MCP"],
}


def discover_agents() -> Dict[str, dict]:
    """Auto-discover agents from .claude/rules/agent-*.md files.

    Returns dict of {name: {"domain": str, "keywords": list[str]}}.
    """
    rules_dir = PROJECT_ROOT / ".claude" / "rules"
    agents: Dict[str, dict] = {}

    if not rules_dir.exists():
        return agents

    for f in rules_dir.glob("agent-*.md"):
        name = f.stem.replace("agent-", "")
        if name in ("common", "orchestrator"):
            continue

        domain = ""
        keywords: List[str] = []

        try:
            content = f.read_text(errors="replace")

            # Archon personas (## In Archon Council) are for /archon-council debate,
            # not task routing — skip explicitly rather than silently dropping them
            # for lacking an ## Abilities section.
            if "## In Archon Council" in content:
                continue

            # Extract domain from **Domain:** line
            domain_match = re.search(r"\*\*Domain:\*\*\s*(.+?)(?:\n|$)", content)
            if domain_match:
                domain = domain_match.group(1).strip().rstrip(".")

            # Extract keywords from ## Abilities section bullets
            abilities_match = re.search(r"## Abilities\s*\n((?:[-*].*\n)*)", content)
            if abilities_match:
                for line in abilities_match.group(1).split("\n"):
                    line = line.strip().lstrip("-* ")
                    if line:
                        # Normalize (lowercase, strip punctuation) and dedupe before
                        # extending — raw words with mixed case/punctuation missed
                        # matches, and duplicates inflated scores.
                        words = {
                            re.sub(r"[^\w-]", "", w).lower()
                            for w in line.split()[:4]
                            if len(w) > 2
                        }
                        words -= STOPWORDS
                        keywords.extend(w for w in words if w and w not in keywords)

            # Fall back to DEFAULT_ROUTES if no abilities found
            if not keywords:
                for role, kws in DEFAULT_ROUTES.items():
                    if role in name or role in domain.lower():
                        keywords = kws
                        break
        except OSError:
            continue

        if keywords:
            agents[name] = {"domain": domain or name, "keywords": keywords}

    return agents


def route_prompt(prompt: str, agents: Dict[str, dict]) -> List[dict]:
    """Match prompt keywords to agents."""
    prompt_lower = prompt.lower()
    matches = []

    for agent, info in agents.items():
        matched_keywords = [kw for kw in info["keywords"] if kw.lower() in prompt_lower]
        if matched_keywords:
            matches.append({
                "agent": agent.capitalize(),
                "domain": info["domain"],
                "keywords": matched_keywords,
                "score": len(matched_keywords),
            })

    matches.sort(key=lambda m: m["score"], reverse=True)
    return matches


def main() -> int:
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    prompt = input_data.get("prompt", "")
    if not prompt:
        # Fallback: check argv and env
        prompt = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PROMPT", "")
    if not prompt:
        return 0

    agents = discover_agents()
    if not agents:
        return 0

    matches = route_prompt(prompt, agents)
    if matches:
        lines = []
        for m in matches:
            lines.append(f"Agent Router: This looks like a task for **{m['agent']}** ({m['domain']}).")
            lines.append(f"Matching keywords: {', '.join(repr(k) for k in m['keywords'])}")

        print(json.dumps({
            "hookEventName": "UserPromptSubmit",
            "message": "\n".join(lines),
        }))

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(json.dumps({
            "hookEventName": "UserPromptSubmit",
            "message": f"Agent router error (non-fatal): {e}",
        }), file=sys.stderr)
        sys.exit(0)
