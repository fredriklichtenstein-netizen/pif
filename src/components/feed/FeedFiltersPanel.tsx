import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { FeedDistanceFilter } from "./FeedDistanceFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MIXED_CATEGORY_KEYS, REST_CATEGORY_KEYS, CATEGORY_KEYS } from "@/utils/categories";
import type { Post } from "@/types/post";

interface Props {
  posts: Post[];
  /** True all/pifs/wishes counts (not scoped to distance) — see useFeedTypeCounts. Falls back to counting `posts` if omitted. */
  typeCounts?: { all: number; pifs: number; wishes: number };
  selectedDistance: number | null;
  onDistanceChange: (d: number | null) => void;
  userLocation: [number, number] | null;
  onUserLocationChange: (loc: [number, number] | null) => void;
  selectedItemTypes: string[];
  onItemTypeChange: (t: string[]) => void;
  selectedCategories: string[];
  onCategoryChange: (c: string[]) => void;
  includeArchived: boolean;
  onIncludeArchivedChange: (v: boolean) => void;
  onlyInterested: boolean;
  onOnlyInterestedChange: (v: boolean) => void;
  onResetAll: () => void;
  /** When true, hide private filters (archived) — viewing another user. */
  viewingOtherUser?: boolean;
  /** When true, increment the active filter badge by one. */
  userFilterActive?: boolean;
}

const DEFAULT_DISTANCE = 3;

export function FeedFiltersPanel({
  posts,
  typeCounts,
  selectedDistance,
  onDistanceChange,
  userLocation,
  onUserLocationChange,
  selectedItemTypes,
  onItemTypeChange,
  selectedCategories,
  onCategoryChange,
  includeArchived,
  onIncludeArchivedChange,
  onlyInterested,
  onOnlyInterestedChange,
  onResetAll,
  viewingOtherUser = false,
  userFilterActive = false,
}: Props) {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Prefer the true, server-fetched totals (typeCounts) over counting only
  // whatever's been paginated in locally — `posts` here can be as few as 6
  // items on first load. Fall back to the local derivation only if the
  // caller hasn't wired typeCounts up yet.
  const derivedCounts = useMemo(() => {
    const pifs = posts.filter((p) => (p.item_type || "offer") === "offer").length;
    const wishes = posts.filter((p) => (p.item_type || "offer") === "request").length;
    return { all: posts.length, pifs, wishes };
  }, [posts]);
  const counts = typeCounts ?? derivedCounts;

  const isOnlyPifs = selectedItemTypes.length === 1 && selectedItemTypes.includes("offer");
  const isOnlyWishes = selectedItemTypes.length === 1 && selectedItemTypes.includes("request");
  const showingAll = selectedItemTypes.length === 0 || selectedItemTypes.length === 2;

  // Non-default if anything diverges from defaults.
  const distanceIsDefault = selectedDistance === null || selectedDistance === DEFAULT_DISTANCE;
  const activeCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedItemTypes.length > 0 && selectedItemTypes.length < 2 ? 1 : 0) +
    (userLocation ? 1 : 0) +
    (!distanceIsDefault ? 1 : 0) +
    (includeArchived ? 1 : 0) +
    (onlyInterested ? 1 : 0) +
    (userFilterActive ? 1 : 0);

  const hasNonDefault = activeCount > 0;

  const toggleCategory = (key: string) => {
    if (selectedCategories.includes(key)) {
      onCategoryChange(selectedCategories.filter((c) => c !== key));
    } else {
      onCategoryChange([...selectedCategories, key]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background hover:bg-accent relative h-9"
        >
          {t("interactions.filter_label", "Filtrera")}
          <ChevronDown className="h-4 w-4 ml-1" />
          {hasNonDefault && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("interactions.filter_label", "Filtrera")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Location + distance */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("interactions.filter_location", "Plats")}
            </h3>
            <FeedDistanceFilter
              selectedDistance={selectedDistance}
              onDistanceChange={onDistanceChange}
              userLocation={userLocation}
              onUserLocationChange={onUserLocationChange}
            />
          </section>

          {/* Type pills */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("interactions.filter_type", "Typ")}
            </h3>
            <div className="flex items-center gap-1 bg-background rounded-lg border p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onItemTypeChange([])}
                className={`flex-1 text-xs px-3 ${showingAll ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
              >
                {t("map_filters.all")} ({counts.all})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onItemTypeChange(["offer"])}
                className={`flex-1 text-xs px-3 ${isOnlyPifs ? "bg-teal-600 hover:bg-teal-700 text-white" : "text-teal-700"}`}
              >
                🎁 {t("map_filters.pifs")} ({counts.pifs})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onItemTypeChange(["request"])}
                className={`flex-1 text-xs px-3 ${isOnlyWishes ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-amber-700"}`}
              >
                ✨ {t("map_filters.wishes")} ({counts.wishes})
              </Button>
            </div>
          </section>

          {/* Categories */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("interactions.filter_category", "Kategori")}
            </h3>
            <DropdownMenu open={catOpen} onOpenChange={setCatOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>
                    {selectedCategories.length === 0
                      ? t("map_filters.categories_label")
                      : selectedCategories
                          .slice(0, 3)
                          .map((k) => t(`categories.${k}`))
                          .join(", ") +
                        (selectedCategories.length > 3 ? ` +${selectedCategories.length - 3}` : "")}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[calc(100vw-3rem)] sm:w-80 max-h-80 overflow-y-auto bg-background z-[60]"
              >
                <DropdownMenuLabel>{t("categories.mixed", "Blandat")}</DropdownMenuLabel>
                {MIXED_CATEGORY_KEYS.map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={selectedCategories.includes(key)}
                    onCheckedChange={() => toggleCategory(key)}
                  >
                    {t(`categories.${key}`)}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t("map_filters.categories_label")}</DropdownMenuLabel>
                {REST_CATEGORY_KEYS.map((key) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={selectedCategories.includes(key)}
                    onCheckedChange={() => toggleCategory(key)}
                  >
                    {t(`categories.${key}`)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </section>

          {/* My interest toggle (authenticated, own-feed only) */}
          {user && !viewingOtherUser && (
            <section className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t("feed.my_interest", "Mitt intresse")}
              </h3>
              <button
                type="button"
                onClick={() => onOnlyInterestedChange(!onlyInterested)}
                aria-pressed={onlyInterested}
                className={`relative inline-flex shrink-0 h-6 w-11 rounded-full transition-colors ${
                  onlyInterested ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                    onlyInterested ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </section>
          )}

          {/* Archived toggle (authenticated, own-feed only) */}
          {user && !viewingOtherUser && (
            <section className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t("feed.show_archived", "Visa endast arkiverade")}
              </h3>
              <button
                type="button"
                onClick={() => onIncludeArchivedChange(!includeArchived)}
                aria-pressed={includeArchived}
                className={`relative inline-flex shrink-0 h-6 w-11 rounded-full transition-colors ${
                  includeArchived ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                    includeArchived ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </section>
          )}

          {/* Reset */}
          {hasNonDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetAll}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t("interactions.reset_filters", "Återställ filter")}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
