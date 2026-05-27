import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { X, Heart, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Post } from "@/types/post";
import { DistanceFilters } from "./distance/DistanceFilters";
import { PostTypeAndCategoryFilters } from "@/components/filters/PostTypeAndCategoryFilters";
import { useState } from "react";

interface MapFiltersProps {
  posts: Post[];
  selectedCategories: string[];
  selectedConditions: string[];
  selectedItemTypes: string[];
  onCategoryChange: (categories: string[]) => void;
  onConditionChange: (conditions: string[]) => void;
  onItemTypeChange: (types: string[]) => void;
  onClearFilters: () => void;
  selectedDistance: number | null;
  onDistanceChange: (distance: number | null) => void;
  userLocation: [number, number] | null;
  onRequestLocation?: () => void;
  onUsePifAddress?: (coords: [number, number]) => void;
  onlyInterested?: boolean;
  onOnlyInterestedChange?: (value: boolean) => void;
  showInterestedFilter?: boolean;
  interestedCount?: number;
}

const CONDITION_KEYS = [
  "new", "like_new", "very_good", "good", "ok", "poor",
];

export const MapFilters = ({
  posts,
  selectedCategories,
  selectedConditions,
  selectedItemTypes,
  onCategoryChange,
  onConditionChange,
  onItemTypeChange,
  onClearFilters,
  selectedDistance,
  onDistanceChange,
  userLocation,
  onRequestLocation,
  onUsePifAddress,
  onlyInterested = false,
  onOnlyInterestedChange,
  showInterestedFilter = false,
  interestedCount = 0,
}: MapFiltersProps) => {
  const { t } = useTranslation();
  const [conditionOpen, setConditionOpen] = useState(false);

  const conditions = CONDITION_KEYS.map((key) => ({
    key,
    label: t(`conditions.${key}`),
  }));

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedConditions.length > 0 ||
    selectedItemTypes.length > 0 ||
    onlyInterested;

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      onConditionChange(selectedConditions.filter((c) => c !== condition));
    } else {
      onConditionChange([...selectedConditions, condition]);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      <PostTypeAndCategoryFilters
        posts={posts}
        selectedCategories={selectedCategories}
        selectedItemTypes={selectedItemTypes}
        onCategoryChange={onCategoryChange}
        onItemTypeChange={onItemTypeChange}
        variant="map"
      />

      {showInterestedFilter && (
        <div className="bg-background rounded-lg shadow-md p-1">
          <Button
            variant={onlyInterested ? "default" : "ghost"}
            size="sm"
            onClick={() => onOnlyInterestedChange?.(!onlyInterested)}
            className={`text-xs px-3 w-full ${onlyInterested ? "bg-rose-500 hover:bg-rose-600 text-white" : "hover:bg-rose-50 text-rose-700"}`}
            aria-pressed={onlyInterested}
          >
            <Heart className={`h-3.5 w-3.5 mr-1 ${onlyInterested ? "fill-current" : ""}`} />
            {t("map_filters.only_interested")} ({interestedCount})
          </Button>
        </div>
      )}

      <div className="bg-background/90 backdrop-blur-sm rounded-lg shadow-md p-2">
        <DistanceFilters
          selectedDistance={selectedDistance}
          onDistanceChange={onDistanceChange}
          userLocation={userLocation}
          onRequestLocation={onRequestLocation}
          onUsePifAddress={onUsePifAddress}
        />
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu open={conditionOpen} onOpenChange={setConditionOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-background shadow-md hover:bg-accent relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {t("map_filters.condition_label")}
              {selectedConditions.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                >
                  {selectedConditions.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 max-h-80 overflow-y-auto bg-background z-50"
          >
            <DropdownMenuLabel>{t("map_filters.condition_label")}</DropdownMenuLabel>
            {conditions.map((cond) => (
              <DropdownMenuCheckboxItem
                key={cond.key}
                checked={selectedConditions.includes(cond.key)}
                onCheckedChange={() => toggleCondition(cond.key)}
              >
                {cond.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="bg-background shadow-md hover:bg-accent"
          >
            <X className="h-4 w-4 mr-1" />
            {t("map_filters.clear")}
          </Button>
        )}
      </div>

      {selectedConditions.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-72">
          {selectedConditions.map((condKey) => (
            <Badge
              key={condKey}
              variant="secondary"
              className="text-xs bg-background shadow-sm border"
            >
              {t(`conditions.${condKey}`)}
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => toggleCondition(condKey)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
