import { Badge } from "@/components/ui/badge";
import { Gift, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ItemType } from "./types";

interface ItemTypeBadgeProps {
  item_type?: ItemType;
  /** Override positioning. Defaults to absolute top-3 left-3 so it can overlay an image. */
  className?: string;
  /** Compact size for small/dense cards. */
  size?: "default" | "sm";
}

/**
 * Shared pif/wish type badge. Single source of truth for the
 * amber+Star "Önskan" vs. pif-offer+Gift "Pif" visual convention.
 * Used by ItemCardGallery and the profile grids (MyPifsGrid, InterestedPifsGrid).
 */
export function ItemTypeBadge({ item_type, className, size = "default" }: ItemTypeBadgeProps) {
  const { t } = useTranslation();
  const isWish = item_type === "request";

  const sizeClasses =
    size === "sm"
      ? "gap-1 px-2 py-0.5 text-xs"
      : "gap-1.5 px-3 py-1.5 text-sm";
  const iconClass = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className={cn("absolute top-3 left-3 z-10", className)}>
      <Badge
        className={cn(
          "flex items-center font-medium shadow-lg",
          sizeClasses,
          isWish
            ? "bg-amber-400 text-amber-950 hover:bg-amber-400"
            : "bg-pif-offer text-pif-offer-foreground",
        )}
      >
        {isWish ? (
          <>
            <Star className={iconClass} />
            {t("common.wish", "Önskan")}
          </>
        ) : (
          <>
            <Gift className={iconClass} />
            {t("common.pif", "Pif")}
          </>
        )}
      </Badge>
    </div>
  );
}
