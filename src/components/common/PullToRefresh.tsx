import { useEffect, useRef, useState, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** Extra px the user must drag past the threshold before refresh fires. */
  threshold?: number;
  /** Max visual pull distance in px. */
  maxPull?: number;
  /** Disable the gesture (e.g. while another loader runs). */
  disabled?: boolean;
  className?: string;
}

/**
 * Touch-driven pull-to-refresh wrapper. Activates only when the page is
 * scrolled to the very top so it doesn't fight normal scrolling. On
 * desktop / non-touch devices it is a no-op (use a button instead).
 */
export function PullToRefresh({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 120,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const { t } = useTranslation();
  const startYRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (disabled) return;

    const isAtTop = () => {
      const el = document.scrollingElement || document.documentElement;
      return (el?.scrollTop ?? 0) <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing || !isAtTop() || e.touches.length !== 1) {
        startYRef.current = null;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      activeRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        setPull(0);
        activeRef.current = false;
        return;
      }
      // Engage only once the user has clearly pulled down at the top.
      if (!activeRef.current && dy > 8) activeRef.current = true;
      if (!activeRef.current) return;
      // Resist the pull so it feels rubber-banded.
      const eased = Math.min(maxPull, dy * 0.55);
      setPull(eased);
      // Prevent the page from also scrolling while we're pulling.
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      const shouldRefresh = activeRef.current && pull >= threshold;
      startYRef.current = null;
      activeRef.current = false;
      if (shouldRefresh) {
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [disabled, refreshing, pull, threshold, maxPull, onRefresh]);

  const ready = pull >= threshold;
  const indicatorOpacity = Math.min(1, pull / threshold);

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator */}
      <div
        aria-hidden={!refreshing && pull === 0}
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-hidden"
        style={{
          height: refreshing ? threshold : pull,
          transition: refreshing || pull === 0 ? "height 200ms ease" : "none",
        }}
      >
        <div
          className="mt-2 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm border border-border"
          style={{ opacity: refreshing ? 1 : indicatorOpacity }}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 transition-transform",
              refreshing && "animate-spin"
            )}
            style={{
              transform: refreshing
                ? undefined
                : `rotate(${Math.min(360, pull * 3)}deg)`,
            }}
            aria-hidden="true"
          />
          <span>
            {refreshing
              ? t("interactions.refreshing_feed")
              : ready
              ? t("interactions.release_to_refresh")
              : t("interactions.pull_to_refresh")}
          </span>
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${refreshing ? threshold : pull}px)`,
          transition: refreshing || pull === 0 ? "transform 200ms ease" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
