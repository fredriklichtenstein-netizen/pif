
import React from "react";
import { Button } from "@/components/ui/button";

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
    <div className="text-center py-8 text-muted-foreground">
      <p>{message}</p>
      {showClearFiltersButton && onClearFilters && (
        <Button
          variant="outline"
          className="mt-2"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
