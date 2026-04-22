

## Rebuild Archive / Delete UX

### What you'll get

**Feed (`/feed`)**
- Archiving an item from the three-dots menu opens a simplified, archive-only dialog (no "permanent delete" checkbox, no destructive option from the feed).
- After archiving, the item fades out of the feed instantly (no refresh needed) — already wired via `item-operation-success`, but the dialog will use the same broadcast as the deletion path.

**Profile › My PIFs**
- When an item is archived (from anywhere), it disappears from "My PIFs" instantly via the global `item-operation-success` event (`MyPifsGrid` currently doesn't listen — we'll add the listener).
- When an archived item is restored, it reappears in "My PIFs" instantly via an `item-operation-undone` / `restore` event.

**Profile › Archived tab**
- Layout fix: the archived card becomes non-interactive (the inner `ItemCard` is wrapped so its like/comment/share/interest/three-dots/avatar links are disabled). Only the new action buttons in the top-right are clickable.
- The "Arkiverad" pill that looks like a button is removed (visual badge replaced with a plain inline label, or kept only inside the existing `ItemArchivedBanner` to avoid duplication).
- The duplicated "archived X minutes ago" line under the card is removed (the in-card `ItemArchivedBanner` already shows this).
- Two action buttons stay visible on the top-right: **Restore** (existing, green) and a new **Delete** button (red) next to it.
- Clicking **Delete** opens a confirmation dialog: "Are you sure you want to delete this pif? This action cannot be undone." → on confirm, hard-delete via existing `delete_item_with_related_records` RPC.
- Both Restore and Delete cause the card to fade out of the Archived list immediately (already wired for delete; we'll dispatch the same event for restore).
- Restore now works (currently broken — see Bugfix below).

### Bugfix: Restore returns "Arkivering misslyckades"

Root cause: the `restore_item` RPC referenced in `ArchivedPifsGrid.tsx` and `useItemDeletion.tsx` is not deployed (no migration defines it). The fallback then runs `UPDATE items SET pif_status = NULL`, which violates the `pif_status NOT NULL` constraint shown in your error toast.

Fix (two parts):
1. **Add a `restore_item` RPC migration** (SECURITY DEFINER, owner-only), setting `pif_status = 'active'`, `archived_at = NULL`, `archived_reason = NULL`.
2. **Fix the client fallback** to use `pif_status: 'active'` instead of `null`, so even environments without the RPC succeed.

### Files to change

| File | Change |
|---|---|
| `supabase/migrations/<new>.sql` | Create `public.restore_item(p_item_id bigint) returns boolean` (SECURITY DEFINER, checks `auth.uid() = user_id`). |
| `src/components/item/delete/SimpleDeleteDialog.tsx` | When opened from the feed (non-archived, non-owner-of-archived path), hide the "Archive instead of permanently delete" checkbox and force archive-only mode. Add an `archiveOnly` prop. |
| `src/components/item/ItemCardHeader.tsx` | Pass `archiveOnly` to `SimpleDeleteDialog` when the item is not archived (feed context). For archived items in the dropdown, keep current behavior or hide the menu entirely (see below). |
| `src/components/profile/MyPifsGrid.tsx` | Add `item-operation-success` (archive/delete) and `item-operation-undone` (restore) listeners to remove/refetch instantly. |
| `src/components/profile/ArchivedPifsGrid.tsx` | (a) Wrap each `ItemCard` in a `pointer-events-none` container so the underlying card is non-interactive. (b) Remove the floating "Arkiverad" Badge (banner inside the card already states it). (c) Remove the bottom "archived X ago / reason" block (duplicate of in-card banner). (d) Add a red **Delete** button next to **Restore** with its own confirm dialog. (e) Fix restore fallback to `pif_status: 'active'`. (f) On successful restore, dispatch `item-operation-undone` (so MyPifsGrid/feed/map re-add it) AND fade the card out of the archived list. |
| `src/components/item/delete/useItemDeletion.tsx` | Replace fallback `pif_status: null` with `pif_status: 'active'` (defensive even though main path uses RPC). |
| `src/locales/en/interactions.json`, `src/locales/sv/interactions.json` | Add new keys: `delete_archived_confirm_title`, `delete_archived_confirm_description`, `delete_permanently`, `archive_only_dialog_title`, `archive_only_dialog_description`. |

### Technical notes

- The "instant disappearance" already works in `useOptimizedFeed` and `ArchivedPifsGrid` via the `item-operation-success` document event — `MyPifsGrid` is the missing listener.
- The "non-clickable archived card" is implemented with a wrapping `<div class="pointer-events-none select-none">` around `<ItemCard>`; the action buttons sit in a sibling absolutely-positioned overlay that re-enables pointer events (`pointer-events-auto`).
- The new Delete confirm dialog reuses shadcn `AlertDialog` (no reason field, no archive option) — distinct from the existing archive/delete combined dialog.
- After hard-delete from Archived tab: dispatch `item-operation-success` with `operationType: 'delete'` so the row fades out (already wired).
- After restore: dispatch a new `item-operation-success` with `operationType: 'restore'` (already handled by `useOptimizedFeed`) plus `item-operation-undone` so `MyPifsGrid` / `UserPifsList` refetch and re-add the item.

