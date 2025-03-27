
import { useState } from "react";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InteractionsList } from "./interactions/InteractionsList";
import { Button } from "@/components/ui/button";
import { ConversationHandler } from "./interactions/ConversationHandler";

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
    <div className="flex flex-col space-y-2">
      {/* Counts row */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-2 border-b border-gray-200">
          {likesCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                <ThumbsUp className="h-3 w-3 text-white" />
              </div>
              <span>
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            </div>
          )}
          
          <div className="ml-auto flex gap-2">
            {commentsCount > 0 && (
              <button 
                onClick={onCommentToggle}
                className="hover:underline"
              >
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Action buttons row */}
      <div className="flex items-center justify-between border-b border-gray-200 py-1">
        <button 
          onClick={onLikeToggle}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
            isLiked ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
          disabled={isOwner}
        >
          <ThumbsUp className={`h-5 w-5 mr-2 ${isLiked ? 'fill-primary' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
        
        <button 
          onClick={onCommentToggle}
          className="flex-1 flex items-center justify-center py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Comment</span>
        </button>
        
        <button 
          onClick={onShare}
          className="flex-1 flex items-center justify-center py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Share2 className="h-5 w-5 mr-2" />
          <span className="font-medium">Share</span>
        </button>
      </div>
      
      {hasInteractions && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-gray-600 mt-1 hover:underline hover:bg-transparent hover:text-gray-800"
            >
              View all interactions
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
  );
}
