/**
 * Centralized cache invalidation for user-scoped data.
 *
 * Call on sign-out OR when the active user id changes (account switching),
 * so a new user never sees the previous user's profile, avatar or items.
 */
import { clearAllCachedProfiles } from "@/hooks/profile/useCachedProfile";
import { clearAllItemsCache } from "@/hooks/cache/itemCache";

export const clearAllUserCaches = () => {
  try {
    clearAllCachedProfiles();
  } catch (err) {
    console.warn("clearAllUserCaches: profile clear failed", err);
  }
  try {
    clearAllItemsCache();
  } catch (err) {
    console.warn("clearAllUserCaches: items clear failed", err);
  }
};
