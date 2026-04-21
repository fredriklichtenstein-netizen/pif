

## Bug: wishes show as Pifs in the feed (but correctly on the map)

### Root cause

The feed and the map fetch from `items` through different code paths:

- **Map** uses `select('*')` style queries — `item_type` is included, so wishes render as wishes.
- **Feed** uses `OptimizedQueries.getPosts` in `src/services/database/queries.ts`, which uses an explicit column list:

```ts
.select(`
  id, title, description, images, location, coordinates,
  category, condition, measurements, user_id, pif_status,
  archived_at, archived_reason, created_at,
  profiles!items_user_id_fkey(...)
`)
```

`item_type` is **missing** from this list. The row arriving at `transformPostData` therefore has `item.item_type === undefined`, and the normalization defaults to `'offer'`:

```ts
const rawType = String(item.item_type || 'offer').toLowerCase();
// undefined → 'offer' → every card renders as a Pif
```

Downstream defensive normalizations in `FeedItemCard` (`'wish' → 'request'`) and `ItemCardLayout`/`ItemCardGallery` (color, badge, border) are correct — they just never see anything other than `'offer'`, because the field was dropped at the SQL layer.

This also explains why previous fix attempts failed: they patched the rendering/normalization layer, not the SELECT.

### Fix (single line, single file)

**File:** `src/services/database/queries.ts` — `OptimizedQueries.getPosts`

Add `item_type` to the explicit select list:

```ts
.select(`
  id, title, description, images, location, coordinates,
  category, condition, measurements, user_id, pif_status,
  item_type,
  archived_at, archived_reason, created_at,
  profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)
`)
```

### Cache invalidation

`getOptimizedPosts` and `transformCache` cache results for 5 minutes keyed by `posts-v2-…` and `transform-v2-…`. The `v2` keys mean a fresh deploy will not collide with the old cache, so existing users will pick up correct types on the next fetch. No code change needed for cache busting; if needed for in-session users, a hard refresh clears it.

### Verification

1. Create a new wish from `/post?type=request`.
2. On `/feed`, the new card should show:
   - Amber "Önskning" badge with star icon (not green "Pif" with gift).
   - Left border `border-l-pif-wish` (amber) instead of `border-l-pif-offer` (green).
3. The same item on `/map` continues to render as a wish (unchanged behavior).
4. Existing wishes already in the database also flip to the correct rendering after the cache TTL or refresh.

### Out of scope

- No changes to `transformPostData`, `FeedItemCard`, `ItemCardGallery`, `ItemCardLayout`, or any rendering logic — they are already correct.
- No DB migration — `item_type` already exists on `items` and is being written correctly by `usePostFormSubmission`.
- No changes to the map path.

