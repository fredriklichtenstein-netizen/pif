
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useItemDetail } from '@/hooks/item/useItemDetail';
import { useToast } from '@/hooks/use-toast';
import { parseCoordinatesFromDB } from '@/types/post';
import { useItemCard } from '@/hooks/useItemCard';
import { useTranslation } from 'react-i18next';

export function useItemDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [retryCount, setRetryCount] = useState(0);
  const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);
  const [localItem, setLocalItem] = useState<any>(null);
  
  // Validate the ID parameter
  if (!id) {
    return { redirectTo404: true };
  }

  // Query for the item data
  const { 
    data: item, 
    isLoading, 
    error, 
    refetch 
  } = useItemDetail(id);

  // Import hooks
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
    setRetryCount(prev => prev + 1);
    refetch();
  };

  // Check local storage for cached item on component mount
  useEffect(() => {
    try {
      const cachedItem = localStorage.getItem(`item_${id}`);
      if (cachedItem) {
        const parsedItem = JSON.parse(cachedItem);
        setLocalItem(parsedItem);
      }
    } catch (err) {
      console.error('Error reading from local storage:', err);
    } finally {
      setHasCheckedLocalStorage(true);
    }
  }, [id]);

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

  // When using a cached item and the network request completes, show a refreshed message
  useEffect(() => {
    if (localItem && item) {
      toast({
        title: t('interactions.item_refreshed'),
        description: t('interactions.item_refreshed_description'),
      });
    }
  }, [item, localItem, toast]);

  // If there's no item data at all, return redirect flag
  if (!item && !localItem && hasCheckedLocalStorage && !isLoading) {
    return { redirectTo404: true };
  }

  // Use either the fetched item or cached local item
  const displayItem = item || localItem;
  
  let postedBy = { id: "", name: "Unknown User", avatar: "" };
  let coordinates;
  let measurementsRecord: Record<string, string> = {};

  // Only process displayItem if it exists
  if (displayItem) {
    // Handle user data safely - making sure we access the nested profile data correctly
    const profileData = Array.isArray(displayItem.profiles) ? displayItem.profiles[0] : displayItem.profiles;
    
    postedBy = {
      id: profileData?.id || "",
      name: profileData?.first_name 
        ? `${profileData.first_name} ${profileData.last_name || ''}`
        : "Unknown User",
      avatar: profileData?.avatar_url || ""
    };

    // Parse coordinates from the database format to the expected format
    coordinates = displayItem.coordinates ? parseCoordinatesFromDB(String(displayItem.coordinates)) : undefined;

    // Convert measurements from Json type to Record<string, string>
    if (displayItem.measurements && typeof displayItem.measurements === 'object' && displayItem.measurements !== null) {
      // Safely iterate through measurements and convert all values to strings
      Object.entries(displayItem.measurements).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          measurementsRecord[key] = String(value);
        }
      });
    }
  }

  return {
    redirectTo404: false,
    isLoading,
    error,
    displayItem,
    postedBy,
    coordinates,
    measurementsRecord,
    handleRetry,
    realtimeError,
    refreshItemData,
    interactions: {
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
      isRealtimeSubscribed
    }
  };
}
