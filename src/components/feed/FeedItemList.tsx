
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: () => void;
  isLoading?: boolean;
}

export function FeedItemList({
  posts,
  selectedCategories,
  clearFilters,
  viewMode,
  onItemOperationSuccess,
  isLoading = false
}: FeedItemListProps) {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [errorState, setErrorState] = useState<{ hasError: boolean, errorMessage: string }>({ 
    hasError: false, 
    errorMessage: '' 
  });
  const { toast } = useToast();

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

  // Log when posts change for debugging
  useEffect(() => {
    console.log('FeedItemList: Posts updated', { count: posts?.length, viewMode });
  }, [posts, viewMode]);

  // Error recovery function
  const handleRecoveryAction = () => {
    try {
      setRefreshKey(Date.now()); // Force re-render
      setErrorState({ hasError: false, errorMessage: '' });
      
      // Wait a bit then call onItemOperationSuccess to refresh data
      setTimeout(() => {
        if (onItemOperationSuccess) {
          onItemOperationSuccess();
        }
      }, 300);
      
      toast({
        title: "Refreshing",
        description: "Attempting to recover and refresh the feed",
      });
    } catch (err) {
      console.error("Error during recovery action:", err);
      toast({
        title: "Recovery failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
      });
    }
  };

  // Handle successful operations with better error protection
  const handleItemSuccess = () => {
    try {
      if (onItemOperationSuccess) {
        onItemOperationSuccess();
      }
    } catch (err) {
      console.error("Error in operation success handler:", err);
      setErrorState({
        hasError: true,
        errorMessage: "Error updating feed. Please try refreshing."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (errorState.hasError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md my-4">
        <h3 className="font-semibold mb-2">Error</h3>
        <p className="text-sm mb-3">{errorState.errorMessage}</p>
        <Button onClick={handleRecoveryAction}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" key={refreshKey}>
      {posts?.map((post) => {
        let coordinates;
        if (post.coordinates) {
          try {
            const coords =
              typeof post.coordinates === "string"
                ? parseCoordinatesFromDB(post.coordinates)
                : post.coordinates;
            coordinates = coords;
          } catch (e) {
            console.error("Failed to parse coordinates:", e, post.coordinates);
          }
        }
        
        return (
          <NetworkStatusWrapper key={post.id}>
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
              archived_at={post.archived_at}
              archived_reason={post.archived_reason}
              onOperationSuccess={handleItemSuccess}
            />
          </NetworkStatusWrapper>
        );
      })}
      
      {posts?.length === 0 && (
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
      )}
    </div>
  );
}
