import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FeedSkeletonProps {
  /** How many placeholder cards to render. */
  count?: number;
  /** Optional className applied to the wrapper. */
  className?: string;
}

/**
 * Placeholder cards shown while the feed is fetching/refreshing.
 *
 * The shape mirrors the real `ItemCard`: header (avatar + name + meta),
 * media area, title/description lines, and an action row. Keeping the
 * skeleton dimensions close to the real card avoids layout shift when
 * the actual content lands.
 */
export function FeedSkeleton({ count = 3, className }: FeedSkeletonProps) {
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading posts"
    >
      {Array.from({ length: count }).map((_, i) => (
        <FeedSkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading posts…</span>
    </div>
  );
}

function FeedSkeletonCard() {
  return (
    <div
      className="rounded-lg border border-border bg-card overflow-hidden"
      aria-hidden="true"
    >
      {/* Header: avatar + name/meta + type badge */}
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Media area — fixed aspect ratio matches the real card image. */}
      <Skeleton className="h-56 w-full rounded-none" />

      {/* Title + description */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>

      {/* Action row: like / comment / interest / bookmark */}
      <div className="flex items-center justify-between gap-4 px-4 pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </div>
  );
}
