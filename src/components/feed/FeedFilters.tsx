
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Filter, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ECO_FRIENDLY_CATEGORIES } from "./utils/constants";

interface FeedFiltersProps {
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  allSelected: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  viewMode: string;
  setViewMode: (mode: string) => void;
}

export function FeedFilters({
  categories,
  selectedCategories,
  setSelectedCategories,
  allSelected,
  showFilters,
  setShowFilters,
  viewMode,
  setViewMode
}: FeedFiltersProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const handleCategoryClick = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const selectAll = () => {
    setSelectedCategories([...categories]);
  };

  const clearAll = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="mb-6">
      {/* View Mode Selector */}
      <div className="flex overflow-x-auto pb-2 mb-4 hide-scrollbar">
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          className="mr-2 whitespace-nowrap"
          onClick={() => setViewMode("all")}
        >
          <Leaf className="h-4 w-4 mr-1 text-green-500" />
          All Items
        </Button>
        <Button
          variant={viewMode === "saved" ? "default" : "outline"}
          size="sm"
          className="mr-2 whitespace-nowrap"
          onClick={() => setViewMode("saved")}
        >
          Saved
        </Button>
        <Button
          variant={viewMode === "myPifs" ? "default" : "outline"}
          size="sm"
          className="mr-2 whitespace-nowrap"
          onClick={() => setViewMode("myPifs")}
        >
          My PiFs
        </Button>
        <Button
          variant={viewMode === "interested" ? "default" : "outline"}
          size="sm"
          className="mr-2 whitespace-nowrap"
          onClick={() => setViewMode("interested")}
        >
          Interested
        </Button>
        <Button
          variant={viewMode === "archived" ? "default" : "outline"}
          size="sm"
          className="whitespace-nowrap"
          onClick={() => setViewMode("archived")}
        >
          Archived
        </Button>
      </div>

      {/* Filter Toggles */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Leaf className="mr-2 h-5 w-5 text-green-500" />
          Sustainable Categories
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filter
          {selectedCategories.length > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
              {selectedCategories.length}
            </span>
          )}
        </Button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="bg-accent/30 p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={selectAll} disabled={allSelected}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll} disabled={selectedCategories.length === 0}>
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category);
              const ecoTip = ECO_FRIENDLY_CATEGORIES[category as keyof typeof ECO_FRIENDLY_CATEGORIES];
              
              return (
                <Popover 
                  key={category}
                  open={activeTooltip === category}
                  onOpenChange={(open) => {
                    if (open) {
                      setActiveTooltip(category);
                    } else if (activeTooltip === category) {
                      setActiveTooltip(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`justify-start ${isSelected ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-500 hover:text-green-700'}`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      {category}
                      <Leaf className="h-3 w-3 ml-1 text-green-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2 text-sm bg-green-50">
                    <div className="flex items-start gap-2">
                      <Leaf className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">{category}</p>
                        <p className="text-green-700">{ecoTip}</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
