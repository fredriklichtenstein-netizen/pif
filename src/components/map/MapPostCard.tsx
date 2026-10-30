import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedItemCard } from "@/components/feed/FeedItemCard";
import type { Post } from "@/types/post";

interface MapPostCardProps {
  post: Post;
  onClose: () => void;
  onShowInFeed: () => void;
}

/**
 * The full post card, opened over the map from a pin's thumbnail popup so
 * the user can read and act on a post without leaving the map. The map
 * stays mounted underneath (Mapbox needs its container to persist).
 */
export function MapPostCard({ post, onClose, onShowInFeed }: MapPostCardProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    // z-40: under MainNav (z-50); the bottom padding clears the nav pill.
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-black/40 p-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={post.title}
        className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
            aria-label={t("map.close_post_card")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2">
          <FeedItemCard post={post} />
        </div>
        <div className="border-t p-3">
          <Button type="button" className="w-full" onClick={onShowInFeed}>
            {t("map.show_in_feed")}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
