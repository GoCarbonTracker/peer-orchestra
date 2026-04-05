---
name: party
description: Spawn a pre-configured team of agents for a specific task type. Usage: /party <name>. Available parties: archon-council, sprint, research, security, full-stack.
---

# Party System

Spawn a pre-configured team of agents for common task patterns.

## Available Parties

### `/party sprint`
**Team:** Zhongli (backend) + Xiao (QA) + Kaveh (frontend)
**Use for:** Feature implementation with tests and UI.
Zhongli builds the backend, Kaveh builds the frontend, Xiao writes and runs tests. TDD loop pattern.

### `/party research`
**Team:** Nahida (data) + Yelan (intelligence) + Furina (docs)
**Use for:** Investigation, competitive research, documentation sprints.
Yelan researches, Nahida validates data, Furina writes the docs.

### `/party security`
**Team:** Alhaitham (infra) + Neuvillette (audit) + Xiao (QA)
**Use for:** Security review, compliance checks, penetration testing.
Alhaitham reviews infrastructure, Neuvillette audits for compliance, Xiao tests edge cases.

### `/party full-stack`
**Team:** Zhongli (backend) + Kaveh (frontend) + Alhaitham (infra) + Xiao (QA)
**Use for:** Large features that touch all layers.

### `/party archon-council`
**Team:** All 7 Archons
**Use for:** Strategic debates, architecture decisions, multi-perspective brainstorming.
See `/archon-council` for the full debate format.

## How It Works

1. User runs `/party sprint`
2. Paimon checks which peers are online via `list_peers`
3. For each agent in the party that isn't online: "Open a new terminal with `clp` for {agent}"
4. For each agent that IS online: dispatch the party role assignment
5. Report the party status:

```
Party: Sprint Team
──────────────────
  Zhongli (backend)  — online, ready
  Xiao (QA)          — online, ready
  Kaveh (frontend)   — needs terminal: run `clp` in a new tab

What should they build?
```

## Custom Parties

Users can define custom parties by telling Paimon: "Create a party called 'data-pipeline' with Albedo, Nahida, and Ganyu." Paimon saves it for future use.
