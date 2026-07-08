## Lovable implementation plan for approval

### Findings

**FIX 2 root cause — hide own posts**

The toggle state is wired correctly, and `applyPostFilters` is called correctly, but the owner comparison checks the wrong field for the map/feed data shape.

Exact code path:

```tsx
// MapFiltersSheet.tsx
<button
  type="button"
  onClick={() => onHideOwnPostsChange(!hideOwnPosts)}
  aria-pressed={hideOwnPosts}
>
```

```tsx
// MapContainer.tsx
const hideOwnPosts = useFeedFiltersStore((s) => s.hideOwnPosts);
const setHideOwnPosts = useFeedFiltersStore((s) => s.setHideOwnPosts);

<MapFiltersSheet
  hideOwnPosts={hideOwnPosts}
  onHideOwnPostsChange={guarded(setHideOwnPosts)}
/>
```

```ts
// feedFiltersStore.ts
setHideOwnPosts: (hideOwnPosts) => {
  set({ hideOwnPosts });
  persist(get());
},
```

```tsx
// MapContainer.tsx
const finalFilteredPosts = applyPostFilters(
  filteredPosts,
  {
    categories: selectedCategories,
    conditions: selectedConditions,
    itemTypes: selectedItemTypes,
    onlyInterested,
    hideOwnPosts,
    currentUserId: user?.id ?? null,
  },
  myInterestedIds,
);
```

```tsx
// MapContainer.tsx
<MapMarkersLayer
  map={map}
  posts={finalFilteredPosts}
  onPostClick={guarded(onPostClick)}
  targetItemId={targetItemId}
  currentUserId={user?.id ?? null}
/>
```

Then:

```tsx
// MapMarkersLayer.tsx -> useClusterInit.ts -> useViewportMarkers.ts
posts={finalFilteredPosts}
validPosts = posts.filter(...)
enhancedPostsRef.current = enhancedPosts
createPostMarker(enhancedPost)
```

The output variable is **`finalFilteredPosts`**, and yes, that exact variable is passed to marker rendering.

The failure is inside `applyPostFilters`:

```ts
if (
  hideOwnPosts &&
  currentUserId &&
  post.postedBy?.id != null &&
  String(post.postedBy.id) === String(currentUserId)
) {
  return false;
}
```

But the map page gets posts from `useFeedPosts -> useFetchPosts`, whose transform returns this shape:

```ts
return {
  id: item.id,
  title: item.title,
  ...
  user_id: item.user_id,
  user_name: user.name,
  user_avatar: user.avatar || ''
};
```

It does **not** populate `postedBy`. So `post.postedBy?.id` is undefined, the condition never passes, and own posts remain visible.

**FIX 3 root cause — own-post ring**

Same data-shape mismatch.

`useMarkerFactory.ts` currently computes ownership like this:

```ts
const isOwn =
  !!currentUserId &&
  post.postedBy?.id != null &&
  String(post.postedBy.id) === String(currentUserId);
```

But the marker receives map/feed posts with `user_id`, not `postedBy.id`, so `isOwn` is always `false` for this path.

That means `createMarkerElement({ isOwn })` receives `isOwn: false`, so the marker gets the normal shadow:

```ts
markerDot.style.boxShadow = isOwn
  ? "0 0 0 3px hsl(174 72% 30%), 0 2px 8px rgba(0,0,0,0.35)"
  : "0 2px 6px rgba(0,0,0,0.3)";
```

So the expected DevTools result is: **the own-post ring box-shadow is not present**; this is not primarily an `overflow:hidden` clipping issue.

### Implementation plan

1. Add a small owner-id fallback in `applyPostFilters`:
   - Prefer `post.user_id` when present.
   - Fall back to `post.postedBy?.id` for canonical `Post` objects.
   - Compare with `String(ownerId) === String(currentUserId)`.

2. Apply the same fallback in `useMarkerFactory.ts`:
   - `const ownerId = (post as any).user_id ?? post.postedBy?.id;`
   - `const isOwn = !!currentUserId && ownerId != null && String(ownerId) === String(currentUserId);`

3. Update the `Post` type to acknowledge the existing optional raw fields used by this app path:
   - `user_id?: string | number;`
   - optionally `user_name` / `user_avatar` only if TypeScript needs them.

4. Keep marker rendering source unchanged otherwise:
   - `finalFilteredPosts` already flows into `MapMarkersLayer`.
   - No server-side `user_id` exclusion will be added; this remains client-side as designed.

5. No temporary `console.log` will remain in the final code, matching the project logging rule.