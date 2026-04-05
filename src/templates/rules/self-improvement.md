# Self-Improvement Loop

## After Any Correction

1. Save the learning: what went wrong + rule to prevent it
2. Apply the correction immediately — don't wait for the next task
3. Reference past lessons before starting new work

## Verification Standard

- Never mark work complete without proving it works
- Frontend: build must pass
- Scripts: run and compare output
- Tests: all green before reporting done
- Data changes: verify with a query
- Ask: "Would a staff engineer approve this?"

## Lessons Format

When saving a lesson:
```
[date] | what went wrong | rule to prevent it
```

## How Lessons Flow

1. Agent makes a mistake
2. Orchestrator corrects
3. Agent saves lesson to memory (immediately, not at session end)
4. Next session: hook reminds agent of past lessons
5. Agent avoids repeating the mistake

## Record From Success Too

Don't only save corrections. If you try a non-obvious approach and it works:
- Save what you did and why it worked
- This prevents future drift away from validated approaches
- Confirmations are quieter than corrections — watch for them
