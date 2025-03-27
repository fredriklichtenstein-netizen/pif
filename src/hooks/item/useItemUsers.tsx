
import { useState, useEffect } from "react";
import { Comment } from "@/types/comment";
import type { User } from "./utils/userUtils";

/**
 * Hook for managing users who interact with an item (likers and commenters)
 */
export const useItemUsers = (comments: Comment[], fetchLikers: () => Promise<User[]>, likesCount: number) => {
  const [likers, setLikers] = useState<User[]>([]);
  const [commenters, setCommenters] = useState<User[]>([]);
  
  // Extract unique commenters from comments
  useEffect(() => {
    if (comments && comments.length > 0) {
      const uniqueCommenters = Array.from(new Map(
        comments.map(comment => [
          comment.author.id,
          {
            id: comment.author.id,
            name: comment.author.name,
            avatar: comment.author.avatar
          }
        ])
      ).values());
      
      setCommenters(uniqueCommenters);
    }
  }, [comments]);
  
  // Fetch likers when likesCount changes
  useEffect(() => {
    const getLikers = async () => {
      if (likesCount > 0) {
        const fetchedLikers = await fetchLikers();
        setLikers(fetchedLikers);
      }
    };
    
    getLikers();
  }, [likesCount, fetchLikers]);

  return {
    likers,
    commenters
  };
};
