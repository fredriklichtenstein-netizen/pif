
import { useState, useEffect } from "react";
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
    const getInterestedUsers = async () => {
      if (interestsCount && interestsCount > 0 && fetchInterested) {
        try {
          const fetchedInterested = await fetchInterested();
          setInterestedUsers(fetchedInterested);
        } catch (error) {
          console.error("Error fetching interested users in useItemUsers:", error);
          setInterestedUsers([]);
        }
      } else {
        setInterestedUsers([]);
      }
    };
    
    if (fetchInterested) {
      getInterestedUsers();
    }
  }, [interestsCount, fetchInterested]);

  return {
    likers,
    commenters,
    interestedUsers
  };
};
