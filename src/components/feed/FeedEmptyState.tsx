
import { Button } from "@/components/ui/button";
import { Leaf, Recycle } from "lucide-react";
import { getRandomSustainabilityFact } from "./utils/sustainabilityMessages";

interface FeedEmptyStateProps {
  message: string;
  showClearFiltersButton?: boolean;
  onClearFilters?: () => void;
}

export function FeedEmptyState({
  message,
  showClearFiltersButton = false,
  onClearFilters
}: FeedEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <Recycle className="h-12 w-12 text-green-500 mb-2" />
      <h3 className="text-xl font-semibold">{message}</h3>
      
      <div className="bg-green-50 p-4 rounded-lg max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-green-800">Sustainability Tip</p>
        </div>
        <p className="text-sm text-green-700">{getRandomSustainabilityFact()}</p>
      </div>
      
      {showClearFiltersButton && onClearFilters && (
        <Button 
          onClick={onClearFilters}
          variant="outline" 
          className="mt-4 border-green-500 text-green-700 hover:bg-green-50"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
