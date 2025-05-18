
import { NetworkStatusWrapper } from "@/components/common/NetworkStatusWrapper";
import { ItemCard } from "@/components/item/ItemCard";
import { parseCoordinatesFromDB } from "@/types/post";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

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

  // Enhanced recovery function with debouncing and complete refresh
  const handleRecoveryAction = useCallback(() => {
    try {
      setIsRefreshing(true);
      
      // Force component re-render with a new key
      setRefreshKey(Date.now());
      setErrorState({ hasError: false, errorMessage: '' });
      
      toast({
        title: "Refreshing",
        description: "Attempting to recover and refresh the feed",
      });
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Wait a bit then call onItemOperationSuccess to refresh data
      refreshTimerRef.current = setTimeout(() => {
        if (onItemOperationSuccess) {
          try {
            onItemOperationSuccess();
            console.log("Feed data refresh completed");
          } catch (err) {
            console.error("Error during recovery refresh:", err);
            // If the callback fails, we'll still try to recover UI
            setRefreshKey(Date.now() + 1);
          } finally {
            setIsRefreshing(false);
            refreshTimerRef.current = null;
          }
        } else {
          setIsRefreshing(false);
        }
      }, 800); // Longer delay for more complete refresh
    } catch (err) {
      console.error("Error during recovery action:", err);
      toast({
        title: "Recovery failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  }, [onItemOperationSuccess, toast]);

  // Enhanced handler for item operations with operation type
  const handleItemSuccess = useCallback((operationType?: OperationType) => {
    try {
      const itemId = arguments[0]; // Explicitly access the first argument
      console.log(`Item ${operationType || 'operation'} success callback triggered for item ${itemId}`);
      
      // Reset any error state
      if (errorState.hasError) {
        setErrorState({ hasError: false, errorMessage: '' });
      }
      
      // Force a re-render first to clear any stale UI
      setRefreshKey(Date.now());
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Pass the operation details to the parent component for optimistic updates
      if (onItemOperationSuccess) {
        try {
          onItemOperationSuccess(itemId, operationType);
        } catch (err) {
          console.error("Error in operation success handler:", err);
          setErrorState({
            hasError: true,
            errorMessage: "Error updating feed. Please try refreshing."
          });
        }
      }
    } catch (err) {
      console.error("Error in handleItemSuccess:", err);
      setErrorState({
        hasError: true,
        errorMessage: "Error updating feed. Please try refreshing."
      });
    }
  }, [onItemOperationSuccess, errorState]);

  if (isLoading || isRefreshing) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (errorState.hasError) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md my-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Error</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRecoveryAction}
            className="p-1 h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <p className="text-sm mb-3">{errorState.errorMessage}</p>
        <Button onClick={handleRecoveryAction}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" key={refreshKey}>
      {posts?.map((post) => {
        // Skip posts that have been optimistically deleted
        if (post.__deleted) return null;
        
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
        
        // Apply optimistic UI transition class if the item was just modified
        const transitionClass = post.__modified ? "animate-fade-in" : "";
        
        return (
          <NetworkStatusWrapper key={post.id}>
            <div className={transitionClass}>
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
            </div>
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
