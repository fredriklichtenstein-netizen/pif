
import { useState } from "react";
import type { Comment } from "@/types/comment";
import { CommentInput } from "../comments/CommentInput";
import { CommentCard } from "../comments/CommentCard";
import { useAuth } from "@/hooks/useAuth";

interface CommentSectionProps {
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
}

export function CommentSection({ comments, setComments }: CommentSectionProps) {
  const { session } = useAuth();
  
  // Debug logs to see what's in the session
  console.log("Session user:", session?.user);
  console.log("User metadata:", session?.user?.user_metadata);
  
  // Extract user information with better fallbacks
  const currentUser = {
    // Get user name with enhanced priority order
    name: session?.user?.user_metadata?.full_name || 
          session?.user?.user_metadata?.name ||
          session?.user?.email?.split('@')[0] || 
          "Anonymous User",
    // Use a proper avatar or fallback to an initial-based one
    avatar: session?.user?.user_metadata?.avatar_url || 
           (session?.user?.id ? `https://ui-avatars.com/api/?name=${
             (session?.user?.user_metadata?.full_name || 
              session?.user?.user_metadata?.name || 
              session?.user?.email?.split('@')[0] || "User").split(' ').map(n => n[0]).join('')
           }&background=random` : "https://ui-avatars.com/api/?name=U&background=random"),
    id: session?.user?.id
  };
  
  console.log("Current user object:", currentUser);

  const handleAddComment = (text: string) => {
    const comment = {
      id: Date.now().toString(),
      text,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };
    setComments([comment, ...comments]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const handleEditComment = (commentId: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, text: newText };
      }
      return comment;
    }));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
  };

  const handleReplyToComment = (commentId: string, text: string) => {
    const reply = {
      id: Date.now().toString(),
      text,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [reply, ...comment.replies],
        };
      }
      return comment;
    }));
  };

  const handleReportComment = (commentId: string) => {
    // This is handled by the toast in the CommentCard component
  };

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={handleAddComment} placeholder="Write a comment..." />
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onLike={handleLikeComment}
            onDelete={handleDeleteComment}
            onEdit={handleEditComment}
            onReply={handleReplyToComment}
            onReport={handleReportComment}
            currentUser={currentUser.id}
          />
        ))}
      </div>
    </div>
  );
}
