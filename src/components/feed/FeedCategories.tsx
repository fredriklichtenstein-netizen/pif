
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FeedCategoriesProps {
  categories: string[];
  selectedCategories: string[];
  allSelected: boolean;
  onCategoryChange: (values: string[]) => void;
  isCategorySelected: (category: string) => boolean;
}

export function FeedCategories({
  categories,
  selectedCategories,
  allSelected,
  onCategoryChange,
  isCategorySelected,
}: FeedCategoriesProps) {
  return (
    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
      <ToggleGroup
        type="multiple"
        value={allSelected ? ["all"] : selectedCategories}
        onValueChange={onCategoryChange}
      >
        <ToggleGroupItem
          value="all"
          className={`rounded-full border ${
            allSelected ? "bg-primary text-white" : "bg-accent text-foreground"
          }`}
          aria-pressed={allSelected}
        >
          ALL
        </ToggleGroupItem>
        {categories.map((category) => (
          <ToggleGroupItem
            key={category}
            value={category}
            className={`rounded-full border ${
              isCategorySelected(category) || allSelected
                ? "bg-primary text-white"
                : "bg-accent text-foreground"
            }`}
            aria-pressed={isCategorySelected(category) || allSelected}
          >
            {category}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
