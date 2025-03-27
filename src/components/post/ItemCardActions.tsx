
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InteractionsList } from "./interactions/InteractionsList";
import { useState } from "react";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemCardActionsProps {
  isLiked: boolean;
  likesCount?: number;
  commentsCount?: number;
  showInterest: boolean;
  interestsCount?: number;
  isOwner: boolean;
  likers?: User[];
  interestedUsers?: User[];
  onLike: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onShare?: () => void;
}

export function ItemCardActions({
  isLiked,
  likesCount = 0,
  commentsCount = 0,
  showInterest,
  interestsCount = 0,
  isOwner,
  likers = [],
  interestedUsers = [],
  onLike,
  onCommentToggle,
  onShowInterest,
  onShare
}: ItemCardActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasInteractions = likesCount > 0 || interestsCount > 0;
  
  return (
    <div className="w-full flex flex-col">
      {/* Counts row */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-2 border-b border-gray-200">
          {likesCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                <ThumbsUp className="h-3 w-3 text-white" />
              </div>
              <span>
                {likesCount}
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
            
            {hasInteractions && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="hover:underline">
                    View all
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Post Interactions</DialogTitle>
                  </DialogHeader>
                  <InteractionsList 
                    likers={likers} 
                    interested={interestedUsers} 
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}
      
      {/* Action buttons row */}
      <div className="flex items-center justify-between border-b border-gray-200 py-1">
        <button 
          onClick={onLike}
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
      
      {!isOwner && showInterest && (
        <button 
          onClick={onShowInterest}
          className="text-xs text-primary mt-1 hover:underline self-start"
        >
          I'm interested in this item
        </button>
      )}
    </div>
  );
}
