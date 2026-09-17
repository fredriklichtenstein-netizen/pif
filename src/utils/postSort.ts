import { calculateDistance } from "@/utils/distance";
import type { Post } from "@/types/post";

export type FeedSortMode = "recent" | "distance";

/**
 * Trello: "Sort the feed on distance and/or on published time."
 *
 * "recent" is a no-op -- getOptimizedPosts()/OptimizedQueries.getPosts()
 * already orders the server query by created_at DESC (see
 * src/services/database/queries.ts), so the feed's natural/default order
 * already IS most-recent-first. This function only has real work to do
 * for "distance".
 *
 * Sorting is client-side, over whatever's already been paginated in --
 * consistent with the existing distance FILTER (useDistanceFiltering),
 * which is likewise client-side over the loaded posts rather than a
 * server-side spatial query. This means a closer post that hasn't been
 * paginated in yet won't jump ahead of what's already loaded until the
 * user scrolls further -- an accepted, honest limitation matching the
 * filter's existing behavior, not a new one introduced here.
 *
 * Posts without usable coordinates (or when the viewer's own location is
 * unknown) sort to the end, keeping their relative (recency) order among
 * themselves -- never silently dropped, never given a fake "0km" distance.
 */
export function sortPosts(
  posts: Post[],
  sortBy: FeedSortMode,
  userLocation: [number, number] | null,
): Post[] {
  if (sortBy !== "distance" || !userLocation) {
    return posts;
  }

  const [userLng, userLat] = userLocation;

  const withDistance = posts.map((post, index) => {
    const coords = post.coordinates;
    let distance: number | null = null;
    if (coords && typeof coords.lng === "number" && typeof coords.lat === "number") {
      const d = calculateDistance(userLng, userLat, coords.lng, coords.lat);
      distance = Number.isNaN(d) ? null : d;
    }
    return { post, distance, index };
  });

  withDistance.sort((a, b) => {
    if (a.distance === null && b.distance === null) return a.index - b.index;
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return withDistance.map((entry) => entry.post);
}
