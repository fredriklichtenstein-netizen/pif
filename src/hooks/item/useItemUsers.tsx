
import { useState, useEffect, useCallback } from "react";
import { Comment } from "@/types/comment";
import type { User } from "./utils/userUtils";

interface UserCacheState {
  likers: User[];
  commenters: User[];
  interestedUsers: User[];
  isLoadingInterested: boolean;
  interestedError: Error | null;
}

export const useItemUsers = (
  comments: Comment[],
  fetchLikers: () => Promise<User[]>,
  likesCount: number,
  fetchInterestedUsers: () => Promise<User[]>,
  interestsCount: number
) => {
  const [state, setState] = useState<UserCacheState>({
    likers: [],
    commenters: [],
    interestedUsers: [],
    isLoadingInterested: false,
    interestedError: null
  });

  // Extract unique commenters from comments
  useEffect(() => {
    if (!comments || comments.length === 0) return;
    
    const uniqueCommenters: { [key: string]: User } = {};
    
    comments.forEach(comment => {
      if (comment.user && !uniqueCommenters[comment.user.id]) {
        uniqueCommenters[comment.user.id] = comment.user;
      }
    });
    
    setState(prev => ({
      ...prev,
      commenters: Object.values(uniqueCommenters)
    }));
  }, [comments]);

  // Fetch likers when likesCount changes
  useEffect(() => {
    if (likesCount > 0 && state.likers.length === 0) {
      fetchLikers()
        .then(users => {
          setState(prev => ({
            ...prev,
            likers: users
          }));
        })
        .catch(error => {
          console.error("Error fetching likers:", error);
        });
    }
  }, [likesCount, fetchLikers, state.likers.length]);

  // Function to fetch interested users on demand
  const getInterestedUsers = useCallback(() => {
    if (state.interestedUsers.length > 0 || interestsCount === 0) return;
    
    setState(prev => ({
      ...prev,
      isLoadingInterested: true,
      interestedError: null
    }));
    
    fetchInterestedUsers()
      .then(users => {
        setState(prev => ({
          ...prev,
          interestedUsers: users,
          isLoadingInterested: false
        }));
      })
      .catch(error => {
        console.error("Error fetching interested users:", error);
        setState(prev => ({
          ...prev,
          isLoadingInterested: false,
          interestedError: error instanceof Error ? error : new Error('Unknown error fetching interested users')
        }));
      });
  }, [interestsCount, fetchInterestedUsers, state.interestedUsers.length]);

  return {
    ...state,
    getInterestedUsers
  };
};
