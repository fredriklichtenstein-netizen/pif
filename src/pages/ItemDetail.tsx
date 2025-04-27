
import { useParams, Navigate } from 'react-router-dom';
import { useItemCard } from '@/hooks/useItemCard';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useItemDetail } from '@/hooks/item/useItemDetail';
import { useToast } from '@/hooks/use-toast';
import { parseCoordinatesFromDB } from '@/types/post';
import { ItemCardWrapper } from '@/components/item/ItemCardWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
  if (!id) {
    return <Navigate to="/404" replace />;
  }

  const { data: item, isLoading, error } = useItemDetail(id);

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  // Handle error state with user feedback
  if (error) {
    toast({
      title: "Error loading item",
      description: "The item could not be loaded. Please try again later.",
      variant: "destructive"
    });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to load item details. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If there's no item data at all, navigate to 404
  if (!item) {
    return <Navigate to="/404" replace />;
  }

  // Handle user data safely - making sure we access the nested profile data correctly
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  
  const postedBy = {
    id: profileData?.id || "",
    name: profileData?.first_name 
      ? `${profileData.first_name} ${profileData.last_name || ''}`
      : "Unknown User",
    avatar: profileData?.avatar_url || ""
  };

  // Parse coordinates from the database format to the expected format
  const coordinates = item.coordinates ? parseCoordinatesFromDB(String(item.coordinates)) : undefined;

  // Convert measurements from Json type to Record<string, string>
  // Handle the case when measurements is null, undefined or not an object
  const measurementsRecord: Record<string, string> = {};
  if (item.measurements && typeof item.measurements === 'object' && item.measurements !== null) {
    // Safely iterate through measurements and convert all values to strings
    Object.entries(item.measurements).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        measurementsRecord[key] = String(value);
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ItemCardWrapper
        id={item.id.toString()} // Convert number to string to satisfy the type requirement
        title={item.title}
        description={item.description || ""}
        image={item.images?.[0] || ""}
        images={item.images || []}
        location={item.location || ""}
        coordinates={coordinates}
        category={item.category || ""}
        condition={item.condition}
        measurements={measurementsRecord}
        postedBy={postedBy}
      />
    </div>
  );
}
