
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

interface FeedEmptyStateProps {
  viewMode: string;
  selectedCategories: string[];
  clearFilters: () => void;
}

export function FeedEmptyState({ viewMode, selectedCategories, clearFilters }: FeedEmptyStateProps) {
  const { t } = useTranslation();

  const getEmptyStateMessage = () => {
    if (selectedCategories.length > 0) {
      return t('feed.empty_state');
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
        return t('feed.empty_state');
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
          {t('feed.clear_filters')}
        </Button>
      )}
    </div>
  );
}
