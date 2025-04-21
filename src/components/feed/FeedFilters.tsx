import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import { FeedCategories } from "./FeedCategories";

interface FeedFiltersProps {
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (val: string[]) => void;
  allSelected: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export function FeedFilters({
  categories,
  selectedCategories,
  setSelectedCategories,
  allSelected,
  showFilters,
  setShowFilters,
}: FeedFiltersProps) {
  // Handle ALL logic here while keeping the API the same as before
  const isCategorySelected = (category: string) => selectedCategories.includes(category);

  const selectAll = () => setSelectedCategories([...categories]);
  const clearFilters = () => setSelectedCategories([]);

  // Toggle a single category, ensuring ALL logic works as described by user
  const toggleCategory = (category: string) => {
    if (allSelected) {
      // When ALL is selected and user clicks a category, keep all categories EXCEPT the clicked one
      setSelectedCategories(categories.filter((c) => c !== category));
      return;
    }
    
    // Normal toggle logic
    if (isCategorySelected(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      const updated = [...selectedCategories, category];
      setSelectedCategories(updated.length >= categories.length ? [...categories] : updated);
    }
  };

  const handleCategoryChange = (values: string[]) => {
    // If "all" is in the values list
    if (values.includes("all")) {
      // Toggle ALL on/off
      if (!allSelected) {
        selectAll();
      } else {
        clearFilters();
      }
      return;
    }
    
    // When ALL is active and a category button is clicked
    if (allSelected) {
      // When ALL is selected and user clicks a category button, 
      // the value will be only the clicked category itself (which we want to remove)
      const categoryToRemove = values[0] || "";
      setSelectedCategories(categories.filter(cat => cat !== categoryToRemove));
      return;
    }
    
    // Normal category selection (ALL is not active)
    setSelectedCategories(values);
  };

  const handleCheckboxChange = (category: string) => {
    toggleCategory(category);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-medium">Categories</h2>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-muted-foreground"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          <span>{selectedCategories.length > 0 ? `${selectedCategories.length} selected` : 'Filter'}</span>
        </Button>
      </div>

      {/* Category toggle group */}
      <FeedCategories
        categories={categories}
        selectedCategories={selectedCategories}
        allSelected={allSelected}
        onCategoryChange={handleCategoryChange}
        isCategorySelected={isCategorySelected}
      />

      {/* Filters dropdown with checkboxes */}
      {showFilters && (
        <div className="bg-accent/40 rounded-lg p-3 mb-4 mt-2 grid grid-cols-2 gap-2">
          <div className="col-span-2 mb-1 flex justify-between items-center">
            <h3 className="text-sm font-medium">Select categories</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-3"
                onClick={selectAll}
                tabIndex={0}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearFilters}
                tabIndex={0}
              >
                Clear all
              </Button>
            </div>
          </div>

          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`filter-${category}`}
                checked={isCategorySelected(category)}
                onCheckedChange={() => handleCheckboxChange(category)}
              />
              <label
                htmlFor={`filter-${category}`}
                className="text-sm cursor-pointer select-none"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
