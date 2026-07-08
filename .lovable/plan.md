## Lovable implementation plan for approval

### Root cause

The `note` argument is dropped in **one place** on the submit path used by feed cards, so `interests.note` is never written.

Full trace (working path first, break at the end):

1. `GrantWishDialog` → `onConfirm(trimmed)` — note captured ✅
2. `InteractionButtonWithPopup.handleGrantConfirm(note)` → `await onClick(note)` ✅
3. Wired via `PrimaryActions`/`ActionButtons.onClick={onShowInterest}` — JS still forwards the arg at runtime even where TS types drop it ✅
4. Card-level `onShowInterest={handleShowInterest}` (from `useItemCard` → `useItemInteractions`) ✅
5. **`src/hooks/item/useItemInteractions.tsx:50-57`** — `safeHandleShowInterest` is defined as `async () => { await handleShowInterest(); }`. This wrapper takes **no argument** and calls the underlying handler with **no argument**. The note is thrown away here. ❌
6. Downstream (`useInterests.ts:165` → `useInterestActions.handleShowInterest` → `addInterest`) already forwards `note` correctly and upserts it. Verified `addInterest` includes `note` in the payload when present, and `interests.note` column exists.

So the note is fetched by the dialog and forwarded correctly until step 5, where the "safe wrapper" strips it. That is why every `interests` row has `note = null`.

### Fix

**File:** `src/hooks/item/useItemInteractions.tsx`

Change `safeHandleShowInterest` to accept and forward the optional note:

```ts
const safeHandleShowInterest = async (note?: string) => {
  try {
    await handleShowInterest(note);
  } catch (error) {
    console.error("Error in handleShowInterest:", error);
  }
};
```

No other files need to change:
- `useInterests.ts` already returns `(note?: string) => originalHandleShowInterest(id, userId, note)`.
- `useInterestActions.addInterest` already upserts `note` with `ignoreDuplicates: !note` so a fresh note overwrites an existing row.
- `GrantWishDialog`, `InteractionButtonWithPopup`, `PrimaryActions`, `ActionButtons`, `ItemInteractions` already forward the arg at runtime.

### Validation

1. As a non-owner, open a wish, click "I can help", submit a note ≥4 chars.
2. Verify `interests` row for that (user_id, item_id) has `note = <submitted text>`.
3. Owner opens the fulfiller list popup → note appears under the helper row (FIX 2A already in place).
4. Owner selects that helper → conversation opens with the note pinned as the sticky amber context card at top (FIX 2B already in place).

### Out of scope

- TS signature widening of `onShowInterest: () => void` in `src/components/post/` (cosmetic only; runtime already forwards).
- Any DB migration — `interests.note` column is confirmed present.
