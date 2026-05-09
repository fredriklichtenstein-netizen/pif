import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface RefreshOverlayProps {
  show: boolean;
  /** Optional override; defaults to the localized "refreshing feed" string. */
  label?: string;
  /** Position the chip; defaults to top-center. */
  className?: string;
}

/**
 * Lightweight non-blocking overlay shown while a refresh is in flight.
 * Sits above content with a pointer-events-none chip so the UI stays
 * interactive but clearly signals work is happening.
 */
export function RefreshOverlay({ show, label, className }: RefreshOverlayProps) {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "pointer-events-none fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-all duration-200",
        show ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-full bg-background/95 backdrop-blur px-3 py-1.5 shadow-md border border-border">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">
          {label ?? t("interactions.refreshing_feed")}
        </span>
      </div>
    </div>
  );
}
