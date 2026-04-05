---
name: dispatch
description: Dispatch a task to a specific agent. Usage /dispatch <agent> <task description>. Formats the message using the structured dispatch protocol and sends it via claude-peers.
---

Dispatch a task to an agent peer using the structured protocol.

1. Parse the command arguments: first word is the agent name, rest is the task
2. Find the target peer via `list_peers`
3. Format the dispatch message:

```
[dispatch] P1-normal

TASK: {task description from user}

CONTEXT: {infer from conversation context}

OUTPUT: {suggest appropriate file path}

RESPOND: Confirm when done with file path and verification results.
```

4. Send via `send_message` to the target peer
5. Confirm to the user: "Dispatched to {agent}: {task summary}"

If the target agent isn't online, tell the user to open a new terminal with `clp`.
