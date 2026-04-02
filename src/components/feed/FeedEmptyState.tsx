
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface FeedEmptyStateProps {
  viewMode: string;
  selectedCategories: string[];
  clearFilters: () => void;
}

export function FeedEmptyState({ viewMode, selectedCategories, clearFilters }: FeedEmptyStateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getEmptyStateMessage = () => {
    if (selectedCategories.length > 0) {
      return t('feed.empty_state');
    }
    
    switch (viewMode) {
      case "saved":
        return t('profile.no_interests_description');
      case "myPifs":
        return t('profile.no_pifs_description');
      case "archived":
        return t('feed.empty_state');
      case "interested":
        return t('profile.no_interests_description');
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
      {viewMode === "all" && selectedCategories.length === 0 && (
        <Button
          className="mt-4"
          onClick={() => navigate('/post')}
        >
          {t('post.create_offer')}
        </Button>
      )}
    </div>
  );
}
