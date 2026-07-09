# Plan: Diagnose fulfiller self-view logic bug + flag trackevents 403

## Context

The console log confirms the fetched interests row for the current user has `status: "selected"`, yet `InterestSelectionList` is rendering the pending-state copy with no "Meddelande" button. Source code at lines 698–702 looks correct:

```ts
const ownRow = !isOwner && isWish && !!currentUserId
  ? rows.find((r) => r.user_id === currentUserId)
  : undefined;
const isFulfillerView = !!ownRow;
const isSelectedFulfiller = ownRow?.status === "selected";
```

Something between the fetched data and this evaluation is failing. Candidates worth logging: `isOwner`/`isWish`/`currentUserId` gating `ownRow` to `undefined`; duplicate interest rows for the same user where `.find` picks a stale `pending`/`not_selected` row; a type/casing mismatch on `status`; or `currentUserId` not matching `user_id` (uuid string vs auth session mismatch).

## Change 1 — Diagnostic logs in `src/components/post/interactions/interest/InterestSelectionList.tsx`

Right before the header ternary (currently line 757, inside the `if (isFulfillerView)` block), add:

```ts
console.log('[fulfiller-self-view:debug]', {
  itemId,
  currentUserId,
  isOwner,
  isWish,
  ownRowUserId: ownRow?.user_id,
  ownRowStatus: ownRow?.status,
  isFulfillerView,
  isSelectedFulfiller,
  allRows: rows.map(r => ({ user_id: r.user_id, status: r.status, id: r.id })),
});
```

Also add a second log immediately after the `ownRow` computation (line 702), OUTSIDE the `if (isFulfillerView)` guard, so we can see cases where `isFulfillerView` is false and the self-view branch is skipped entirely:

```ts
console.log('[fulfiller-self-view:gate]', {
  itemId,
  currentUserId,
  isOwner,
  isWish,
  isFulfillerView,
  matchedRow: ownRow ? { user_id: ownRow.user_id, status: ownRow.status } : null,
  rowCount: rows.length,
  currentUserRows: rows.filter(r => r.user_id === currentUserId).map(r => ({ status: r.status, id: r.id })),
});
```

The `currentUserRows` filter is deliberately broader than `.find` — if it returns multiple rows for the same user, that explains the bug (duplicate interest rows, `.find` picks the wrong one).

No other logic changes in this step. After the user reopens item 33's popup as Fredrik, we read the log output and decide the real fix.

## Change 2 — trackevents 403 (flag only)

Not fixed in this pass. Best-guess origin: a third-party analytics beacon (Plausible / a Lovable-injected analytics script / a PostHog-style endpoint) whose auth header or CORS config is misconfigured against the current preview origin. It is not from our own Supabase edge functions or app code (no `trackevents` reference in `src/`). Worth confirming by searching `index.html` and any injected scripts once we're in build mode; likely a config or allowlist change rather than a code fix. Non-blocking.

## After the log lands

User reopens the popup on item 33, shares the two log outputs, and we diagnose from there (expected outcomes: duplicate row / wrong-branch gate / stale rows). Then we propose the actual fix in a follow-up plan.
