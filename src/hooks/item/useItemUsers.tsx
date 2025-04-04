
import { useState, useEffect, useCallback } from "react";
import { Comment } from "@/types/comment";
import type { User } from "./utils/userUtils";

/**
 * Hook for managing users who interact with an item (likers, commenters, and interested users)
 */
export const useItemUsers = (
  comments: Comment[], 
  fetchLikers: () => Promise<User[]>, 
  likesCount: number,
  fetchInterested?: () => Promise<User[]>,
  interestsCount?: number
) => {
  const [likers, setLikers] = useState<User[]>([]);
  const [commenters, setCommenters] = useState<User[]>([]);
  const [interestedUsers, setInterestedUsers] = useState<User[]>([]);
  const [isLoadingInterested, setIsLoadingInterested] = useState(false);
  const [interestedError, setInterestedError] = useState<Error | null>(null);
  
  // Extract unique commenters from comments
  useEffect(() => {
    if (comments && comments.length > 0) {
      // Create a Map to ensure unique commenters by ID
      const uniqueCommentersMap = new Map();
      
      comments.forEach(comment => {
        if (comment.author && comment.author.id) {
          uniqueCommentersMap.set(comment.author.id, {
            id: comment.author.id,
            name: comment.author.name,
            avatar: comment.author.avatar
          });
        }
      });
      
      const uniqueCommenters = Array.from(uniqueCommentersMap.values());
      setCommenters(uniqueCommenters);
    } else {
      setCommenters([]);
    }
  }, [comments]);
  
  // Fetch likers when likesCount changes
  useEffect(() => {
    const getLikers = async () => {
      if (likesCount > 0) {
        try {
          const fetchedLikers = await fetchLikers();
          setLikers(fetchedLikers);
        } catch (error) {
          console.error("Error fetching likers in useItemUsers:", error);
          setLikers([]);
        }
      } else {
        setLikers([]);
      }
    };
    
    getLikers();
  }, [likesCount, fetchLikers]);

  // Fetch interested users when interestsCount changes
  useEffect(() => {
    const getInterested = async () => {
      if (interestsCount && interestsCount > 0 && fetchInterested) {
        console.log(`Auto-fetching interested users due to interestsCount change: ${interestsCount}`);
        setIsLoadingInterested(true);
        setInterestedError(null);
        
        try {
          const result = await fetchInterested();
          console.log(`Auto-fetched ${result.length} interested users`);
          setInterestedUsers(result);
        } catch (error) {
          console.error("Error auto-fetching interested users:", error);
          setInterestedError(error instanceof Error ? error : new Error('Unknown error'));
          setInterestedUsers([]);
        } finally {
          setIsLoadingInterested(false);
        }
      } else if (interestsCount === 0) {
        setInterestedUsers([]);
      }
    };
    
    getInterested();
  }, [interestsCount, fetchInterested]);

  // Actual fetch for interested users (will use cached data if already fetched)
  const getInterestedUsers = useCallback(async () => {
    if (fetchInterested) {
      console.log("Explicitly fetching interested users on demand...");
      setIsLoadingInterested(true);
      setInterestedError(null);
      
      try {
        const fetchedInterested = await fetchInterested();
        console.log(`Fetched ${fetchedInterested.length} interested users on demand`);
        setInterestedUsers(fetchedInterested);
      } catch (error) {
        console.error("Error fetching interested users on demand:", error);
        setInterestedError(error instanceof Error ? error : new Error('Unknown error'));
        setInterestedUsers([]);
      } finally {
        setIsLoadingInterested(false);
      }
    }
  }, [fetchInterested]);

  return {
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    getInterestedUsers
  };
};
