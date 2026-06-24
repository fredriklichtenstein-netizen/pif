## Re-checked ConversationList.tsx — there is no separate `closed_at` filter

I have `ConversationList.tsx` already in context. The active/history split (lines 39-48) is a strict binary partition:

```ts
const { active, history } = useMemo(() => {
  const a, h = [];
  for (const c of conversations) {
    if (isHistoricStatus(c.item?.status)) h.push(c);
    else a.push(c);            // ← everything not historic lands here
  }
  return { active: a, history: h };
}, [conversations]);
```

There is no second filter on `closed_at` anywhere in this file, and no `.filter(...)` between `conversations` (the prop) and either bucket. So if the wish conv is invisible in **both** Aktiva and (expanded) Historik, it cannot have reached `ConversationList`'s `conversations` prop in the first place. Your "gap" hypothesis is well-formed but the gap isn't in this file.

That moves the only remaining suspect upstream into `useConversations.ts` — even though Query 2 confirms the DB-level select returns the row. Two plausible upstream causes left:

1. The row is present in `conversationsData` (raw select) but a later step in the hook drops it before `setConversations`. There's no explicit `.filter()` in the hook, but the `transformedConversations.map` reads `participantsByConversation[conv.id]` — if `participantsByConversation` is undefined for this conv's id, the map call would currently still produce a row (`participants: []`), so this isn't a drop either on inspection. Worth confirming live, though.
2. The PostgREST select **does** drop the row at the client even though the equivalent SQL works in the editor — e.g. due to a different JWT context (`anon` vs `authenticated`), an item-embed parse error, or a stale cached response. Less likely, but cheap to confirm.

A single extra log line answers both at once.

---

## Plan

### Step 1 — Combined logging (PIF deep-link + WISH list-membership)

Implement all the PIF logs as previously approved, **plus two extra log lines** so this same reproduction round answers the wish bug:

1. `src/components/notifications/NotificationList.tsx`
   - In the `isSelectionMade` branch: `console.debug('[notif-render]', { notifId, type, conversation_id, item_id, action_url, computed_ctaUrl, ctaLabel })`.
   - On the CTA `<Link>` `onClick`: `console.debug('[notif-cta] click →', ctaUrl)` before `markAsRead`.

2. `src/pages/Messages.tsx`
   - Top of deep-link `useEffect`: `console.debug('[messages] deep-link effect', { rawSearch: searchParams.toString(), cid, itemId, activeConversationId, activeTab })`, plus a one-liner inside each branch naming which ran.
   - `handleTabChange`: `console.debug('[messages] tab →', value)`.
   - `handleMessagesTabClick`: `console.debug('[messages] messages-tab click; collapsing?', !!activeConversationId)`.

3. **New: `src/hooks/useConversations.ts`** — right before `setConversations(transformedConversations)`:
   ```ts
   console.debug('[useConversations] setConversations', {
     idsFromRpc: conversationIds,
     idsFromSelect: conversationsData?.map(c => c.id),
     finalIds: transformedConversations.map(c => ({
       id: c.id,
       item_id: c.item_id,
       item_status: c.item?.status ?? null,
     })),
   });
   ```
   This makes it obvious whether the wish conv id makes it through each stage of the fetch.

4. **New: `src/components/messaging/ConversationList.tsx`** — inside the `useMemo` after the loop, before the return:
   ```ts
   console.debug('[ConversationList] bucket split', {
     activeIds: a.map(c => c.id),
     historyIds: h.map(c => c.id),
   });
   ```

All five additions are `console.debug` — no behaviour change, easy to grep for in the transcript, easy to remove in the follow-up fix.

When you reproduce, please open `/messages` once with the dev tools console set to "All levels" (so debug shows), then:
- (a) capture the `[useConversations]` and `[ConversationList]` lines that fire — those answer the wish bug.
- (b) click the pif "Du har valt…" notification CTA and capture the `[notif-cta]` / `[messages]` lines that follow — those answer the pif bug.

Paste the transcript and I'll land both fixes in the next round.

### Step 2 — Both fixes

Deferred until the transcript arrives. Expected outcomes:
- If `[useConversations]` shows the wish id missing from `idsFromSelect` → bug is the PostgREST select; we adjust the embed/select shape.
- If shown in `idsFromSelect` but missing from `finalIds` → bug is in the transform; we patch the map.
- If shown in `finalIds` but missing from `[ConversationList] activeIds`/`historyIds` → bug is in `ConversationList` after all (something I missed); we add the `closed_at` fallback in `isHistoricStatus`.

---

## Confirmation requested

Approve implementing step 1 with the extra two log lines so we get answers to both bugs in a single reproduction round?
