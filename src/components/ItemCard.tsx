import { useItemCard } from "@/hooks/useItemCard";
import { ItemHeader } from "./post/ItemHeader";
import { ItemImage } from "./post/ItemImage";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentSection } from "./post/CommentSection";

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
          <CommentSection
            comments={comments}
            setComments={setComments}
          />
        )}
      </div>
    </div>
  );
}