import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import type { User } from "@/hooks/item/useItemInteractions";
import type { FetchPage } from "@/services/interactions/fetchPaginatedUsers";
import {
  subscribeItemTable,
  type ItemTable,
} from "@/services/realtime/itemRealtimeManager";

interface PaginatedUserListProps {
  type: "like" | "interest" | "comment";
  fetchPage: FetchPage;
  setShowPopup: (show: boolean) => void;
  /** When provided, the list refreshes itself on realtime changes for this item. */
  itemId?: string | number;
}

const TYPE_TO_TABLE: Record<"like" | "interest" | "comment", ItemTable> = {
  like: "likes",
  interest: "interests",
  comment: "comments",
};

/**
 * Lazy, paginated user list rendered inside the like / interest /
 * commenter popovers. Loads the first page on mount and subsequent
 * pages via an IntersectionObserver sentinel as the user scrolls.
 *
 * Carries `seenIds` between calls so the commenter fetcher can dedupe
 * across pages.
 */
export function PaginatedUserList({
  type,
  fetchPage,
  setShowPopup,
}: PaginatedUserListProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const offsetRef = useRef(0);
  const seenRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const inFlightRef = useRef(false);

  const titleKey =
    type === "like"
      ? "interactions.liked"
      : type === "interest"
      ? "common.interested_users"
      : "interactions.commented";

  const emptyKey =
    type === "like"
      ? "common.no_likes_yet"
      : type === "interest"
      ? "profile.no_interest_yet"
      : "comments.no_comments";

  const loadNext = useCallback(
    async (initial = false) => {
      if (inFlightRef.current) return;
      if (!initial && !hasMore) return;
      inFlightRef.current = true;
      if (initial) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await fetchPage(offsetRef.current, seenRef.current);
        offsetRef.current = res.nextOffset;
        res.users.forEach((u) => seenRef.current.add(u.id));
        setUsers((prev) => (initial ? res.users : [...prev, ...res.users]));
        setHasMore(res.hasMore);
        setError(null);
      } catch (err) {
        console.error(`[PaginatedUserList:${type}] fetch failed`, err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        if (initial) setLoading(false);
        else setLoadingMore(false);
        inFlightRef.current = false;
      }
    },
    [fetchPage, hasMore, type]
  );

  // Initial page on mount.
  useEffect(() => {
    offsetRef.current = 0;
    seenRef.current = new Set();
    setUsers([]);
    setHasMore(true);
    loadNext(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver to auto-load next page as the sentinel scrolls into view.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          loadNext(false);
        }
      },
      { root: node.parentElement, rootMargin: "40px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNext, hasMore, loadingMore, loading]);

  return (
    <div className="max-h-[300px] overflow-y-auto">
      <div className="flex justify-between items-center mb-3 sticky top-0 bg-white">
        <h3 className="font-semibold text-sm">{t(titleKey)}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPopup(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">{t("status.loading")}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-sm">
          {t(emptyKey)}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          ))}

          <div ref={sentinelRef} className="h-4" />

          {loadingMore && (
            <div className="py-2 text-center">
              <div className="animate-spin inline-block h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}

          {!hasMore && users.length > 0 && (
            <div className="text-center text-xs text-gray-400 py-2">
              {t("common.end_of_list", "End of list")}
            </div>
          )}

          {error && (
            <div className="text-center text-xs text-red-500 py-2">
              {t("common.unable_to_load_list", "Could not load list")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
