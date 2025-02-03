import { useState } from "react";
import type { Comment } from "@/types/comment";

export const useComments = () => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  return {
    showComments,
    comments,
    handleCommentToggle,
    setComments,
  };
};