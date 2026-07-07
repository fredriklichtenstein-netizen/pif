import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { FeedDistanceFilter } from "@/components/feed/FeedDistanceFilter";
import {
  MIXED_CATEGORY_KEYS,
  REST_CATEGORY_KEYS,
} from "@/utils/categories";
import type { Post } from "@/types/post";

const CONDITION_KEYS = ["new", "like_new", "very_good", "good", "ok", "poor"];
const DEFAULT_DISTANCE = 3;

interface Props {
  posts: Post[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  selectedConditions: string[];
  onConditionChange: (conditions: string[]) => void;
  selectedDistance: number | null;
  onDistanceChange: (d: number | null) => void;
  userLocation: [number, number] | null;
  onUserLocationChange: (loc: [number, number] | null) => void;
  onlyInterested: boolean;
  onOnlyInterestedChange: (v: boolean) => void;
  onResetAll: () => void;
}

/**
 * Consolidated map filter sheet — mirrors FeedFiltersPanel but keeps
 * map-specific sections (distance + Nuvarande/Min PIF-adress toggles,
 * Skick / condition list). Type pills stay outside the sheet as
 * always-visible quick filters.
 */
export function MapFiltersSheet({
  posts: _posts,
  selectedCategories,
  onCategoryChange,
  selectedConditions,
  onConditionChange,
  
  selectedDistance,
  onDistanceChange,
  userLocation,
  onUserLocationChange,
  onlyInterested,
  onOnlyInterestedChange,
  onResetAll,
}: Props) {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const distanceIsDefault =
    selectedDistance === null || selectedDistance === DEFAULT_DISTANCE;
  const activeCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedConditions.length > 0 ? 1 : 0) +
    (selectedItemTypes.length > 0 && selectedItemTypes.length < 2 ? 1 : 0) +
    (userLocation ? 1 : 0) +
    (!distanceIsDefault ? 1 : 0) +
    (onlyInterested ? 1 : 0);

  const hasActive = activeCount > 0;

  const toggleCategory = (key: string) => {
    if (selectedCategories.includes(key)) {
      onCategoryChange(selectedCategories.filter((c) => c !== key));
    } else {
      onCategoryChange([...selectedCategories, key]);
    }
  };

  const toggleCondition = (key: string) => {
    if (selectedConditions.includes(key)) {
      onConditionChange(selectedConditions.filter((c) => c !== key));
    } else {
      onConditionChange([...selectedConditions, key]);
    }
  };

  const catSummary = useMemo(() => {
    if (selectedCategories.length === 0)
      return t("map_filters.categories_label");
    return (
      selectedCategories
        .slice(0, 3)
        .map((k) => t(`categories.${k}`))
        .join(", ") +
      (selectedCategories.length > 3
        ? ` +${selectedCategories.length - 3}`
        : "")
    );
  }, [selectedCategories, t]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background shadow-md hover:bg-accent relative h-9"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {t("interactions.filter_label", "Filtrera")}
          {hasActive && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl z-[70]"
      >
        <SheetHeader>
          <SheetTitle>
            {t("interactions.filter_label", "Filtrera")}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Location + distance (map-specific) */}
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

          {/* Categories */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("interactions.filter_category", "Kategori")}
            </h3>
            <DropdownMenu open={catOpen} onOpenChange={setCatOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">{catSummary}</span>
                  <ChevronDown className="h-4 w-4 opacity-60 ml-2 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[calc(100vw-3rem)] sm:w-80 max-h-80 overflow-y-auto bg-background z-[80]"
              >
                <DropdownMenuLabel>
                  {t("categories.mixed", "Blandat")}
                </DropdownMenuLabel>
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
                <DropdownMenuLabel>
                  {t("map_filters.categories_label")}
                </DropdownMenuLabel>
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

          {/* Condition (map-specific "Skick") */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">
              {t("map_filters.condition_label")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CONDITION_KEYS.map((key) => {
                const active = selectedConditions.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCondition(key)}
                    aria-pressed={active}
                    className={`text-xs px-3 py-2 rounded-md border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {t(`conditions.${key}`)}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Mitt intresse toggle */}
          {user && (
            <section className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t("map.only_my_interest", "Mina visade intressen")}
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

          <Button
            variant="outline"
            size="sm"
            onClick={onResetAll}
            disabled={!hasActive}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("interactions.reset_filters", "Återställ filter")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
