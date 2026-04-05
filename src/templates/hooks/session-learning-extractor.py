#!/usr/bin/env python3
"""
Session Learning Extractor — SessionEnd + PreCompact Hook

Parses session transcript JSONL to find peer interaction patterns
(corrections, rework cycles, quality gate failures, accepted pushback)
and saves them as feedback memories to agent-memory SQLite DBs.

This is a generalized version — works with any peer-orchestra project.
Agent names are auto-discovered from .claude/rules/agent-*.md files.
"""

import hashlib
import json
import re
import sqlite3
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Agent memory: stored in .claude/agent-memory/ within the project
PROJECT_ROOT = Path.cwd()
AGENT_MEMORY_DIR = PROJECT_ROOT / ".claude" / "agent-memory"

# Where Claude Code stores session transcripts
PROJECTS_DIR = Path.home() / ".claude" / "projects"

# Message tags we care about
PATTERN_TAGS = {"[correction]", "[followup]", "[relay]", "[dispatch]"}

# Pattern keywords that signal learnable moments
CORRECTION_SIGNALS = [
    "wrong", "fix", "issue", "mismatch", "duplicate", "orphan",
    "regression", "broke", "missing", "should have", "instead of",
    "not what", "revert", "rework",
]
QUALITY_GATE_SIGNALS = ["FAIL", "PASS", "quality gate", "round 1", "round 2", "round 3"]
PUSHBACK_SIGNALS = ["pushed back", "better approach", "should instead", "disagree", "preferred instead", "prefer a different"]


def discover_agents() -> set[str]:
    """Auto-discover agent names from .claude/rules/agent-*.md files."""
    rules_dir = PROJECT_ROOT / ".claude" / "rules"
    agents = set()
    if rules_dir.exists():
        for f in rules_dir.glob("agent-*.md"):
            name = f.stem.replace("agent-", "")
            if name not in ("common", "orchestrator"):
                agents.add(name.lower())
    # Always include orchestrator variants
    agents.add("orchestrator")
    return agents


# Lazy-loaded agent set
_known_agents: set[str] | None = None


def get_known_agents() -> set[str]:
    global _known_agents
    if _known_agents is None:
        _known_agents = discover_agents()
    return _known_agents


def find_transcript(session_id: str) -> Path | None:
    """Find the JSONL transcript for this session."""
    if not session_id or session_id == "unknown":
        return None

    if PROJECTS_DIR.exists():
        for project_dir in PROJECTS_DIR.iterdir():
            if not project_dir.is_dir():
                continue
            jsonl = project_dir / f"{session_id}.jsonl"
            if jsonl.exists():
                return jsonl

    return None


def extract_peer_messages(transcript_path: Path) -> list[dict]:
    """Extract peer messages from transcript JSONL.

    Peer messages appear in:
    1. queue-operation entries with operation=enqueue and content containing <channel source="claude-peers">
    2. user entries with message.content containing <channel source="claude-peers">
    """
    messages = []
    seen_contents = set()  # dedup across both sources

    with open(transcript_path) as f:
        for line in f:
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue

            content = None
            timestamp = None

            if entry.get("type") == "queue-operation" and entry.get("operation") == "enqueue":
                raw = entry.get("content", "")
                if "claude-peers" in raw:
                    content = raw
                    timestamp = entry.get("timestamp")

            elif entry.get("type") == "user":
                msg = entry.get("message", {})
                if isinstance(msg, dict):
                    raw = msg.get("content", "")
                    if isinstance(raw, str) and "claude-peers" in raw:
                        content = raw

            if content and content[:200] not in seen_contents:
                seen_contents.add(content[:200])
                parsed = parse_channel_message(content)
                if parsed:
                    if timestamp:
                        parsed["timestamp"] = timestamp
                    messages.append(parsed)

    return messages


def parse_channel_message(raw: str) -> dict | None:
    """Parse a <channel source="claude-peers" ...> message."""
    from_id_match = re.search(r'from_id="([^"]+)"', raw)
    from_summary_match = re.search(r'from_summary="([^"]*)"', raw)
    sent_at_match = re.search(r'sent_at="([^"]+)"', raw)

    body_match = re.search(r">\s*\n?(.*?)(?:</channel>|$)", raw, re.DOTALL)
    if not body_match:
        return None

    body = body_match.group(1).strip()
    if not body:
        return None

    tag = None
    for t in PATTERN_TAGS:
        if body.startswith(t) or f"\n{t}" in body[:100]:
            tag = t
            break

    return {
        "from_id": from_id_match.group(1) if from_id_match else "unknown",
        "from_summary": from_summary_match.group(1) if from_summary_match else "",
        "sent_at": sent_at_match.group(1) if sent_at_match else "",
        "tag": tag,
        "body": body,
    }


def detect_patterns(messages: list[dict]) -> list[dict]:
    """Detect learnable patterns from peer messages."""
    patterns = []

    for msg in messages:
        body_lower = msg["body"].lower()

        # Pattern 1: Corrections
        if msg["tag"] == "[correction]" or (
            msg["tag"] == "[followup]"
            and any(s in body_lower for s in CORRECTION_SIGNALS)
        ):
            pattern = extract_correction_pattern(msg)
            if pattern:
                patterns.append(pattern)

        # Pattern 2: Quality gate results
        if any(s.lower() in body_lower for s in QUALITY_GATE_SIGNALS):
            pattern = extract_quality_gate_pattern(msg)
            if pattern:
                patterns.append(pattern)

        # Pattern 3: Peer pushback
        if any(s in body_lower for s in PUSHBACK_SIGNALS):
            pattern = extract_pushback_pattern(msg)
            if pattern:
                patterns.append(pattern)

    return deduplicate_patterns(patterns)


def extract_correction_pattern(msg: dict) -> dict | None:
    """Extract a correction pattern."""
    body = msg["body"]
    summary = body[:500]
    agents_involved = extract_agents_from_text(body)
    from_agent = extract_agent_from_summary(msg["from_summary"])
    if from_agent:
        agents_involved.add(from_agent)
    if not agents_involved:
        agents_involved.add("unknown")

    return {
        "type": "correction",
        "topic": f"correction-{msg['sent_at'][:10] if msg['sent_at'] else 'unknown'}-{hashlib.md5(body[:200].encode()).hexdigest()[:8]}",
        "insight": f"[Correction] {summary}",
        "agents": list(agents_involved),
        "confidence": 0.85,
        "importance": 0.9,
    }


def extract_quality_gate_pattern(msg: dict) -> dict | None:
    """Extract quality gate patterns (FAIL -> PASS cycles)."""
    body = msg["body"]
    body_lower = body.lower()
    has_fail = "fail" in body_lower
    has_pass = bool(re.search(r'\bpass(?:ed|es)?\b', body_lower))
    if not has_fail:
        return None

    summary = body[:500]
    agents_involved = extract_agents_from_text(body)

    return {
        "type": "quality-gate",
        "topic": f"quality-gate-{'pass' if has_pass else 'fail'}-{msg['sent_at'][:10] if msg['sent_at'] else 'unknown'}-{hashlib.md5(body[:200].encode()).hexdigest()[:8]}",
        "insight": f"[Quality Gate {'FAIL->PASS' if has_pass else 'FAIL'}] {summary}",
        "agents": list(agents_involved) or ["unknown"],
        "confidence": 0.9,
        "importance": 0.95,
    }


def extract_pushback_pattern(msg: dict) -> dict | None:
    """Extract peer pushback that was accepted."""
    body = msg["body"]
    summary = body[:500]
    agents_involved = extract_agents_from_text(body)

    return {
        "type": "pushback",
        "topic": f"pushback-accepted-{msg['sent_at'][:10] if msg['sent_at'] else 'unknown'}-{hashlib.md5(body[:200].encode()).hexdigest()[:8]}",
        "insight": f"[Peer Pushback] {summary}",
        "agents": list(agents_involved) or ["unknown"],
        "confidence": 0.7,
        "importance": 0.8,
    }


def extract_agents_from_text(text: str) -> set[str]:
    """Find agent names mentioned in text."""
    text_lower = text.lower()
    return {a for a in get_known_agents() if a in text_lower}


def extract_agent_from_summary(summary: str) -> str | None:
    """Extract agent name from peer summary like 'Nahida: working on ...'."""
    if not summary:
        return None
    first_word = summary.split()[0].lower().rstrip(":") if summary.split() else ""
    return first_word if first_word in get_known_agents() else None


def deduplicate_patterns(patterns: list[dict]) -> list[dict]:
    """Remove near-duplicate patterns."""
    seen = set()
    unique = []
    for p in patterns:
        key = p["insight"][:100]
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def ensure_schema(conn: sqlite3.Connection):
    """Create memories table and FTS index if they don't exist."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            agent TEXT NOT NULL,
            topic TEXT NOT NULL,
            insight TEXT NOT NULL,
            memory_type TEXT NOT NULL DEFAULT 'discovery',
            cognitive_type TEXT NOT NULL DEFAULT 'semantic',
            confidence REAL DEFAULT 0.8,
            importance REAL DEFAULT 0.8,
            source_session TEXT,
            tags TEXT,
            created_at TEXT NOT NULL,
            superseded_by TEXT
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts
        USING fts5(id UNINDEXED, insight, content='memories', content_rowid='rowid');
    """)


def save_patterns(patterns: list[dict], session_id: str) -> int:
    """Save patterns to agent-memory SQLite DBs."""
    if not patterns:
        return 0

    AGENT_MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).isoformat()
    saved = 0

    all_agents = set()
    for p in patterns:
        all_agents.update(p["agents"])

    for agent in all_agents:
        if agent == "unknown":
            continue

        db_path = AGENT_MEMORY_DIR / f"{agent}.db"
        conn = sqlite3.connect(str(db_path))
        try:
            conn.execute("PRAGMA journal_mode=WAL")
            ensure_schema(conn)

            for p in patterns:
                if agent not in p["agents"]:
                    continue

                memory_id = str(uuid.uuid4())
                tags = json.dumps(["auto-extracted", p["type"]] + p["agents"])

                # Idempotency: skip if same session+topic+agent already exists
                existing = conn.execute(
                    "SELECT 1 FROM memories WHERE source_session=? AND topic=? AND agent=?",
                    (session_id, p["topic"], agent),
                ).fetchone()
                if existing:
                    continue

                conn.execute(
                    "INSERT INTO memories "
                    "(id, agent, topic, insight, memory_type, cognitive_type, "
                    "confidence, importance, source_session, tags, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        memory_id, agent, p["topic"], p["insight"],
                        "feedback", "procedural",
                        p["confidence"], p["importance"],
                        session_id, tags, now,
                    ),
                )
                conn.execute(
                    "INSERT OR IGNORE INTO memories_fts(id, insight) VALUES (?, ?)",
                    (memory_id, p["insight"]),
                )
                saved += 1

            conn.commit()
        finally:
            conn.close()

    return saved


def main() -> int:
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        input_data = {}

    session_id = input_data.get("session_id", "unknown")

    transcript = find_transcript(session_id)
    if not transcript:
        return 0

    messages = extract_peer_messages(transcript)
    if not messages:
        return 0

    patterns = detect_patterns(messages)
    if not patterns:
        return 0

    saved = save_patterns(patterns, session_id)

    if saved > 0:
        print(json.dumps({
            "hookEventName": input_data.get("hook_event_name", "SessionEnd"),
            "message": f"Session learning extractor: {saved} patterns saved from {len(messages)} peer messages",
        }))

    return 0


if __name__ == "__main__":
    sys.exit(main())
