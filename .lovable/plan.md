# Notifications sort: unread first, then by created_at desc — no category tiebreaker

## Where sorting happens today

- **Query** (`src/hooks/useNotifications.ts` line 208): `.order("created_at", { ascending: false })` — newest-first.
- **Client** (`src/components/notifications/NotificationList.tsx` lines 72–84): re-sorts by (1) `is_read` asc, (2) a category priority (`selected` → `interest` → `other`), (3) `created_at` desc.

The category tiebreaker at step 2 is what breaks the requested ordering: two unread notifications with different types get reordered by category instead of by time.

## Read/unread field

- DB column: `read` (boolean).
- Normalized to `is_read` in the transform (`useNotifications.ts` line 235: `n.read ?? n.is_read ?? false`).
- Renderer uses `n.is_read` throughout — no change needed.

## Fix (client-side sort only)

In `src/components/notifications/NotificationList.tsx`, simplify `sortedNotifications` to two keys only:

```ts
const sortedNotifications = useMemo(() => {
  return [...visibleNotifications].sort((a, b) => {
    const readA = a.is_read ? 1 : 0;
    const readB = b.is_read ? 1 : 0;
    if (readA !== readB) return readA - readB; // unread (0) before read (1)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}, [visibleNotifications]);
```

Also remove the now-unused helpers so the file doesn't accumulate dead code:

- `GROUP_PRIORITY` constant (line 13)
- `categorize` function (lines 47–70)
- `groupDisplayInfo` object (lines 86–90)

The query-level `ORDER BY created_at DESC` stays as-is (harmless, keeps realtime/silent refetches ordered before the client sort runs).

## Scope

- One file: `src/components/notifications/NotificationList.tsx`.
- Presentation only. No hook, query, schema, or i18n changes. No changes to filter pills, mark-as-read, or realtime behavior.
