import { useState } from "react";
import type { Comment } from "@/types/comment";
import { CommentInput } from "../comments/CommentInput";
import { CommentCard } from "../comments/CommentCard";

interface CommentSectionProps {
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
}

export function CommentSection({ comments, setComments }: CommentSectionProps) {
  const handleAddComment = (text: string) => {
    const comment = {
      id: Date.now().toString(),
      text,
      author: {
        name: "Current User",
        avatar: "https://i.pravatar.cc/150?img=3",
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
        name: "Current User",
        avatar: "https://i.pravatar.cc/150?img=3",
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
      <CommentInput onSubmit={handleAddComment} />
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
            currentUser="Current User"
          />
        ))}
      </div>
    </div>
  );
}