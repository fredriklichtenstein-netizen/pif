
import { useState } from "react";
import { ThumbsUp, Reply, Trash2, Pencil, MoreHorizontal, Flag } from "lucide-react";
import type { Comment } from "@/types/comment";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CommentInput } from "./CommentInput";
import { useToast } from "@/hooks/use-toast";

interface CommentCardProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newText: string) => void;
  onReply: (commentId: string, text: string) => void;
  onReport: (commentId: string) => void;
  currentUser?: string;
  level?: number;
}

export function CommentCard({
  comment,
  onLike,
  onDelete,
  onEdit,
  onReply,
  onReport,
  currentUser = "",
  level = 0,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const maxReplyLevel = 3;
  const { toast } = useToast();
  
  const isCurrentUserAuthor = currentUser === comment.author.id;

  const handleSaveEdit = () => {
    onEdit(comment.id, editedText);
    setIsEditing(false);
  };

  const handleReply = (text: string) => {
    onReply(comment.id, text);
    setShowReplyInput(false);
  };

  const handleReport = () => {
    onReport(comment.id);
    toast({
      title: "Comment reported",
      description: "Thank you for helping keep our community safe.",
    });
  };

  return (
    <div className="space-y-4">
      <div className={`bg-gray-50 p-3 rounded-lg ${level > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-start gap-2">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.author.name}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isCurrentUserAuthor && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(comment.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isCurrentUserAuthor && (
                    <DropdownMenuItem onClick={handleReport}>
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm mt-1">{comment.text}</p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => onLike(comment.id)}
                className={`text-sm flex items-center gap-1 ${
                  comment.isLiked ? "text-primary" : "text-gray-500"
                }`}
              >
                <ThumbsUp size={14} />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>
              {level < maxReplyLevel && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-sm flex items-center gap-1 text-gray-500"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-8">
          <CommentInput onSubmit={handleReply} placeholder="Write a reply..." />
        </div>
      )}

      {comment.replies?.map((reply) => (
        <CommentCard
          key={reply.id}
          comment={reply}
          onLike={onLike}
          onDelete={onDelete}
          onEdit={onEdit}
          onReply={onReply}
          onReport={onReport}
          currentUser={currentUser}
          level={level + 1}
        />
      ))}
    </div>
  );
}
