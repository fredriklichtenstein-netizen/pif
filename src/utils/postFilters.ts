import type { Post } from "@/types/post";

export interface PostFilterCriteria {
  categories: string[];
  conditions: string[];
  itemTypes: string[];
  onlyInterested: boolean;
  hideOwnPosts?: boolean;
  currentUserId?: string | null;
}

/**
 * Single predicate used by both the feed and the map so the two views
 * always agree on which posts pass. Mirrors the legacy in-place filter
 * previously inlined in `MapContainer`.
 */
export function applyPostFilters(
  posts: Post[],
  filters: PostFilterCriteria,
  interestedIds: Set<string>,
): Post[] {
  const {
    categories,
    conditions,
    itemTypes,
    onlyInterested,
    hideOwnPosts,
    currentUserId,
  } = filters;
  return posts.filter((post) => {
    if (
      itemTypes.length > 0 &&
      !itemTypes.includes(post.item_type || "offer")
    ) {
      return false;
    }
    if (
      categories.length > 0 &&
      (!post.category || !categories.includes(post.category))
    ) {
      return false;
    }
    if (
      conditions.length > 0 &&
      (!post.condition || !conditions.includes(post.condition))
    ) {
      return false;
    }
    if (onlyInterested && !interestedIds.has(String(post.id))) {
      return false;
    }
    if (
      hideOwnPosts &&
      currentUserId &&
      post.postedBy?.id != null &&
      String(post.postedBy.id) === String(currentUserId)
    ) {
      return false;
    }
    return true;
  });
}
