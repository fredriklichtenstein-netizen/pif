
import { useState, useEffect } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useComments } from "./item/useComments";
import { useCommentData } from "./comments/useCommentData";
import { Comment } from "@/types/comment";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

export const useItemCard = (id: string) => {
  const [likers, setLikers] = useState<User[]>([]);
  const [commenters, setCommenters] = useState<User[]>([]);
  
  const {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
    fetchLikers,
  } = useItemInteractions(id);

  const {
    handleMessage,
    handleShare,
    handleReport,
  } = useItemActions();

  const {
    showComments,
    comments: localComments,
    handleCommentToggle,
    setComments,
  } = useComments();

  // Fetch comments from the database
  const { comments: fetchedComments, isLoading: commentsLoading } = useCommentData(id);
  
  // Update local comments state when fetched comments change
  useEffect(() => {
    if (fetchedComments && fetchedComments.length > 0) {
      console.log(`Setting ${fetchedComments.length} comments in useItemCard for item ${id}`);
      setComments(fetchedComments);
    }
  }, [fetchedComments, setComments, id]);
  
  // Extract unique commenters from comments
  useEffect(() => {
    if (localComments && localComments.length > 0) {
      const uniqueCommenters = Array.from(new Map(
        localComments.map(comment => [
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
  }, [localComments]);
  
  // Fetch likers when the component mounts or likesCount changes
  useEffect(() => {
    const getLikers = async () => {
      if (likesCount > 0) {
        const fetchedLikers = await fetchLikers();
        setLikers(fetchedLikers);
      }
    };
    
    getLikers();
  }, [likesCount, fetchLikers, id]);

  return {
    isLiked,
    likesCount,
    showComments,
    comments: localComments,
    commentsCount: localComments.length,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  };
};
