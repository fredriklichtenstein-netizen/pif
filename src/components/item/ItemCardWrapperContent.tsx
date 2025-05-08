
import { ItemCardContent } from "./content/ItemCardContent";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardActions } from "./ItemCardActions";
import { ItemCardLayout } from "./layout/ItemCardLayout";
import { ItemArchivedBanner } from "./status/ItemArchivedBanner";

export function ItemCardWrapperContent({
  id,
  title,
  description,
  image,
  images = [],
  location,
  category,
  condition,
  measurements,
  postedBy,
  isOwner,
  isItemArchived,
  archived_reason,
  realtimeError,
  handleRefresh,
  parsedCoordinates,
  handleReportClick,
  handleEdit,
  handleDeleteClick,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  commentsCount,
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  commenters,
  comments,
  commentsLoading,
  commentsError,
  interactionsLoading,
  isLoadingInterested,
  interestedError,
  handleLike,
  handleCommentToggle,
  handleShowInterest,
  handleBookmark,
  handleMessage,
  handleShare,
  handleReport,
  getInterestedUsers,
  setComments,
  isRealtimeSubscribed
}) {
  const numericItemId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  return (
    <ItemCardLayout
      id={id}
      isRealtimeError={!!realtimeError}
      refreshItemData={handleRefresh}
      statusBanner={isItemArchived ? <ItemArchivedBanner reason={archived_reason} /> : undefined}
      header={
        <ItemCardHeader 
          postedBy={postedBy} 
          isOwner={isOwner} 
          handleReport={handleReportClick} 
          coordinates={parsedCoordinates} 
          itemId={numericItemId}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      }
      gallery={
        <ItemCardGallery 
          images={images.length > 0 ? images : image ? [image] : []} 
          title={title} 
          category={category} 
        />
      }
      actions={
        <ItemCardActions 
          id={id} 
          postedBy={postedBy} 
          isOwner={isOwner} 
          isLiked={isLiked} 
          showComments={showComments} 
          isBookmarked={isBookmarked} 
          showInterest={showInterest} 
          commentsCount={commentsCount} 
          likesCount={likesCount} 
          interestsCount={interestsCount} 
          likers={likers} 
          interestedUsers={interestedUsers} 
          commenters={commenters} 
          comments={comments} 
          commentsLoading={commentsLoading} 
          commentsError={commentsError} 
          interactionsLoading={interactionsLoading} 
          isLoadingInterested={isLoadingInterested} 
          interestedError={interestedError} 
          onLikeToggle={handleLike} 
          onCommentToggle={handleCommentToggle} 
          onShowInterest={handleShowInterest} 
          onBookmarkToggle={handleBookmark} 
          onMessage={handleMessage} 
          onShare={handleShare} 
          onReport={handleReport} 
          onEdit={handleEdit} 
          onDelete={handleDeleteClick} 
          getInterestedUsers={getInterestedUsers} 
          setComments={setComments} 
          isRealtimeSubscribed={isRealtimeSubscribed} 
        />
      }
      content={
        <ItemCardContent 
          description={description} 
          condition={condition} 
          measurements={measurements} 
        />
      }
    />
  );
}
