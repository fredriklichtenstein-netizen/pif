
import { useState } from "react";
import { LikeButton } from "./interactions/LikeButton";
import { CommentButton } from "./interactions/CommentButton";
import { MessageButton } from "./interactions/MessageButton";
import { InterestButton } from "./interactions/InterestButton";
import { ConversationHandler } from "./interactions/ConversationHandler";
import { InteractionsList } from "./interactions/InteractionsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

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
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  commenters?: User[];
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
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  commenters = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
}: ItemInteractionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasInteractions = likesCount > 0 || interestsCount > 0;
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <LikeButton 
          isLiked={isLiked} 
          onLikeToggle={onLikeToggle} 
          likesCount={likesCount}
          disabled={isOwner}
        />
        
        <CommentButton 
          onCommentToggle={onCommentToggle} 
          commentsCount={commentsCount}
        />
        
        {!isOwner && (
          <ConversationHandler itemId={id} receiverId={postedBy.id}>
            {({ handleClick, isLoading }) => (
              <MessageButton onClick={handleClick} disabled={isLoading} />
            )}
          </ConversationHandler>
        )}
        
        {hasInteractions && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>View Interactions</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Post Interactions</DialogTitle>
              </DialogHeader>
              <InteractionsList 
                likers={likers} 
                interested={likers.length > 0 || interestsCount > 0 ? likers : []} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {!isOwner && (
        <div className="mt-2">
          <InterestButton 
            showInterest={showInterest} 
            onShowInterest={onShowInterest} 
            interestsCount={interestsCount}
          />
        </div>
      )}
    </div>
  );
}
