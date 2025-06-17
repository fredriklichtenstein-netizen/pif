
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useTranslation } from 'react-i18next';

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
  const { user } = useGlobalAuth();
  const { t } = useTranslation();
  const isLoggedIn = !!user;

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...categories]);
    }
  };

  const isSelected = (currentMode: string) => viewMode === currentMode;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
          <Button 
            variant={isSelected("all") ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode("all")}
          >
            {t('feed.all_pifs')}
          </Button>
          
          {isLoggedIn && (
            <>
              <Button 
                variant={isSelected("saved") ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("saved")}
              >
                {t('feed.saved')}
              </Button>
              
              <Button 
                variant={isSelected("myPifs") ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("myPifs")}
              >
                {t('feed.my_pifs')}
              </Button>
              
              <Button 
                variant={isSelected("archived") ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("archived")}
              >
                {t('feed.archived')}
              </Button>
              
              <Button 
                variant={isSelected("interested") ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("interested")}
              >
                {t('feed.interested')}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1"
        >
          <Filter className="w-4 h-4" />
          <span className="sr-md:inline">{t('feed.filter')}</span>
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-background border rounded-lg p-4 mb-4 shadow-sm">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="font-medium">{t('ui.categories')}</h3>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleSelectAll}
              className="h-auto p-0"
            >
              {allSelected ? t('feed.clear_filters') : t('feed.select_all')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryToggle(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
