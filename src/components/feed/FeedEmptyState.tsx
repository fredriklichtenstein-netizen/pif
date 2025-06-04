
import { Button } from "@/components/ui/button";

interface FeedEmptyStateProps {
  viewMode: string;
  selectedCategories: string[];
  clearFilters: () => void;
}

export function FeedEmptyState({ viewMode, selectedCategories, clearFilters }: FeedEmptyStateProps) {
  const getEmptyStateMessage = () => {
    if (selectedCategories.length > 0) {
      return "No items found matching your filters";
    }
    
    switch (viewMode) {
      case "saved":
        return "You haven't saved any items yet";
      case "myPifs":
        return "You haven't posted any items yet";
      case "archived":
        return "You don't have any archived items yet";
      case "interested":
        return "You haven't shown interest in any items yet";
      default:
        return "No items found";
    }
  };

  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>{getEmptyStateMessage()}</p>
      {selectedCategories.length > 0 && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={clearFilters}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
