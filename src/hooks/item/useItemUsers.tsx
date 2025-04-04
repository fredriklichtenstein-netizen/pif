
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

  // Prefetch interested users for better UX
  const prefetchInterestedUsers = useCallback(async () => {
    if (interestsCount && interestsCount > 0 && fetchInterested) {
      console.log("Prefetching interested users...");
      setIsLoadingInterested(true);
      try {
        const fetchedInterested = await fetchInterested();
        console.log(`Prefetched ${fetchedInterested.length} interested users`);
        setInterestedUsers(fetchedInterested);
      } catch (error) {
        console.error("Error prefetching interested users:", error);
        setInterestedUsers([]);
      } finally {
        setIsLoadingInterested(false);
      }
    }
  }, [interestsCount, fetchInterested]);

  // Prefetch interested users when the component mounts or interestsCount changes
  useEffect(() => {
    prefetchInterestedUsers();
  }, [prefetchInterestedUsers]);

  // Actual fetch for interested users (will use cached data if already prefetched)
  const getInterestedUsers = useCallback(async () => {
    if (interestsCount && interestsCount > 0 && fetchInterested && interestedUsers.length === 0) {
      console.log("Fetching interested users on demand...");
      setIsLoadingInterested(true);
      try {
        const fetchedInterested = await fetchInterested();
        console.log(`Fetched ${fetchedInterested.length} interested users on demand`);
        setInterestedUsers(fetchedInterested);
      } catch (error) {
        console.error("Error fetching interested users on demand:", error);
        setInterestedUsers([]);
      } finally {
        setIsLoadingInterested(false);
      }
    }
  }, [interestsCount, fetchInterested, interestedUsers.length]);

  return {
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    getInterestedUsers
  };
};
