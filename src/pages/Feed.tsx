import { useState, useEffect } from "react";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { Loader2 } from "lucide-react";
import { MainNav } from "@/components/MainNav";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedItemList } from "@/components/feed/FeedItemList";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";

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
  const [viewMode, setViewMode] = useState("all");
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  
  const { 
    posts, 
    isLoading, 
    error, 
    refreshPosts, 
    filterByCategories, 
    loadSavedPosts,
    loadMyPosts,
    loadInterestedPosts
  } = useFeedPosts();

  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

  useEffect(() => {
    const loadPostsBasedOnViewMode = async () => {
      if (!user && viewMode !== "all") {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this filter",
          variant: "destructive"
        });
        setViewMode("all");
        return;
      }
      
      switch (viewMode) {
        case "saved":
          await loadSavedPosts();
          break;
        case "myPifs":
          await loadMyPosts();
          break;
        case "interested":
          await loadInterestedPosts();
          break;
        default:
          await refreshPosts();
      }
    };
    
    loadPostsBasedOnViewMode();
  }, [viewMode, user]);

  const allSelected = selectedCategories.length === CATEGORIES.length;

  // To check if a specific category is selected
  const isCategorySelected = (category: string) => selectedCategories.includes(category);

  // Select all categories
  const selectAll = () => setSelectedCategories([...CATEGORIES]);
  // Clear all categories
  const clearFilters = () => setSelectedCategories([]);

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

      {/* Filters component */}
      <FeedFilters
        categories={CATEGORIES}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        allSelected={allSelected}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* ItemList component */}
      <FeedItemList
        posts={posts}
        selectedCategories={selectedCategories}
        clearFilters={clearFilters}
        viewMode={viewMode}
      />
      <MainNav />
    </div>
  );
}
