
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ItemHeader } from "./ItemHeader";
import { ItemImage } from "./ItemImage";
import { ItemInteractions } from "./ItemInteractions";
import { CommentSection } from "./CommentSection";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check } from "lucide-react";
import { useItemCard } from "@/hooks/useItemCard";

interface ItemCardProps {
  id: number;
  title: string;
  description: string;
  image: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  markAsPiffedAction?: () => void;
  images?: string[]; // Adding this to match the props passed
}

export function ItemCard({
  id,
  title,
  description,
  image,
  images = [],
  location,
  coordinates,
  category,
  condition,
  measurements,
  postedBy,
  markAsPiffedAction
}: ItemCardProps) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = session?.user?.id === postedBy.id;
  
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
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage: itemCardHandleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  } = useItemCard(id.toString());

  // Create a wrapper function that adapts the signature
  const handleMessage = (e: React.MouseEvent) => {
    if (postedBy.id) {
      itemCardHandleMessage(e, id.toString(), postedBy.id);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <ItemImage image={image} title={title} />
      <div className="p-4">
        <ItemHeader
          category={category}
          condition={condition}
          location={location}
          coordinates={coordinates}
          title={title}
          description={description}
          postedBy={postedBy}
        />
        {isOwner && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
            {markAsPiffedAction && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAsPiffedAction}
                className="flex items-center gap-2 ml-auto text-green-600 border-green-200 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
                Mark as Piffed
              </Button>
            )}
          </div>
        )}
        <div className="mt-4">
          <ItemInteractions
            id={id.toString()}
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
            commenters={commenters}
            onLikeToggle={handleLike}
            onCommentToggle={handleCommentToggle}
            onShowInterest={handleShowInterest}
            onBookmarkToggle={handleBookmark}
            onMessage={handleMessage}
            onShare={handleShare}
            onReport={handleReport}
          />
        </div>
        
        {showComments && (
          <CommentSection
            itemId={id.toString()}
            comments={comments}
            setComments={setComments}
          />
        )}
      </div>
    </div>
  );
}
