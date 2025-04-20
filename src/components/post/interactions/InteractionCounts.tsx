
import { ThumbsUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InteractionsList } from "./InteractionsList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";
import { useState, useEffect } from "react";

interface InteractionCountsProps {
  likesCount: number;
  commentsCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  onCommentToggle: () => void;
  isLoadingInterested?: boolean;
  interestedError?: Error | null;
  getInterestedUsers?: () => void;
}

export function InteractionCounts({
  likesCount,
  commentsCount,
  interestsCount,
  likers,
  interestedUsers,
  onCommentToggle,
  isLoadingInterested = false,
  interestedError = null,
  getInterestedUsers
}: InteractionCountsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Trigger interested users fetch when dialog opens
  useEffect(() => {
    if (dialogOpen && getInterestedUsers && !hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      getInterestedUsers();
    }
    
    // Reset hasAttemptedFetch when dialog closes
    if (!dialogOpen) {
      setHasAttemptedFetch(false);
    }
  }, [dialogOpen, getInterestedUsers, hasAttemptedFetch]);
  
  // Don't render if no counts to show
  if (likesCount === 0 && commentsCount === 0 && interestsCount === 0) {
    return null;
  }

  return (
    <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-1 border-b border-gray-200"> {/* Reduced vertical padding */}
      {likesCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 hover:underline">
              <div className="bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                <ThumbsUp className="h-3 w-3 text-white" />
              </div>
              <span>{likesCount}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {likers.length > 0 ? (
                likers.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-gray-500">No likes yet</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
      
      <div className="ml-auto flex gap-1"> {/* Reduced gap */}
        {commentsCount > 0 && (
          <button onClick={onCommentToggle} className="hover:underline">
            {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
          </button>
        )}
        
        {interestsCount > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="hover:underline">
                {interestsCount} interested
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>People Interested</DialogTitle>
              </DialogHeader>
              <InteractionsList 
                interested={interestedUsers} 
                isLoading={isLoadingInterested}
                error={interestedError} 
                onRetry={getInterestedUsers}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
