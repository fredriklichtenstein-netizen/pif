
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Post } from "@/types/post";
import { DistanceFilters } from "./distance/DistanceFilters";

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
}

// Sorted alphabetically by Swedish display name
const CATEGORY_KEYS = [
  "kids", "mixed", "books", "bicycle", "electronics", "vehicles",
  "home_garden", "pets", "household", "health", "art", "clothing",
  "kitchen", "toys", "food", "music", "furniture", "sports",
  "garden", "tools", "other"
];

const CONDITION_KEYS = [
  "new", "like_new", "very_good", "good", "ok", "poor"
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
  onUsePifAddress
}: MapFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  
  const counts = useMemo(() => {
    const pifCount = posts.filter(p => (p.item_type || 'offer') === 'offer').length;
    const wishCount = posts.filter(p => (p.item_type || 'offer') === 'request').length;
    return { all: posts.length, pifs: pifCount, wishes: wishCount };
  }, [posts]);
  
  const categories = CATEGORY_KEYS.map(key => ({
    key,
    label: t(`categories.${key}`)
  }));

  const conditions = CONDITION_KEYS.map(key => ({
    key,
    label: t(`conditions.${key}`)
  }));

  const activeFiltersCount = selectedCategories.length + selectedConditions.length;
  const hasActiveFilters = activeFiltersCount > 0 || selectedItemTypes.length > 0;

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleCondition = (condition: string) => {
    if (selectedConditions.includes(condition)) {
      onConditionChange(selectedConditions.filter(c => c !== condition));
    } else {
      onConditionChange([...selectedConditions, condition]);
    }
  };

  const isOnlyPifs = selectedItemTypes.length === 1 && selectedItemTypes.includes("offer");
  const isOnlyWishes = selectedItemTypes.length === 1 && selectedItemTypes.includes("request");
  const showingAll = selectedItemTypes.length === 0 || selectedItemTypes.length === 2;

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-background rounded-lg shadow-md p-1">
        <Button
          variant={showingAll ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange([])}
          className={`text-xs px-3 ${showingAll ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          {t('map_filters.all')} ({counts.all})
        </Button>
        <Button
          variant={isOnlyPifs ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["offer"])}
          className={`text-xs px-3 ${isOnlyPifs ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-teal-50 text-teal-700"}`}
        >
          🎁 {t('map_filters.pifs')} ({counts.pifs})
        </Button>
        <Button
          variant={isOnlyWishes ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["request"])}
          className={`text-xs px-3 ${isOnlyWishes ? "bg-amber-500 hover:bg-amber-600 text-white" : "hover:bg-amber-50 text-amber-700"}`}
        >
          ✨ {t('map_filters.wishes')} ({counts.wishes})
        </Button>
      </div>

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
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-background shadow-md hover:bg-accent relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('map_filters.filter')}
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            <DropdownMenuLabel>{t('map_filters.categories_label')}</DropdownMenuLabel>
            {categories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat.key}
                checked={selectedCategories.includes(cat.key)}
                onCheckedChange={() => toggleCategory(cat.key)}
              >
                {cat.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>{t('map_filters.condition_label')}</DropdownMenuLabel>
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
            {t('map_filters.clear')}
          </Button>
        )}
      </div>

      {(selectedCategories.length > 0 || selectedConditions.length > 0) && (
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
