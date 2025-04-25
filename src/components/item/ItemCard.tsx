
import { memo, useState } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./ItemCardContent";
import { ItemInteractions } from "./ItemInteractions";
import { CommentSection } from "@/components/post/CommentSection";
import { ReportDialog } from "./ReportDialog";
import type { ItemCardProps } from "./types";
import { NetworkStatus } from "../common/NetworkStatus";
import { parseCoordinatesFromDB } from "@/types/post";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ItemCard = memo(function ItemCard({
  id,
  title,
  description,
  image,
  images = [],
  location,
  coordinates,
  category,
  condition,
  measurements = {},
  postedBy
}: ItemCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const { session } = useGlobalAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOwner = session?.user?.id === postedBy.id;

  // Debug log for coordinates
  console.log(`ItemCard ${id} coordinates:`, coordinates);

  // Parse coordinates if they're in string format
  let parsedCoordinates = coordinates;
  if (coordinates && typeof coordinates === 'string') {
    parsedCoordinates = parseCoordinatesFromDB(coordinates);
    console.log("Parsed coordinates:", parsedCoordinates);
  }
  
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    interactionsLoading,
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
  
  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to report items",
        variant: "destructive",
      });
      return;
    }
    
    setIsReportDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      // Check if anyone is interested
      const { count, error: countError } = await supabase
        .from('interests')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', id);
        
      if (countError) throw countError;
      
      // If people are interested, show a special warning
      if (count && count > 0) {
        const confirmed = confirm(`This item has ${count} interested users. They will be notified about the deletion. Are you sure you want to continue?`);
        if (!confirmed) return;
      }
      
      // Delete the item (in production this would be a soft delete)
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Item deleted",
        description: "Your item has been deleted successfully",
      });
      
      // In a real implementation we would send notifications to interested users here
      
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };
  
  const handleMessage = () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      return;
    }
    
    if (postedBy.id) {
      navigate(`/conversation/new?item=${id}&user=${postedBy.id}`);
    }
  };
  
  return (
    <Card id={`item-card-${id}`} className="overflow-hidden transition-shadow hover:shadow-md rounded-xl">
      {realtimeError && <NetworkStatus onRetry={refreshItemData} />}
      
      <ItemCardHeader
        postedBy={postedBy}
        isOwner={isOwner}
        handleReport={handleReportClick}
        coordinates={parsedCoordinates}
        itemId={Number(id)}
      />
      
      <div className="relative">
        <ItemCardGallery images={images.length > 0 ? images : image ? [image] : []} title={title} category={category} />
      </div>
      
      <div className="p-4 py-0">
        <ItemInteractions 
          id={id} 
          postedBy={postedBy} 
          isLiked={isLiked} 
          showComments={showComments} 
          isBookmarked={isBookmarked} 
          showInterest={showInterest} 
          isOwner={isOwner} 
          commentsCount={commentsCount} 
          likesCount={likesCount} 
          interestsCount={interestsCount} 
          likers={likers} 
          interestedUsers={interestedUsers} 
          commenters={commenters} 
          onLikeToggle={handleLike} 
          onCommentToggle={handleCommentToggle} 
          onShowInterest={handleShowInterest} 
          onBookmarkToggle={handleBookmark} 
          onMessage={handleMessage} 
          onShare={handleShare} 
          onReport={handleReportClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          interactionsLoading={interactionsLoading} 
          isLoadingInterested={isLoadingInterested} 
          interestedError={interestedError} 
          getInterestedUsers={getInterestedUsers} 
          isRealtimeSubscribed={isRealtimeSubscribed} 
        />

        <ItemCardContent description={description} measurements={measurements} />
        
        {showComments && <CommentSection itemId={id} comments={comments} setComments={setComments} isLoading={commentsLoading} error={commentsError} />}
      </div>
      
      <ReportDialog 
        open={isReportDialogOpen} 
        onOpenChange={setIsReportDialogOpen} 
        itemId={id} 
      />
    </Card>
  );
});

export { ItemCard };
