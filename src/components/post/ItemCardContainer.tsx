
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ItemImage } from "./ItemImage";
import { ItemCardBody } from "./card/ItemCardBody";
import { ItemCardFooter } from "./card/ItemCardFooter";
import { useItemCardContainer } from "./card/useItemCardContainer";
import type { ItemType } from "@/components/item/types";


interface ItemCardProps {
  id: number;
  title: string;
  description: string;
  image: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  markAsPiffedAction?: () => void;
  awaitingConfirmationSlot?: ReactNode;
  images?: string[];
  item_type?: ItemType;
}


export function ItemCardContainer({
  id,
  title,
  description,
  image,
  images = [],
  location,
  coordinates,
  category,
  condition,
  measurements,
  postedBy,
  markAsPiffedAction,
  awaitingConfirmationSlot,
  item_type,

}: ItemCardProps) {
  const { session } = useAuth();
  const isOwner = session?.user?.id === postedBy.id;

  const {
    isDeleting,
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    showInterest,
    interestsCount,
    likers,
    interestedUsers,
    handleDelete,
    handleEdit,
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    setComments,
  } = useItemCardContainer({ id, postedBy });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <ItemImage image={image} title={title} />

      <ItemCardBody
        category={category}
        condition={condition}
        location={location}
        coordinates={coordinates}
        title={title}
        description={description}
        measurements={measurements}
        postedBy={postedBy}
        isOwner={isOwner}
        isDeleting={isDeleting}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        markAsPiffedAction={markAsPiffedAction}
        awaitingConfirmationSlot={awaitingConfirmationSlot}
      />

      <ItemCardFooter
        id={id.toString()}
        isLiked={isLiked}
        showInterest={showInterest}
        isOwner={isOwner}
        showComments={showComments}
        commentsCount={commentsCount}
        likesCount={likesCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        comments={comments}
        setComments={setComments}
        onLikeToggle={handleLike}
        onCommentToggle={handleCommentToggle}
        onShowInterest={handleShowInterest}
      />
    </div>
  );
}


