
import { useState, useEffect, useCallback } from "react";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { Loader2 } from "lucide-react";
import { MainNav } from "@/components/MainNav";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedItemList } from "@/components/feed/FeedItemList";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

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
  const [searchParams] = useSearchParams();
  
  // Get post ID from URL if present
  const postIdParam = searchParams.get('post');
  
  const { 
    posts, 
    isLoading, 
    error, 
    refreshPosts, 
    filterByCategories, 
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts
  } = useFeedPosts();

  // Apply category filters whenever selected categories change
  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

  // Memoized function to load posts based on view mode
  const loadPostsBasedOnViewMode = useCallback(async (mode: string) => {
    if (!user && mode !== "all") {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this filter",
        variant: "destructive"
      });
      setViewMode("all");
      return;
    }
    
    switch (mode) {
      case "saved":
        await loadSavedPosts();
        break;
      case "myPifs":
        await loadMyPosts();
        break;
      case "archived":
        await loadArchivedPosts();
        break;
      case "interested":
        await loadInterestedPosts();
        break;
      default:
        await refreshPosts();
    }
  }, [user, loadSavedPosts, loadMyPosts, loadArchivedPosts, loadInterestedPosts, refreshPosts, toast]);

  // Load posts whenever view mode changes or user auth state changes
  useEffect(() => {
    loadPostsBasedOnViewMode(viewMode);
  }, [viewMode, user, loadPostsBasedOnViewMode]);

  // Force refresh when returning to feed page
  useEffect(() => {
    // This will trigger a refresh when the component mounts
    // Crucial for when returning to feed after delete/archive operations
    refreshPosts();
  }, [refreshPosts]);

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
