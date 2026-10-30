// Links that should land on a post *in the feed* rather than on its
// standalone /item/<id> page. The feed scrolls to and highlights the post
// (OptimizedFeedContainer handles ?post=), falling back to /item/<id> when
// it can't be shown there. /item/<id> itself stays the target for share
// links, which open for people who may not be logged in.

export const DRAFTS_FEED_PATH = "/feed?view=drafts";

/** `/feed?post=<id>`, plus any extra query params (comment, selectReceiver). */
export function feedPostPath(itemId: string | number, extra?: URLSearchParams | string): string {
  const params = new URLSearchParams(extra);
  params.delete("post");
  const rest = params.toString();
  return `/feed?post=${encodeURIComponent(String(itemId))}${rest ? `&${rest}` : ""}`;
}

/**
 * Rewrites an in-app notification target to its feed equivalent:
 * `/item/42?comment=7` -> `/feed?post=42&comment=7`, `/drafts` -> the
 * feed's drafts view. Anything else is returned unchanged. Stored
 * notifications keep their original action_url; this runs at render time
 * so old and new rows behave the same.
 */
export function toFeedLink(url: string): string {
  const item = /^\/item\/(\d+)\/?(?:\?(.*))?$/.exec(url);
  if (item) return feedPostPath(item[1], item[2] ?? "");
  if (/^\/drafts\/?$/.test(url)) return DRAFTS_FEED_PATH;
  return url;
}
