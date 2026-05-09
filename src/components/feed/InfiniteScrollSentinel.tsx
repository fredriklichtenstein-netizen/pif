import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  /** Distance from viewport at which to trigger loading the next page. */
  rootMargin?: string;
}

/**
 * A zero-height div that triggers `onLoadMore` once the user scrolls
 * within `rootMargin` of it. Used to replace the manual "Load more"
 * button with seamless infinite scrolling.
 */
export function InfiniteScrollSentinel({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "400px 0px",
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isLoading) {
            onLoadMore();
          }
        }
      },
      { rootMargin },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin]);

  if (!hasMore) return null;
  return <div ref={ref} aria-hidden="true" className="h-px w-full" />;
}
