
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { ItemCardWrapper } from "@/components/ItemCardWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Loader2, Filter } from "lucide-react";
import { MainNav } from "@/components/MainNav";
import { parseCoordinatesFromDB } from "@/types/post";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const CATEGORIES = [
  "Furniture",
  "Electronics", 
  "Clothing",
  "Kitchen",
  "Books",
  "Toys",
  "Garden",
  "Sports",
  "Other"
];

export default function Feed() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { posts, isLoading, error, refreshPosts, filterByCategories } = useFeedPosts();

  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

  // Helper to determine if all categories are selected
  const allSelected = selectedCategories.length === CATEGORIES.length;

  /**
   * Update selected categories after toggling one category.
   * If all categories get selected individually, then select all.
   * If a category is deselected when all were selected, deselect it from full set.
   */
  const updateCategoriesAfterToggle = (category: string, selected: boolean) => {
    if (selected) {
      const updated = [...selectedCategories, category];
      // If after adding, all categories selected, set allSelected true
      if (updated.length === CATEGORIES.length) {
        setSelectedCategories([...CATEGORIES]);
      } else {
        setSelectedCategories(updated);
      }
    } else {
      // Deselect this category
      const updated = selectedCategories.filter(c => c !== category);
      setSelectedCategories(updated);
    }
  };

  /**
   * Called when the toggle group value changes.
   * If value includes 'all' and not all are currently selected, select all.
   * If 'all' not included, set to values (individual categories).
   * Prevent toggling off all by clicking 'all' again.
   */
  const handleCategoryChange = (values: string[]) => {
    if (values.includes('all') && !allSelected) {
      setSelectedCategories([...CATEGORIES]);
    } else if (!values.includes('all')) {
      setSelectedCategories(values);
    }
    // If user tries to 'deselect' ALL by clicking its toggle, do nothing—it should only respond to positive selection
  };

  /**
   * Called when a checkbox is toggled
   */
  const handleCheckboxChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      updateCategoriesAfterToggle(category, false);
    } else {
      updateCategoriesAfterToggle(category, true);
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      
      <div className="mb-4 mt-4">
        <h1 className="text-2xl font-bold mb-1">PiF Community</h1>
        <p className="text-muted-foreground">Sustainable sharing in your neighborhood</p>
      </div>
      
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

        <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
          <ToggleGroup 
            type="multiple" 
            // If allSelected true, 'all' toggle should be active, else individual categories.
            value={allSelected ? ['all'] : selectedCategories} 
            onValueChange={handleCategoryChange}
          >
            <ToggleGroupItem
              value="all"
              className={`rounded-full border ${allSelected ? 'bg-primary text-white' : 'bg-accent'}`}
            >
              ALL
            </ToggleGroupItem>
            
            {CATEGORIES.map((category) => (
              <ToggleGroupItem
                key={category}
                value={category}
                className={`rounded-full border ${selectedCategories.includes(category) ? 'bg-primary text-white' : 'bg-accent'}`}
              >
                {category}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {showFilters && (
          <div className="bg-accent/40 rounded-lg p-3 mb-4 mt-2 grid grid-cols-2 gap-2">
            <div className="col-span-2 mb-1 flex justify-between items-center">
              <h3 className="text-sm font-medium">Select categories</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
            
            {CATEGORIES.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox 
                  id={`filter-${category}`} 
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => handleCheckboxChange(category)}
                />
                <label 
                  htmlFor={`filter-${category}`}
                  className="text-sm cursor-pointer"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {posts?.map((post) => {
          let coordinates;
          if (post.coordinates) {
            try {
              const coords = typeof post.coordinates === 'string' 
                ? parseCoordinatesFromDB(post.coordinates) 
                : post.coordinates;
              coordinates = coords;
            } catch (e) {
              console.error("Failed to parse coordinates:", e, post.coordinates);
            }
          }

          return (
            <ItemCardWrapper key={post.id}>
              <ItemCard 
                id={post.id}
                title={post.title}
                description={post.description}
                image={post.images && post.images.length > 0 ? post.images[0] : ''}
                images={post.images}
                location={post.location}
                coordinates={coordinates}
                category={post.category}
                condition={post.condition}
                measurements={post.measurements}
                postedBy={{
                  id: post.user_id,
                  name: post.user_name || 'Anonymous',
                  avatar: post.user_avatar || '',
                }}
              />
            </ItemCardWrapper>
          );
        })}
        {posts?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No items found matching your filters</p>
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
        )}
      </div>
      
      <MainNav />
    </div>
  );
}
