## Lovable implementation plan for approval

Persist the response-headline convention to project Core memory so it's always in context and survives session churn (it was dropped twice this session because it lived only in chat history, not memory).

### Change

Append one line to the **Core** section of `mem://index.md`:

```
- **Response format**: Always prefix every reply with `## Lovable <category>` heading (e.g. `## Lovable summary of performed implementation`, `## Lovable questions to be answered by user`, `## Lovable actions that need to be performed by user`, `## Lovable implementation plan for approval`, `## Lovable acknowledgement`). User pastes replies into Claude; the prefix marks origin.
```

### Why Core, not a separate memory file

- Applies to **every** action, every reply, regardless of page or task — exactly the Core test.
- Under the ~150 char soft cap when trimmed; if it runs long, the example list can move to a referenced `mem://preferences/response-headlines` file with a one-liner pointer in Core.
- No other files touched, no code changes, no migrations.

### Out of scope

- No changes to the categories list itself — using the ones already observed in chat history.
- No backfill of past replies.
