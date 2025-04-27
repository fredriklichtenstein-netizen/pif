
import { useParams, Navigate } from 'react-router-dom';
import { useItemCard } from '@/hooks/useItemCard';
import { ItemCard } from '@/components/post/ItemCard';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useItemDetail } from '@/hooks/item/useItemDetail';
import { useToast } from '@/hooks/use-toast';
import { parseCoordinatesFromDB } from '@/types/post';

export default function ItemDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
  if (!id) {
    return <Navigate to="/404" replace />;
  }

  const { data: item, isLoading, error } = useItemDetail(id);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    toast({
      title: "Error loading item",
      description: "The item could not be loaded. Please try again later.",
      variant: "destructive"
    });
    return <Navigate to="/404" replace />;
  }

  if (!item) {
    return <Navigate to="/404" replace />;
  }

  // Handle user data safely
  const postedBy = {
    id: item.profiles?.id || "",
    name: item.profiles?.first_name 
      ? `${item.profiles.first_name} ${item.profiles.last_name || ''}`
      : "Unknown User",
    avatar: item.profiles?.avatar_url || ""
  };

  // Parse coordinates from the database format to the expected format
  const coordinates = item.coordinates ? parseCoordinatesFromDB(String(item.coordinates)) : undefined;

  return (
    <div className="container mx-auto px-4 py-8">
      <ItemCard
        id={item.id}
        title={item.title}
        description={item.description || ""}
        image={item.images?.[0] || ""}
        images={item.images || []}
        location={item.location || ""}
        coordinates={coordinates}
        category={item.category || ""}
        condition={item.condition}
        measurements={item.measurements}
        postedBy={postedBy}
      />
    </div>
  );
}
