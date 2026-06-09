# Six Fixes: Messaging & Profile Rating

## 1. Conversation list opens wrong conversation

**Root cause:** The deep-link `useEffect` in `src/pages/Messages.tsx` depends on `[searchParams, conversations]`. Every time `conversations` changes (and realtime refetches it constantly — clicking a row triggers `mark_conversation_read`, which updates `messages.read_at`, which fires the `messages` postgres_changes subscription, which refetches conversations), the effect re-runs and — if `?conversation=` or `?item=` is still in the URL from an earlier notification deep-link — re-applies that ID, overwriting the user's click. The "most recent" conversation gets re-selected because it was the original deep-link target.

**Fix:**
- Track which deep-link value we've already applied in a `useRef` (`appliedDeepLinkRef`). Only apply `?conversation=` / `?item=` once per unique value.
- Remove `conversations` from the deps; instead, when `?item=` is provided and conversations haven't loaded yet, watch with a separate effect that only runs until match found, then marks the ref consumed.
- After applying a deep-link, also strip the param from the URL (`setSearchParams({}, { replace: true })`) so subsequent clicks aren't fought.

## 2. Remaining `JSON.parse("Unexpected token '('")` errors

A grep confirms **no** `JSON.parse` calls wrap Supabase `.data` directly. The error is a legacy `pif_user_location` localStorage value that was at some point written as a PostGIS string `(lng,lat)` instead of a JSON array.

**Fix:**
- In `src/utils/distance.ts` `calculateDistanceFromUser`: detect a non-JSON value (string starting with `(`) before parsing, delete the bad key, return `NaN`.
- Audit and harden the other `JSON.parse` localStorage readers (`useLocationStorage`, `useMapInitialization`, `useCachedProfile`, `itemCache`, `posts/cache`, `mapFiltersStorage`, `sessionRecovery`, `useLazyComments`, `useCommentCreate`, `NotFound`, `ItemDetail`, `useItemDetailPage`) — each already has a try/catch, but several `console.error` on parse failure. Convert those to silent `localStorage.removeItem(key)` + return null so corrupted entries self-heal instead of spamming the console x5.
- Confirm no `JSON.parse(data)` exists on any `supabase.*` response (verified via `rg`).

## 3. Conversation must move to Historik & become read-only on realtime status change

**Current state:**
- `ConversationView` already subscribes per-item via `usePifCompletion` and flips to read-only when `pifStatus` is `completed`/`archived`. Good.
- `ConversationList` derives Active vs Historik from `conversation.item.status`, but `useConversations` only refetches on `messages`/`conversations`/`conversation_participants` changes — **not** on `items.pif_status` updates. So the list doesn't move the row to Historik until a page refresh.

**Fix in `src/hooks/useConversations.ts`:**
- Build a list of `item_id`s from the current `conversations` and add a single `items` postgres_changes UPDATE subscription filtered to those IDs (`id=in.(...)`), inside the same `public:conversations:${user.id}` channel. On any change, call `fetchConversations()`.
- Alternatively, since the `pif_status` on each conversation's joined item is what changed, do an in-place state update: when an `items` UPDATE event arrives, patch `conversations[i].item.status = payload.new.pif_status` so the list re-categorises instantly without a full refetch.
- Prefer the in-place patch (lighter, no flicker).

## 4. Rewrite all completion-flow system messages in 2nd person

All edits in `src/hooks/usePifCompletion.ts` `postPifSystemMessage` callers. Use the existing `target_user_id` column on `messages` (already filtered by `ConversationView`) so each side sees the correctly-worded variant.

| Trigger | target_user_id | content |
|---|---|---|
| Piffer confirms handoff (to piffer) | piffer | "Du har bekräftat överlämning. Väntar på att mottagaren bekräftar mottagning." |
| Piffer confirms handoff (to receiver) | receiver | "Piffaren har bekräftat överlämning. Väntar på att du bekräftar mottagning." |
| Receiver confirms (to receiver) | receiver | "Du har bekräftat mottagning." |
| Receiver confirms (to piffer) | piffer | "Mottagaren har bekräftat mottagning." |
| Both confirmed | null (both) | "Piffen är genomförd! Tack för att ni använde PIF. 🎉" |
| Piffer hard-complete (to piffer) | piffer | "Du markerade piffen som genomförd." |
| Piffer hard-complete (to receiver) | receiver | "Piffaren har markerat piffen som genomförd." |
| Withdraw reopen (to piffer) | piffer | "Du har ångrat valet av mottagare. Piffen är nu öppen igen." |
| Withdraw reopen (to receiver) | receiver | "Piffaren har ångrat sig och kan/vill inte längre piffa detta till dig. Piffen är nu öppen för andra att visa intresse." |
| Withdraw archive (to piffer) | piffer | "Du har arkiverat piffen." |
| Withdraw archive (to receiver) | receiver | "Piffaren har ångrat sig och kan/vill inte längre piffa detta." |

Extend `postPifSystemMessage` to accept an optional `target_user_id` and resolve the other participant's user id (look up via `conversation_participants` — already known to the hook via `conversationId`; cache it once on mount).

## 5. Rating comment system message — private star, optional comment

In `usePifCompletion.completeWithRating`:
- **Remove** the existing "Piffaren lämnade följande omdöme: ..." plain wording; **do not** post the rating value anywhere in the thread.
- If `comment?.trim()` is non-empty, post a single system message visible to both parties: `"Kommentar från piffaren: ${comment.trim()}"` (no `target_user_id`).
- If no comment, post nothing extra (still post the "Piffen är genomförd!" celebration message).
- The numeric star rating stays only in the `complete_pif_with_rating` RPC payload → DB → public profile aggregate (fix #6).

## 6. Average star rating on public profiles

**Data source:** `interests` table, `receiver_rating` column. The "rated user" is the selected receiver (the row with `selected_at IS NOT NULL` and `user_id = <profile owner>`).

**New helper** in `src/services/ratings.ts`:
```ts
export async function fetchUserRatingSummary(userId: string):
  Promise<{ avg: number; count: number }>
```
Implementation:
```ts
const { data } = await supabase
  .from('interests')
  .select('receiver_rating')
  .eq('user_id', userId)
  .not('receiver_rating', 'is', null);
const ratings = (data ?? []).map(r => r.receiver_rating as number);
return {
  count: ratings.length,
  avg: ratings.length ? ratings.reduce((a,b)=>a+b,0) / ratings.length : 0,
};
```
(Demo mode: read from `useDemoRatingsStore` instead.)

**New component** `src/components/rating/ProfileRatingDisplay.tsx`:
- Props: `userId: string`.
- Fetches via React Query (no cache outside the session); always refetches on mount as requested.
- If `count < 10`: render small muted text "Inte tillräckligt med betyg ännu".
- Else: render 5 SVG stars with **partial fill** using a `linearGradient` per star (or CSS `clip-path: inset(0 X% 0 0)`). For each star index `i` (1..5): fill % = `clamp((avg - (i-1)) * 100, 0, 100)`.
- Append text: `"{avg.toFixed(1)} ★ ({count} recensioner)"`.

**Integrate in `src/pages/PublicProfile.tsx`:** render `<ProfileRatingDisplay userId={profile.id} />` directly below the `<AvatarImage>` and above the name, with `mt-2`. Add SV/EN i18n key for `recensioner` / `reviews` and the not-enough-ratings fallback.

## Files to edit / create

- `src/pages/Messages.tsx` — deep-link ref + URL cleanup (#1)
- `src/utils/distance.ts` + other localStorage readers — self-healing parse (#2)
- `src/hooks/useConversations.ts` — items UPDATE subscription / in-place status patch (#3)
- `src/hooks/usePifCompletion.ts` — targeted system messages, private rating, comment-only message (#4, #5)
- `src/services/ratings.ts` — new `fetchUserRatingSummary` (#6)
- `src/components/rating/ProfileRatingDisplay.tsx` — **new** (#6)
- `src/pages/PublicProfile.tsx` — render the rating component (#6)
- `src/locales/{en,sv}/profile.json` — new strings (#6)

## Out of scope / NOT changed

- No new SQL migrations.
- No changes to `PifRatingModal.tsx` UI beyond removing the "visas för mottagaren" placeholder (comment is now visible to receiver, which the existing copy already says — keep as is).
- No changes to feed / map / posts logic.
