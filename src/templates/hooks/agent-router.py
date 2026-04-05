#!/usr/bin/env python3
"""Routes user prompts to the appropriate agent based on keyword matching."""

import json
import os
import sys

# Agent-to-keyword mapping — extend this as your team grows
AGENT_ROUTES = {
    "Nahida": ["data", "extract", "enrich", "entity", "knowledge base", "KB", "schema", "quality"],
    "Zhongli": ["architecture", "API", "database", "backend", "performance", "system design"],
    "Albedo": ["pipeline", "ETL", "transform", "batch", "parse", "process", "CSV", "PDF"],
    "Furina": ["document", "research", "paper", "epic", "story", "plan", "literature"],
    "Kaveh": ["frontend", "UI", "dashboard", "React", "CSS", "component", "design", "visualization"],
    "Alhaitham": ["deploy", "CI/CD", "security", "infrastructure", "Docker", "hook", "config"],
    "Xiao": ["test", "QA", "regression", "benchmark", "edge case", "coverage", "bug"],
    "Yelan": ["competitive", "research", "market", "intelligence", "compare", "competitor"],
    "Neuvillette": ["review", "audit", "compliance", "quality", "verify", "check"],
    "Ganyu": ["report", "summary", "metrics", "status", "export", "KPI"],
    "Lisa": ["tooling", "plugin", "build system", "configuration", "MCP", "hook"],
}

# Role labels for non-Genshin users
ROLE_LABELS = {
    "Nahida": "KB & Data",
    "Zhongli": "Backend & Architecture",
    "Albedo": "Data Processing",
    "Furina": "Documentation & Research",
    "Kaveh": "Frontend & UI",
    "Alhaitham": "Infrastructure & Security",
    "Xiao": "QA & Testing",
    "Yelan": "Research & Intelligence",
    "Neuvillette": "Audit & Review",
    "Ganyu": "Reporting & Admin",
    "Lisa": "Tooling & Internals",
}


def route_prompt(prompt: str) -> list[dict]:
    """Match prompt keywords to agents. Returns list of matches with confidence."""
    prompt_lower = prompt.lower()
    matches = []

    for agent, keywords in AGENT_ROUTES.items():
        matched_keywords = [kw for kw in keywords if kw.lower() in prompt_lower]
        if matched_keywords:
            matches.append({
                "agent": agent,
                "role": ROLE_LABELS[agent],
                "keywords": matched_keywords,
            })

    return matches


def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PROMPT", "")
    if not prompt:
        return

    matches = route_prompt(prompt)
    if matches:
        lines = []
        for m in matches:
            lines.append(f"Agent Router: This looks like a task for **{m['agent']}** ({m['role']}).")
            lines.append(f"Matching keywords: {', '.join(repr(k) for k in m['keywords'])}")
        print("\n".join(lines))


if __name__ == "__main__":
    main()
