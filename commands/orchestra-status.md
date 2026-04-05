---
name: orchestra-status
description: Show the current state of your peer orchestra — who's online, what they're working on, and available agents.
---

Check the current orchestra status:

1. Run `list_peers` to discover active Claude Code instances
2. For each peer, show their summary (what they're working on)
3. List which agent personas are available but not yet assigned
4. Show any pending messages

Format the output as a clean status table:

```
Orchestra Status
────────────────
Active Agents:
  Terminal 1: Paimon (orchestrator) — coordinating auth feature
  Terminal 2: Xiao (QA) — running test suite
  Terminal 3: Zhongli (backend) — designing auth API

Available (not assigned):
  Nahida, Albedo, Furina, Kaveh, Alhaitham, Yelan, Neuvillette, Ganyu, Lisa
```
