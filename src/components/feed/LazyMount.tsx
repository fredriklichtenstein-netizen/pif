import { useEffect, useRef, useState, type ReactNode } from "react";

interface LazyMountProps {
  /** Approx pixel height to reserve while the card is unmounted. */
  placeholderMinHeight?: number;
  /** Distance from the viewport at which to mount the children. */
  rootMargin?: string;
  /** If true, once mounted the children stay mounted (default: true). */
  keepMounted?: boolean;
  children: ReactNode;
}

/**
 * Defers rendering of `children` until the wrapper scrolls within
 * `rootMargin` of the viewport. Used to avoid mounting heavy feed
 * cards (each of which opens realtime subscriptions and runs per-card
 * fetches) for posts the user hasn't scrolled to yet.
 */
export function LazyMount({
  placeholderMinHeight = 320,
  rootMargin = "600px 0px",
  keepMounted = true,
  children,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible && keepMounted) return;
    const el = ref.current;
    if (!el) return;

    // Older browsers / SSR: mount immediately.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (keepMounted) obs.disconnect();
          } else if (!keepMounted) {
            setVisible(false);
          }
        }
      },
      { rootMargin },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, keepMounted, rootMargin]);

  return (
    <div ref={ref} style={!visible ? { minHeight: placeholderMinHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
}
