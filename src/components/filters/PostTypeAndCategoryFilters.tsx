import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Post } from "@/types/post";
import { MIXED_CATEGORY_KEYS, REST_CATEGORY_KEYS, CATEGORY_KEYS as CENTRAL_CATEGORY_KEYS } from "@/utils/categories";

// Re-export for backwards compatibility with existing imports.
export const CATEGORY_KEYS = CENTRAL_CATEGORY_KEYS;

interface Props {
  posts: Post[];
  selectedCategories: string[];
  selectedItemTypes: string[];
  onCategoryChange: (categories: string[]) => void;
  onItemTypeChange: (types: string[]) => void;
  onClearCategories?: () => void;
  variant?: "map" | "feed";
}

/**
 * Shared "pifs / wishes" toggle + categories dropdown reused by the
 * floating map filter card and the inline feed filter bar. Visuals
 * stay the same; only the wrapping container styling is tuned per
 * variant by the parent.
 */
export function PostTypeAndCategoryFilters({
  posts,
  selectedCategories,
  selectedItemTypes,
  onCategoryChange,
  onItemTypeChange,
  onClearCategories,
  variant = "map",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  const counts = useMemo(() => {
    const pifCount = posts.filter((p) => (p.item_type || "offer") === "offer").length;
    const wishCount = posts.filter((p) => (p.item_type || "offer") === "request").length;
    return { all: posts.length, pifs: pifCount, wishes: wishCount };
  }, [posts]);

  const categories = CATEGORY_KEYS.map((key) => ({
    key,
    label: t(`categories.${key}`),
  }));

  const isOnlyPifs =
    selectedItemTypes.length === 1 && selectedItemTypes.includes("offer");
  const isOnlyWishes =
    selectedItemTypes.length === 1 && selectedItemTypes.includes("request");
  const showingAll =
    selectedItemTypes.length === 0 || selectedItemTypes.length === 2;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const pillContainerClass =
    variant === "map"
      ? "flex items-center gap-1 bg-background rounded-lg shadow-md p-1"
      : "flex items-center gap-1 bg-background rounded-lg border p-1";

  return (
    <div className="flex flex-col gap-2">
      <div className={pillContainerClass}>
        <Button
          variant={showingAll ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange([])}
          className={`text-xs px-3 ${showingAll ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          {t("map_filters.all")} ({counts.all})
        </Button>
        <Button
          variant={isOnlyPifs ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["offer"])}
          className={`text-xs px-3 ${isOnlyPifs ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-teal-50 text-teal-700"}`}
        >
          🎁 {t("map_filters.pifs")} ({counts.pifs})
        </Button>
        <Button
          variant={isOnlyWishes ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["request"])}
          className={`text-xs px-3 ${isOnlyWishes ? "bg-amber-500 hover:bg-amber-600 text-white" : "hover:bg-amber-50 text-amber-700"}`}
        >
          ✨ {t("map_filters.wishes")} ({counts.wishes})
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={
                variant === "map"
                  ? "bg-background shadow-md hover:bg-accent relative"
                  : "bg-background hover:bg-accent relative"
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("map_filters.categories_label")}
              {selectedCategories.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                >
                  {selectedCategories.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-80 overflow-y-auto bg-background z-50"
          >
            <DropdownMenuLabel>
              {t("map_filters.categories_label")}
            </DropdownMenuLabel>
            {categories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.key}
                checked={selectedCategories.includes(cat.key)}
                onCheckedChange={() => toggleCategory(cat.key)}
              >
                {cat.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedCategories.length > 0 && onClearCategories && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCategories}
            className={
              variant === "map"
                ? "bg-background shadow-md hover:bg-accent"
                : "bg-background hover:bg-accent"
            }
          >
            <X className="h-4 w-4 mr-1" />
            {t("map_filters.clear")}
          </Button>
        )}
      </div>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-72">
          {selectedCategories.map((catKey) => (
            <Badge
              key={catKey}
              variant="secondary"
              className="text-xs bg-background shadow-sm border"
            >
              {t(`categories.${catKey}`)}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleCategory(catKey)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
