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
  /**
   * CSS selector for descendants that should NOT trigger the pull
   * (e.g. interactive Mapbox canvas). Touches starting inside a
   * matching element are ignored.
   */
  ignoreSelector?: string;
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
  ignoreSelector,
  className,
}: PullToRefreshProps) {
  const { t } = useTranslation();
  const startYRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  // Synchronous lock that flips to true the instant a refresh is
  // triggered. Touch handlers consult this ref (not the React state,
  // which updates on the next render) so a fast follow-up gesture
  // cannot start a second overlapping reload.
  const refreshingRef = useRef(false);
  // Tracks whether we've already buzzed for the current pull gesture so
  // the haptic only fires once when the user crosses the threshold.
  const hapticFiredRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Subtle haptic helper. Safely no-ops on devices without the API
  // (most desktop browsers and iOS Safari).
  const vibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(pattern);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (disabled) return;

    const isAtTop = () => {
      const el = document.scrollingElement || document.documentElement;
      return (el?.scrollTop ?? 0) <= 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || !isAtTop() || e.touches.length !== 1) {
        startYRef.current = null;
        return;
      }
      if (ignoreSelector) {
        const target = e.target as Element | null;
        if (target && target.closest && target.closest(ignoreSelector)) {
          startYRef.current = null;
          return;
        }
      }
      startYRef.current = e.touches[0].clientY;
      activeRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current == null || refreshingRef.current) return;
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
      // Fire a single short buzz the first time the user crosses the
      // refresh threshold during this gesture.
      if (!hapticFiredRef.current && eased >= threshold) {
        hapticFiredRef.current = true;
        vibrate(10);
      } else if (hapticFiredRef.current && eased < threshold) {
        // Allow re-firing if the user pulls back up and down again.
        hapticFiredRef.current = false;
      }
      setPull(eased);
      // Prevent the page from also scrolling while we're pulling.
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = async () => {
      // Ignore release events that happen while a refresh is already
      // in flight — we never want to fire onRefresh a second time.
      if (refreshingRef.current) {
        startYRef.current = null;
        activeRef.current = false;
        return;
      }
      const shouldRefresh = activeRef.current && pull >= threshold;
      startYRef.current = null;
      activeRef.current = false;
      hapticFiredRef.current = false;
      if (shouldRefresh) {
        // Lock synchronously so any in-flight gesture is a no-op.
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(threshold);
        try {
          await onRefresh();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPull(0);
          // Gentle double-tap buzz to confirm the refresh finished.
          vibrate([15, 40, 15]);
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
  }, [disabled, pull, threshold, maxPull, onRefresh, ignoreSelector]);

  const ready = pull >= threshold;
  const indicatorOpacity = Math.min(1, pull / threshold);

  return (
    <div className={cn("relative", className)}>
      {/* Pull indicator — fixed at top of viewport, above sticky header */}
      <div
        aria-hidden={!refreshing && pull === 0}
        className="pointer-events-none fixed top-1 left-1/2 -translate-x-1/2 z-[100] flex justify-center"
        style={{
          opacity: refreshing ? 1 : Math.min(1, pull / threshold),
          transition: refreshing || pull === 0 ? "opacity 200ms ease" : "none",
        }}
      >
        <div className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-md border border-border">
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

      <div>
        {children}
      </div>

    </div>
  );
}
