# Comments: Smoother UX, full realtime, two-level nesting

## 1. Smooth "add comment" UX (no flicker, scroll-to-new)

**Problem:** After posting, `LazyCommentsSection.handleAddCommentWithRefetch` calls `refreshComments()`, which sets `isInitialized = false` and re-runs `loadComments`. This briefly hides the list and shows the loading skeleton — that's the "glitch".

**Fix:**
- Remove the post-insert `refreshComments()` call. The optimistic insert in `useCommentCreate` already appends the new comment to state, and realtime/polling already covers any miss.
- In `useLazyComments.refreshComments`, do not reset `isInitialized` when there are already comments in state — just refetch and merge. This prevents skeleton flicker on any future trigger too.
- After a successful add, scroll to the new comment:
  - Wrap each rendered comment in `CommentList` with a `data-comment-id` ref.
  - Pass a `newCommentId` prop (or expose a ref/handler) from `LazyCommentsSection` → `CommentsPanel` → `CommentList`.
  - On mount/update, if the new id is in the list and not in viewport, `element.scrollIntoView({ behavior: "smooth", block: "nearest" })`. If it is in viewport (fits within current UI), do nothing — it just appears.
- Keep the existing optimistic append so the comment shows up immediately.

## 2. Replies (comments-on-comments) realtime

**Problem:** `useCommentInteractions.handleReplyToComment` only mutates local React state. Replies are never written to the database, so they are not realtime, not persisted, and lost on reload.

**Fix:**
- Persist replies in the existing `comments` table using the existing `parent_id` column.
  - In `useCommentCreate`, add a `parentId?: string` arg. When provided, include `parent_id: parseInt(parentId)` in the insert payload.
  - Replace the local-only `handleReplyToComment` with a real handler that calls the new `addReply(parentId, text)` (server-backed; demo-mode branch keeps local store behavior).
- Fetch replies:
  - Update the comment fetch query (in `useComments`/`useCommentData` and `useCommentAdd` selects) to also load child rows. Either:
    - Fetch all rows for the item (without `.is('parent_id', null)`) and group children under their parent in the formatter, or
    - Keep two queries (parents + children) and stitch.
  - Update `formatCommentFromDB` / list builder to populate `replies: Comment[]`.
- Realtime: `useCommentRealtime` already subscribes to all INSERT/UPDATE/DELETE on `comments` filtered by `item_id`. Update its insert/update/delete handlers to walk into `replies` when the row has a `parent_id`, so replies appear/update/disappear live for everyone.

## 3. Comment likes realtime

**Problem:** `useCommentInteractions.handleLikeComment` is pure local state — likes are never persisted and never broadcast.

**Fix (DB + realtime):**
- Add a `comment_likes` table (migration): `id uuid pk`, `comment_id bigint fk → comments.id on delete cascade`, `user_id uuid fk → auth.users(id) on delete cascade`, `created_at timestamptz default now()`, unique `(comment_id, user_id)`. RLS: anyone authenticated can insert their own row; anyone can select; only owner can delete.
- New hook `useCommentLike(commentId)` — toggles via insert/delete, optimistic update.
- New realtime hook `useCommentLikesRealtime(itemId)` — single channel subscribed to `comment_likes` (no item-level filter on this table; filter client-side by mapping to comment ids in the current list, or join via a view). On any change, recompute counts/isLiked for affected comment + reply and update via `setComments`.
- Replace the local `handleLikeComment` in `useCommentInteractions` with the DB-backed version. Demo mode keeps current local behavior.

## 4. Limit nesting to two levels

**Fix:** In `src/components/comments/CommentCard.tsx`, change `const maxReplyLevel = 3;` to `const maxReplyLevel = 1;`. This hides the Reply button on already-nested replies (level 1), so only `[comment]` and `[reply]` exist. Also guard `handleReplyToComment` so a reply to a level-1 comment is treated as a reply to its parent (defensive; the UI already prevents it).

## Files to touch

- `src/components/comments/CommentCard.tsx` — maxReplyLevel = 1; pass `data-comment-id`.
- `src/components/comments/CommentList.tsx` / `CommentsPanel.tsx` / `LazyCommentsSection.tsx` — pipe `newCommentId` for scroll-to; remove post-insert `refreshComments` flicker.
- `src/hooks/comments/useLazyComments.ts` — `refreshComments` no longer resets `isInitialized` when list non-empty.
- `src/hooks/comments/useCommentCreate.ts` — accept `parentId`; insert with `parent_id`.
- `src/hooks/comments/useCommentInteractions.ts` — replace local reply + like with DB-backed versions.
- `src/hooks/comments/useCommentActions.ts` — wire new reply signature `(parentId, text)`.
- `src/hooks/comments/useCommentRealtime.ts` — handle insert/update/delete for rows with `parent_id` (replies).
- `src/hooks/item/useComments.ts` / `useCommentData.ts` / `useCommentAdd.ts` — fetch + format replies.
- New: `src/hooks/comments/useCommentLike.ts`, `src/hooks/comments/useCommentLikesRealtime.ts`.
- New migration: `comment_likes` table + RLS.

## Out of scope
- No design changes beyond the two-level limit.
- No changes to feed/map refresh logic.
