
import { useState } from "react";
import type { Comment } from "@/types/comment";
import { CommentHeader } from "./CommentHeader";
import { CommentActions } from "./CommentActions";
import { CommentEditor } from "./CommentEditor";
import { CommentInteractions } from "./CommentInteractions";
import { CommentInput } from "./CommentInput";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  comment, onLike, onDelete, onEdit, onReply, onReport, currentUser = "", level = 0,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);
  const [showReplyInput, setShowReplyInput] = useState(false);
  // Two-level threading only: top-level comments and one level of replies.
  const maxReplyLevel = 1;
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const isCurrentUserAuthor = currentUser === comment.author.id;

  const handleSaveEdit = () => { onEdit(comment.id, editedText); setIsEditing(false); };

  const handleReply = (text: string) => {
    onReply(comment.id, text);
    setShowReplyInput(false);
  };

  // Toast is fired by ReportPostDialog after a successful submission —
  // do NOT toast here, otherwise it appears the moment the menu item is
  // clicked (before the dialog has even been submitted).
  const handleReport = () => {
    onReport(comment.id);
  };
  
  const authorName = comment.author.name || 'Anonymous';

  return (
    <div className="space-y-4" data-comment-id={comment.id}>
      <div className={`bg-gray-50 p-3 rounded-lg ${level > 0 ? 'ml-8' : ''}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <CommentHeader author={{ ...comment.author, name: authorName }} createdAt={new Date(comment.createdAt)} />
              <CommentActions isCurrentUserAuthor={isCurrentUserAuthor} onEdit={() => setIsEditing(true)} onDelete={() => onDelete(comment.id)} onReport={handleReport} />
            </div>
            
            {isEditing ? (
              <CommentEditor text={editedText} onTextChange={setEditedText} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />
            ) : (
              <p className="text-sm mt-1 text-left">{comment.text}</p>
            )}

            <CommentInteractions likes={comment.likes} isLiked={comment.isLiked} onLike={() => onLike(comment.id)} onReply={() => setShowReplyInput(!showReplyInput)} maxReplyLevel={maxReplyLevel} level={level} />
          </div>
        </div>
      </div>

      {showReplyInput && (
        <div className="ml-8">
          <CommentInput onSubmit={handleReply} placeholder={t('interactions.write_reply')} />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} onLike={onLike} onDelete={onDelete} onEdit={onEdit} onReply={onReply} onReport={onReport} currentUser={currentUser} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
