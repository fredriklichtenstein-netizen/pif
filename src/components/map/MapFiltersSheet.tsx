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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
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
  hideOwnPosts: boolean;
  onHideOwnPostsChange: (v: boolean) => void;
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
  hideOwnPosts,
  onHideOwnPostsChange,
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
    (userLocation ? 1 : 0) +
    (!distanceIsDefault ? 1 : 0) +
    (onlyInterested ? 1 : 0) +
    (hideOwnPosts ? 1 : 0);

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
              className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs rounded-full shadow-sm"
            >
              {activeCount}
            </Badge>
          )}

        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl z-[70] pb-safe"
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
            {/*
              A plain inline Collapsible, not a DropdownMenu -- deliberately.
              Same fix as FeedFiltersPanel.tsx: DropdownMenu portals its
              content to document.body as a sibling of this Sheet's own
              portal, with its own modal scroll-lock nested inside the
              Sheet's -- confirmed live, on device, to make the category
              list unscrollable on mobile even after a CSS-only sizing fix
              (Trello B3). Collapsible has no portal and no scroll-lock, so
              the list is just part of this Sheet's own already-working
              max-h-[85vh] overflow-y-auto -- one scroll region, not two
              nested ones.
            */}
            <Collapsible open={catOpen} onOpenChange={setCatOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="truncate">{catSummary}</span>
                  <ChevronDown
                    className={`h-4 w-4 opacity-60 ml-2 shrink-0 transition-transform ${catOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 rounded-md border p-2">
                <p className="px-1 py-1 text-xs font-semibold text-muted-foreground">
                  {t("categories.mixed", "Blandat")}
                </p>
                {MIXED_CATEGORY_KEYS.map((key) => (
                  <label
                    key={key}
                    htmlFor={`map-cat-${key}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      id={`map-cat-${key}`}
                      checked={selectedCategories.includes(key)}
                      onCheckedChange={() => toggleCategory(key)}
                    />
                    {t(`categories.${key}`)}
                  </label>
                ))}
                <div className="my-1 h-px bg-border" />
                <p className="px-1 py-1 text-xs font-semibold text-muted-foreground">
                  {t("map_filters.categories_label")}
                </p>
                {REST_CATEGORY_KEYS.map((key) => (
                  <label
                    key={key}
                    htmlFor={`map-cat-${key}`}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      id={`map-cat-${key}`}
                      checked={selectedCategories.includes(key)}
                      onCheckedChange={() => toggleCategory(key)}
                    />
                    {t(`categories.${key}`)}
                  </label>
                ))}
              </CollapsibleContent>
            </Collapsible>
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

          {/* Hide own posts toggle */}
          {user && (
            <section className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                {t("map.hide_own_posts", "Dölj mina egna inlägg")}
              </h3>
              <button
                type="button"
                onClick={() => onHideOwnPostsChange(!hideOwnPosts)}
                aria-pressed={hideOwnPosts}
                className={`relative inline-flex shrink-0 h-6 w-11 rounded-full transition-colors ${
                  hideOwnPosts ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                    hideOwnPosts ? "translate-x-5" : "translate-x-0"
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
