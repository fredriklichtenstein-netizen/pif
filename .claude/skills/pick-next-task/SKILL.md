---
name: pick-next-task
description: Triage the PIF Trello backlog board and propose what to work on next, with a reasoned recommendation rather than a raw list dump. Use this at the start of a PIF work session when the user hasn't named a specific task — phrases like "what should I work on next", "what's next on the backlog", "pick something to fix", "what's outstanding", or simply starting a session with no specific ask. Also covers triaging the board's Inbox list (auto-filed feedback and new cards) before recommending, and checking for unfinished In-Progress work before suggesting something new. Once a task is picked, hand off into implementation and the promote-to-production skill for shipping it.
---

# Pick the next PIF task from the backlog

## Board reference

Board: https://trello.com/b/Fs4TDO6L/pif-backlog-mvp-2026 ("PIF Backlog MVP 2026")
Lists in order: **Inbox → Backlog → Up Next (by severity) → In Progress → Testing on staging → Done**

Use the `mcp__trello__*` tools (personal account) — never `mcp__claude_ai_Trello__*` (work account,
wrong board entirely).

Labels: red = Bug · purple = Architecture/rebuild · blue = Feature (large) · green = Feature (small)
· yellow = UX & copy polish · orange = Tech debt/infra. Cards are prefixed A1–G3 by category.

**Critical gotcha**: "the board's Inbox" means the **list** named Inbox on this board, not Trello's
personal quick-capture Inbox. `mcp__trello__trelloReadInbox` reads that *other*, unrelated surface —
confirmed to report "nothing to triage" while real unfiled cards sat in the board's Inbox list the
whole time. To read the board's Inbox list: find its list id via `trelloReadBoard` (action `get`, or
`list_labels`/etc. to enumerate lists) or `trelloReadList` (`list_by_board`), then
`trelloReadCard` with action `list_by_list` against that id.

## Procedure

### 1. Triage the Inbox list first

The in-app feedback form auto-files a card per submission here (category + free text + timestamp
only — no user id, matching the mailbox copy at hej@pif.community). New/uncategorized cards can also
land here from manual entry. For each card in Inbox:

- Read it, judge bug vs. feature vs. UX polish and rough size.
- Move it out: to **Up Next** if it reads as urgent or high-value, otherwise **Backlog**.
- If a card is too vague to act on (common for raw feedback submissions), say so when you report
  back rather than silently filing it somewhere it'll get ignored.

Don't skip this even if the user just wants "what's next" — an untriaged Inbox can hide the actual
highest-priority item.

### 2. Check for unfinished work already In Progress

List the **In Progress** list. If a card is already sitting there, that's unfinished work — surface
it and ask whether to pick that back up before starting something new, rather than silently starting
a second thing in parallel. The user may have a good reason to context-switch; just don't assume it.

### 3. Pull candidates

Read **Up Next (by severity)** first — it's meant to already be prioritized. If it's empty or thin,
fall back to **Backlog**. Pull enough cards to have real options (not just the single top card),
including their labels.

### 4. Recommend, don't dump

Present a short, reasoned recommendation — not a raw list. Pick a top candidate and say why (label/
severity, how self-contained it is, whether it's a quick win vs. a larger effort, any dependency on
other unfinished work), then name 1-2 alternatives briefly. Frame it as a suggestion the user can
redirect, not a decision already made — this is an exploratory judgment call, not an implementation
step, so don't start coding until they pick.

### 5. Hand off once picked

When the user confirms a card, move it to **In Progress** immediately as part of starting the task
(not a chore to remember later), then begin implementation on the `staging` branch. From there, the
**promote-to-production** skill covers committing, testing on staging, confirming, and shipping to
production.
