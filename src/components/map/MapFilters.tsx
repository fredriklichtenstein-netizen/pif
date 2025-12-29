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
import type { Post } from "@/types/post";

interface MapFiltersProps {
  posts: Post[];
  selectedCategories: string[];
  selectedConditions: string[];
  selectedItemTypes: string[];
  onCategoryChange: (categories: string[]) => void;
  onConditionChange: (conditions: string[]) => void;
  onItemTypeChange: (types: string[]) => void;
  onClearFilters: () => void;
}

const CATEGORIES = [
  "Elektronik",
  "Möbler", 
  "Kläder",
  "Böcker",
  "Sport",
  "Verktyg",
  "Leksaker",
  "Trädgård",
  "Husgeråd",
  "Övrigt"
];

const CONDITIONS = [
  "Nytt",
  "Som nytt", 
  "Mycket bra",
  "Bra",
  "Okej",
  "Dåligt"
];

const ITEM_TYPES = [
  { value: "offer", label: "Erbjudanden" },
  { value: "request", label: "Önskemål" }
];

export const MapFilters = ({
  posts,
  selectedCategories,
  selectedConditions,
  selectedItemTypes,
  onCategoryChange,
  onConditionChange,
  onItemTypeChange,
  onClearFilters
}: MapFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Calculate counts for each item type
  const counts = useMemo(() => {
    const pifCount = posts.filter(p => (p.item_type || 'offer') === 'offer').length;
    const wishCount = posts.filter(p => (p.item_type || 'offer') === 'request').length;
    return { all: posts.length, pifs: pifCount, wishes: wishCount };
  }, [posts]);
  
  // Count only category and condition filters (not item types since they have dedicated toggles)
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

  const toggleItemType = (type: string) => {
    if (selectedItemTypes.includes(type)) {
      onItemTypeChange(selectedItemTypes.filter(t => t !== type));
    } else {
      onItemTypeChange([...selectedItemTypes, type]);
    }
  };

  // Check if a specific type is active (when it's the only one selected)
  const isOnlyPifs = selectedItemTypes.length === 1 && selectedItemTypes.includes("offer");
  const isOnlyWishes = selectedItemTypes.length === 1 && selectedItemTypes.includes("request");
  const showingAll = selectedItemTypes.length === 0 || selectedItemTypes.length === 2;

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
      {/* Item type toggle buttons */}
      <div className="flex items-center gap-1 bg-white rounded-lg shadow-md p-1">
        <Button
          variant={showingAll ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange([])}
          className={`text-xs px-3 ${showingAll ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"}`}
        >
          Alla ({counts.all})
        </Button>
        <Button
          variant={isOnlyPifs ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["offer"])}
          className={`text-xs px-3 ${isOnlyPifs ? "bg-teal-600 hover:bg-teal-700 text-white" : "hover:bg-teal-50 text-teal-700"}`}
        >
          🎁 Pifs ({counts.pifs})
        </Button>
        <Button
          variant={isOnlyWishes ? "default" : "ghost"}
          size="sm"
          onClick={() => onItemTypeChange(["request"])}
          className={`text-xs px-3 ${isOnlyWishes ? "bg-amber-500 hover:bg-amber-600 text-white" : "hover:bg-amber-50 text-amber-700"}`}
        >
          ✨ Önskningar ({counts.wishes})
        </Button>
      </div>

      {/* Category/condition filters */}
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white shadow-md hover:bg-gray-50 relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
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
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Kategorier</DropdownMenuLabel>
            {CATEGORIES.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Skick</DropdownMenuLabel>
            {CONDITIONS.map((condition) => (
              <DropdownMenuCheckboxItem
                key={condition}
                checked={selectedConditions.includes(condition)}
                onCheckedChange={() => toggleCondition(condition)}
              >
                {condition}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="bg-white shadow-md hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-1" />
            Rensa
          </Button>
        )}
      </div>

      {/* Active filter badges (only for categories and conditions) */}
      {(selectedCategories.length > 0 || selectedConditions.length > 0) && (
        <div className="flex flex-wrap gap-1 max-w-72">
          {selectedCategories.map((category) => (
            <Badge 
              key={category} 
              variant="secondary" 
              className="text-xs bg-white shadow-sm border"
            >
              {category}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleCategory(category)}
              />
            </Badge>
          ))}
          {selectedConditions.map((condition) => (
            <Badge 
              key={condition} 
              variant="secondary" 
              className="text-xs bg-white shadow-sm border"
            >
              {condition}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleCondition(condition)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};