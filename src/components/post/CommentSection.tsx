import { useEffect } from "react";
import { Comment } from "@/types/comment";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isLoading?: boolean;
  error?: Error | null;
  onLoadComments?: () => void;
}

export function CommentSection({ 
  itemId, 
  comments,
  setComments,
  isLoading = false,
  error = null,
  onLoadComments
}: CommentSectionProps) {
  useEffect(() => {
    if (onLoadComments) {
      onLoadComments();
    }
  }, [onLoadComments]);

  return (
    <LazyCommentsSection
      itemId={itemId}
      isVisible={true}
    />
  );
}
