import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/hooks/item/utils/userUtils";
import { resolveDisplayName } from "@/utils/displayName";

/**
 * Paginated fetchers for the like / interest / commenter popovers.
 * Each returns up to `limit` users starting at `offset`, plus a
 * `hasMore` flag and `nextOffset` cursor the caller uses for the next
 * page. Designed so popovers stay snappy on items with hundreds of
 * interactions — we never fetch the full list upfront.
 */

export const PAGE_SIZE = 20;
const COMMENT_FETCH_BATCH = 60;

const buildUser = (p: any): User => ({
  id: p.id,
  name: resolveDisplayName(p, "User"),
  avatar: p.avatar_url || undefined,
});

const parseId = (itemId: string | number): number | null => {
  const n = typeof itemId === "number" ? itemId : parseInt(itemId, 10);
  return isNaN(n) ? null : n;
};

const fetchProfiles = async (userIds: string[]): Promise<User[]> => {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", userIds);
  if (error || !data) return [];
  const byId = new Map<string, User>();
  data.forEach((p: any) => byId.set(p.id, buildUser(p)));
  return userIds.map((id) => byId.get(id)).filter(Boolean) as User[];
};

export interface PageResult {
  users: User[];
  hasMore: boolean;
  nextOffset: number;
}

export type FetchPage = (
  offset: number,
  seenIds?: Set<string>
) => Promise<PageResult>;

export const fetchLikersPage = async (
  itemId: string | number,
  offset: number,
  limit: number = PAGE_SIZE
): Promise<PageResult> => {
  const numericId = parseId(itemId);
  if (numericId === null)
    return { users: [], hasMore: false, nextOffset: offset };

  const { data, error } = await supabase
    .from("likes")
    .select("user_id, created_at")
    .eq("item_id", numericId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data)
    return { users: [], hasMore: false, nextOffset: offset };

  const hasMore = data.length > limit;
  const slice = data.slice(0, limit);
  const userIds = [...new Set(slice.map((r: any) => r.user_id))];
  const users = await fetchProfiles(userIds);
  return { users, hasMore, nextOffset: offset + slice.length };
};

export const fetchInterestedUsersPage = async (
  itemId: string | number,
  offset: number,
  limit: number = PAGE_SIZE
): Promise<PageResult> => {
  const numericId = parseId(itemId);
  if (numericId === null)
    return { users: [], hasMore: false, nextOffset: offset };

  const { data, error } = await supabase
    .from("interests")
    .select(
      "user_id, created_at, profiles:user_id(id, first_name, last_name, avatar_url)"
    )
    .eq("item_id", numericId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error || !data)
    return { users: [], hasMore: false, nextOffset: offset };

  const hasMore = data.length > limit;
  const slice = data.slice(0, limit);
  const seen = new Set<string>();
  const users: User[] = [];
  for (const row of slice as any[]) {
    const p = row.profiles;
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    users.push(buildUser(p));
  }
  return { users, hasMore, nextOffset: offset + slice.length };
};

export const fetchCommentersPage = async (
  itemId: string | number,
  offset: number,
  limit: number = PAGE_SIZE,
  seenIds: Set<string> = new Set()
): Promise<PageResult> => {
  const numericId = parseId(itemId);
  if (numericId === null)
    return { users: [], hasMore: false, nextOffset: offset };

  const { data, error } = await supabase
    .from("comments")
    .select("user_id, created_at")
    .eq("item_id", numericId)
    .order("created_at", { ascending: false })
    .range(offset, offset + COMMENT_FETCH_BATCH - 1);

  if (error || !data)
    return { users: [], hasMore: false, nextOffset: offset };

  const hasMore = data.length === COMMENT_FETCH_BATCH;
  const fresh: string[] = [];
  for (const row of data as any[]) {
    const uid = row.user_id;
    if (!uid || seenIds.has(uid) || fresh.includes(uid)) continue;
    fresh.push(uid);
    if (fresh.length >= limit) break;
  }

  const users = await fetchProfiles(fresh);
  return { users, hasMore, nextOffset: offset + data.length };
};
