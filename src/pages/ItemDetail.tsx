import { useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useItemCard } from '@/hooks/useItemCard';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useItemDetail } from '@/hooks/item/useItemDetail';
import { useToast } from '@/hooks/use-toast';
import { parseCoordinatesFromDB } from '@/types/post';
import { ItemCardWrapper } from '@/components/item/ItemCardWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ItemDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [localItem, setLocalItem] = useState<any>(null);
  
  if (!id) {
    console.log('No item ID provided in URL params');
    return <Navigate to="/404" replace />;
  }

  // Check local storage for cached item on component mount
  useEffect(() => {
    try {
      const cachedItem = localStorage.getItem(`item_${id}`);
      if (cachedItem) {
        const parsedItem = JSON.parse(cachedItem);
        console.log('Found cached item:', parsedItem);
        setLocalItem(parsedItem);
      }
    } catch (err) {
      console.error('Error reading from local storage:', err);
    } finally {
      setHasCheckedLocalStorage(true);
    }
  }, [id]);

  // Query for the item data
  const { 
    data: item, 
    isLoading, 
    error, 
    refetch 
  } = useItemDetail(id);

  // Cache successful item data in local storage
  useEffect(() => {
    if (item) {
      try {
        localStorage.setItem(`item_${id}`, JSON.stringify(item));
      } catch (err) {
        console.error('Error writing to local storage:', err);
      }
    }
  }, [item, id]);

  // Import hooks but don't use unnecessary state variables
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  } = useItemCard(id);

  // Function to handle manual retries
  const handleRetry = () => {
    console.log('Manual retry initiated for item', id);
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Show loading state
  if (isLoading && !localItem) {
    console.log('Item is loading, showing skeleton...');
    return (
      <div className="container mx-auto px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  // Handle error state with user feedback and retry option
  if (error && !localItem) {
    console.error('Error loading item:', error);
    
    toast({
      title: "Error loading item",
      description: "Could not load item details. You can try refreshing the page.",
      variant: "destructive"
    });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load item details. Please try again later.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={handleRetry} 
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // If there's no item data at all, navigate to 404
  if (!item && !localItem && hasCheckedLocalStorage) {
    console.log('No item data found, redirecting to 404');
    return <Navigate to="/404" replace />;
  }

  // Use either the fetched item or cached local item
  const displayItem = item || localItem;
  
  console.log('Rendering item:', displayItem);

  // Handle user data safely - making sure we access the nested profile data correctly
  const profileData = Array.isArray(displayItem.profiles) ? displayItem.profiles[0] : displayItem.profiles;
  
  const postedBy = {
    id: profileData?.id || "",
    name: profileData?.first_name 
      ? `${profileData.first_name} ${profileData.last_name || ''}`
      : "Unknown User",
    avatar: profileData?.avatar_url || ""
  };

  // Parse coordinates from the database format to the expected format
  const coordinates = displayItem.coordinates ? parseCoordinatesFromDB(String(displayItem.coordinates)) : undefined;

  // Convert measurements from Json type to Record<string, string>
  // Handle the case when measurements is null, undefined or not an object
  const measurementsRecord: Record<string, string> = {};
  if (displayItem.measurements && typeof displayItem.measurements === 'object' && displayItem.measurements !== null) {
    // Safely iterate through measurements and convert all values to strings
    Object.entries(displayItem.measurements).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        measurementsRecord[key] = String(value);
      }
    });
  }

  // When using a cached item and the network request completes, show a refreshed message
  useEffect(() => {
    if (localItem && item) {
      toast({
        title: "Item details refreshed",
        description: "Latest information has been loaded",
      });
    }
  }, [item, localItem, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      {realtimeError && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection issue</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Live updates are currently unavailable.</span>
            <Button 
              onClick={refreshItemData} 
              variant="outline" 
              size="sm"
              className="ml-2 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <ItemCardWrapper
        id={displayItem.id.toString()} // Convert number to string to satisfy the type requirement
        title={displayItem.title}
        description={displayItem.description || ""}
        image={displayItem.images?.[0] || ""}
        images={displayItem.images || []}
        location={displayItem.location || ""}
        coordinates={coordinates}
        category={displayItem.category || ""}
        condition={displayItem.condition}
        measurements={measurementsRecord}
        postedBy={postedBy}
      />
    </div>
  );
}
