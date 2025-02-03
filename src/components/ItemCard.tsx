import { useItemCard } from "@/hooks/useItemCard";
import { ItemHeader } from "./post/ItemHeader";
import { ItemImage } from "./post/ItemImage";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentManager } from "./comments/CommentManager";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  category: string;
  condition?: string;
  postedBy: {
    name: string;
    avatar: string;
  };
}

export function ItemCard({
  id,
  title,
  description,
  image,
  location,
  category,
  condition,
  postedBy,
}: ItemCardProps) {
  const {
    isLiked,
    showComments,
    comments,
    showInterest,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  } = useItemCard(id);

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <ItemImage image={image} title={title} />
      <div className="p-4">
        <ItemHeader
          category={category}
          condition={condition}
          location={location}
          title={title}
          description={description}
          postedBy={postedBy}
        />
        <div className="mt-4">
          <ItemInteractions
            id={id}
            postedBy={postedBy}
            isLiked={isLiked}
            showComments={showComments}
            isBookmarked={isBookmarked}
            showInterest={showInterest}
            onLikeToggle={handleLike}
            onCommentToggle={handleCommentToggle}
            onShowInterest={handleShowInterest}
            onBookmarkToggle={handleBookmark}
            onMessage={handleMessage}
            onShare={handleShare}
            onReport={handleReport}
          />
        </div>
        {showComments && (
          <CommentManager
            comments={comments}
            onAddComment={handleAddComment}
            onLikeComment={handleLikeComment}
            onDeleteComment={handleDeleteComment}
            onEditComment={handleEditComment}
            onReplyToComment={handleReplyToComment}
            onReportComment={handleReportComment}
          />
        )}
      </div>
    </div>
  );
}