
import { useToast } from "@/hooks/use-toast";
import { PrimaryActions } from "./interactions/PrimaryActions";
import { SecondaryActions } from "./interactions/SecondaryActions";
import { InterestButton } from "./interactions/InterestButton";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
}

export function ItemInteractions({
  id,
  postedBy,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  isOwner = false,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
}: ItemInteractionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      
      // Refresh the page or update the UI as appropriate
      window.location.reload();
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
    <div className="flex flex-col px-4 py-2 border-t border-gray-100">
      {isOwner && (
        <div className="mb-3 flex gap-2">
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
        </div>
      )}
      <div className="flex items-center justify-between">
        <PrimaryActions
          isLiked={isLiked}
          showComments={showComments}
          onLikeToggle={onLikeToggle}
          onCommentToggle={onCommentToggle}
          onMessage={onMessage}
        />

        <div className="flex items-center space-x-3">
          <InterestButton 
            showInterest={showInterest} 
            onShowInterest={onShowInterest} 
          />
          <SecondaryActions
            isBookmarked={isBookmarked}
            onBookmarkToggle={onBookmarkToggle}
            onShare={onShare}
            onReport={onReport}
          />
        </div>
      </div>
    </div>
  );
}
