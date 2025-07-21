import { useState } from "react";
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

interface MapFiltersProps {
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
  selectedCategories,
  selectedConditions,
  selectedItemTypes,
  onCategoryChange,
  onConditionChange,
  onItemTypeChange,
  onClearFilters
}: MapFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const activeFiltersCount = selectedCategories.length + selectedConditions.length + selectedItemTypes.length;
  const hasActiveFilters = activeFiltersCount > 0;

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

  return (
    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
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
              {hasActiveFilters && (
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
            <DropdownMenuLabel>Typ av inlägg</DropdownMenuLabel>
            {ITEM_TYPES.map((type) => (
              <DropdownMenuCheckboxItem
                key={type.value}
                checked={selectedItemTypes.includes(type.value)}
                onCheckedChange={() => toggleItemType(type.value)}
              >
                {type.label}
              </DropdownMenuCheckboxItem>
            ))}
            
            <DropdownMenuSeparator />
            
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

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1 max-w-72">
          {selectedItemTypes.map((type) => (
            <Badge 
              key={type} 
              variant="secondary" 
              className="text-xs bg-white shadow-sm border"
            >
              {ITEM_TYPES.find(t => t.value === type)?.label}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => toggleItemType(type)}
              />
            </Badge>
          ))}
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