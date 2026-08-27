# Sangam → Peer Orchestra Research Summary

Date: 2026-04-05  
Repo: `/Users/varunmoka/GTC/peer-orchestra`

## Executive Summary
This document captures the implementation-focused research and planning thread that started under the "Sangam" concept and maps directly to the `peer-orchestra` repo direction. The core thesis remains strong: persona-first multi-agent orchestration with persistent memory, growth tracking, and improving dispatch quality over time. Compared to common multi-agent frameworks, this stack differentiates on personality + memory + growth loop in one cohesive system. Priority should remain on reliability and orchestration intelligence before expanding character packs. The highest-value near-term work is install robustness, memory relevance, visibility tooling, and event-driven dispatch/routing. This summary is intended as a working product/engineering reference for Codex/Claude sessions.

---

## 1) Current Product Shape (from research)

Original Sangam snapshot (research baseline):
- 8 persona files (personality-forward)
- 4 hooks (persona loader, memory recall/save, growth tracker)
- install script (aliases + SQLite init + settings merge)
- docs/readme/guides

Peer-Orchestra current repo structure (observed):
- `.claude-plugin/` plugin packaging
- `agents/` persona agents
- `commands/` orchestration commands
- `hooks/` + `scripts/`
- `themes/` theme packs
- `skills/`, `src/`, `tests/`, `docs/`

Conclusion:
- Peer-Orchestra is conceptually the same lineage as Sangam, with stronger plugin packaging and distribution framing.

---

## 2) Differentiation Thesis

The differentiation validated in research:
- Personality-first agents (not just role strings)
- Persistent per-agent memory
- Growth tracking over time
- Structured orchestrator dispatch
- Theme pack extensibility

This combination is still uncommon in mainstream frameworks and remains a valid product wedge.

---

## 3) Priority Roadmap (refined)

## P1 — Launch-Critical

1. **Install robustness first**
- `--dry-run`, safer settings merge, uninstall path.
- Reason: adoption bottleneck if setup is fragile.

2. **Memory recall quality**
- Replace naive recent-N retrieval with context-relevant recall.
- File/path/project-aware filtering.

3. **Agent status dashboard (`status`)**
- Show memory count, top domains, last-active.
- Needed for operator trust.

4. **Growth-to-rule promotion CLI (`promote`)**
- Turn growth logs into rule suggestions.
- Reduce manual file edits.

5. **Narrative persona block**
- Add concise agent backstory section to improve coherence.

6. **Move GCT mature example earlier (recommended)**
- A concrete mature example helps adoption faster than more persona count.

## P2 — Core Intelligence Upgrades

7. **Event-driven inter-agent communication**
- Event types: `task_assigned`, `task_completed`, `blocker_found`, `review_requested`.
- Prefer durable queue semantics in DB.

8. **Smart routing for orchestrator**
- Capability score from growth/file-touch data.
- Explainable dispatch recommendations with confidence.

9. **Extended roster packs**
- Add more characters/themes after orchestration quality hardens.

10. **Example maturity package**
- Sanitized real-world mature setup sample.

## P3 — Growth Differentiators

11. **Auto-growth digest + suggestions**
- Periodic analysis of specialization drift.

12. **Character interaction protocols**
- Formal handoff/review/conflict protocols.

13. **Theme marketplace**
- Publish/install themes from repos/registry.

14. **Observability dashboard**
- Activity timeline, ownership map, growth trends, dispatch history.

---

## 4) Critical Design Recommendations

### 4.1 Event system data model (must-have fields)
Suggested `events` table fields:
- `id`
- `event_type`
- `producer_agent`
- `consumer_agent` (nullable for broadcast)
- `payload_json`
- `idempotency_key`
- `created_at`
- `visible_at`
- `consumed_at`
- `status` (`pending|consumed|failed`)
- `retry_count`

Why:
- Enables idempotency and safe retries.
- Avoids double-consume and silent event loss.

### 4.2 Routing policy
- Dispatch should include confidence + rationale.
- If top confidence below threshold, fallback to review path or orchestrator intervention.

### 4.3 Sequence suggestion
- Reliability → visibility → intelligence → expansion.
- Avoid scaling persona count before dispatch quality is reliable.

---

## 5) Codex/Review Guidance (from research)

Recommended read-only audit lens:
1. Hook robustness and failure handling
2. Memory schema completeness for event model
3. Install script cross-platform failure modes
4. Persona specificity (generic vs behavior-shaping)
5. README value-prop clarity in 60 seconds
6. Hook/rule-file security risks

Output format recommendation:
- Ranked issues with severity (`critical|major|minor`)
- For each: affected file, reproduction path, blast radius, patch strategy

---

## 6) Product Positioning Note

The moat is not just “many agents”.
The moat is:
**personality + persistent memory + specialization growth + explainable orchestration**.

Keep this as the north-star while deciding scope.

---

## 7) Next Practical Steps

Immediate suggested execution sequence:
1. Install robustness + dry-run + uninstall
2. Status command
3. Memory recall relevance
4. Promote command
5. Event schema + basic consumer loop
6. Routing confidence explanation

Then expand themes and marketplace.

---

End of summary.
