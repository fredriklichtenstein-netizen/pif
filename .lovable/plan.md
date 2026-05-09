# Interest → Selection → Messaging Flow Fix

## Goals (steps 1–4 from the brief)

1. Click "Interest" → button flips to active and counter increments (already works after the recent realtime fixes).
2. Click the counter → consistent popover everywhere (feed, profile, expanded post) listing interested users. **If the current user is the piffer (item owner), the same popover lets them select a receiver.**
3. When someone shows interest, the piffer gets a **realtime notification** with the actor's name as a clickable link to that user's public profile.
4. When the piffer selects a receiver, the receiver gets a realtime notification, and a conversation between piffer and receiver opens up.

## Current state (what's broken)

| Concern | Status today |
|---|---|
| Counter popup parity | Feed / expanded post show only a name list (`PaginatedUserList`). Selection UI lives in a separate `InterestUsersPopover` rendered only on the profile page's `MyPifsGrid` / `UserPifsList`. |
| Realtime notifications to piffer | `useNotifications` is realtime-subscribed per user, but no DB trigger creates a notification when an interest row is inserted, so nothing arrives. |
| Notification rendering | `useNotifications` stuffs the raw `payload` JSON into `content` and uses `n.type` as `title`. UI shows raw type strings and stringified JSON, no clickable actor link. |
| Receiver-selected notification | `select_receiver` RPC returns a `conversationId`, but it's unclear whether it inserts a notification for the receiver. To be safe, we add a trigger on `interests` status change. |
| Messaging deep-link | `Messages.tsx` ignores `?conversation=<id>`, so the deep-link from the toast / notification doesn't auto-open the conversation. |

## Plan

### 1. Shared "interested users" list component

Create `src/components/post/interactions/interest/InterestSelectionList.tsx`. Single source of truth for the list rendered inside any interest popover. It:

- Loads paginated interested users for `itemId` (reusing the existing `fetchInterestedUsersPage`).
- Subscribes to the shared per-item realtime channel for `interests` and reloads on change (same pattern as `PaginatedUserList`).
- Renders each row: avatar + name as a `<Link to="/user/:id" target="_blank">` (always — so anyone can open the user's public profile).
- When `isOwner` is true: shows `TrustIndicator`, "Select" button, "Selected" badge, "Withdraw" button — reusing the logic currently in `src/components/profile/InterestUsersPopover.tsx`.
- Calls the existing `select_receiver` RPC, then navigates to `/messages?conversation=<id>`.

Wire it into:

- `CounterButton` / `PaginatedUserList`: when `type === "interest"`, render `InterestSelectionList` instead of the plain paginated list, and pass `itemId` + `itemOwnerId` + `currentUserId`. Plain `PaginatedUserList` keeps handling `like` / `comment`.
- `InteractionButtonWithPopup` already receives `itemId`; thread `itemOwnerId` (from each call site) down through `PrimaryActions` and `ActionButtons`.
- The two existing `InterestUsersPopover` files in `src/components/profile/` and `src/components/profile/interest/` collapse to a thin wrapper around `InterestSelectionList` so the profile grid uses the same component.

Outcome: identical interest popover behavior on feed, expanded post, and profile.

### 2. Notifications data model + rendering

Update `src/hooks/useNotifications.ts` to read the structured payload instead of stringifying it:

```ts
const transformed = (data ?? []).map((n) => {
  const p = (n.payload ?? {}) as Record<string, any>;
  return {
    id: String(n.id),
    user_id: n.user_id,
    type: n.type,                      // 'interest_received' | 'receiver_selected' | ...
    actor_id: p.actor_id ?? null,
    actor_name: p.actor_name ?? null,
    item_id: p.item_id ?? null,
    item_title: p.item_title ?? null,
    conversation_id: p.conversation_id ?? null,
    is_read: n.read ?? false,
    created_at: n.created_at,
  };
});
```

Update `NotificationList.tsx`:

- For `type === "interest_received"`: render `t('notifications.interest_received', { name })` with the name wrapped in a `<Link to="/user/:actor_id">` and a CTA to `/post/:item_id`.
- For `type === "receiver_selected"`: keep existing copy + deep-link to `/messages?conversation=:conversation_id`.
- Add the matching `notifications.*` strings to `src/locales/{en,sv}/interactions.json`.

### 3. DB triggers for notifications

Add a migration `supabase/migrations/<ts>_interest_notifications.sql`:

```sql
-- Notify the item owner whenever someone shows interest.
create or replace function public.notify_interest_received()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_actor_name text;
  v_item_title text;
begin
  select user_id, title into v_owner, v_item_title from items where id = new.item_id;
  if v_owner is null or v_owner = new.user_id then
    return new;
  end if;
  select coalesce(first_name || ' ' || coalesce(last_name, ''), 'Someone')
    into v_actor_name from profiles where id = new.user_id;

  insert into notifications (user_id, type, payload, read)
  values (
    v_owner,
    'interest_received',
    jsonb_build_object(
      'actor_id', new.user_id,
      'actor_name', v_actor_name,
      'item_id', new.item_id,
      'item_title', v_item_title
    ),
    false
  );
  return new;
end $$;

drop trigger if exists trg_notify_interest_received on interests;
create trigger trg_notify_interest_received
after insert on interests
for each row execute function public.notify_interest_received();

-- Notify the receiver when the piffer selects them.
create or replace function public.notify_receiver_selected()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_conversation_id uuid;
  v_item_title text;
begin
  if new.status = 'selected' and (old.status is distinct from 'selected') then
    select id into v_conversation_id from conversations
      where item_id = new.item_id
        and (buyer_id = new.user_id or seller_id = new.user_id)
      order by created_at desc limit 1;
    select title into v_item_title from items where id = new.item_id;

    insert into notifications (user_id, type, payload, read)
    values (
      new.user_id,
      'receiver_selected',
      jsonb_build_object(
        'item_id', new.item_id,
        'item_title', v_item_title,
        'conversation_id', v_conversation_id
      ),
      false
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_receiver_selected on interests;
create trigger trg_notify_receiver_selected
after update on interests
for each row execute function public.notify_receiver_selected();
```

Column names (`profiles.first_name`, `conversations.buyer_id` / `seller_id`, etc.) will be verified against the live schema before the migration is committed and adjusted if needed. The trigger is idempotent (`drop … if exists`) so re-running is safe even if a similar trigger already exists.

### 4. Messages deep-link

In `src/pages/Messages.tsx`, read `?conversation=<id>` from `useSearchParams` on mount and call `setActiveConversationId` so the receiver lands directly in the right conversation when they tap the notification or the toast.

### 5. Verification checklist (after build)

- Feed card → Interest → counter shows; counter popup opens. Same on expanded post and on the profile pifs grid.
- Logged in as piffer, opening any of those popups, "Select" button appears for pending interest rows; pressing it navigates to `/messages?conversation=…` and the conversation auto-opens.
- Logged in as the interested user: notification appears in real time on the piffer's session listing the actor's name as a clickable link to `/user/<id>`.
- Logged in as the selected receiver: notification appears in real time with a "Start the conversation" CTA that opens the right conversation.

## Out of scope (queued for follow-up)

- Push / email notification delivery.
- Bulk-select multiple receivers for a request (reverse direction).
- Selection withdrawal notifications.
