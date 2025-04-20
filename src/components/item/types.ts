
import { type Comment } from "@/types/comment";

export interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  images?: string[];
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
}

export interface ItemCardHeaderProps {
  postedBy: ItemCardProps['postedBy'];
  isOwner: boolean;
  isBookmarked: boolean;
  handleBookmark: () => void;
  handleShare: () => void;
  handleReport: () => void;
}

export interface ItemCardGalleryProps {
  images: string[];
  title: string;
  category: string;
}

export interface ItemCardContentProps {
  title?: string;
  description: string;
  measurements?: Record<string, string>;
}

export interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner: boolean;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: any[];
  interestedUsers?: any[];
  commenters?: any[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  interactionsLoading?: boolean;
  isLoadingInterested?: boolean;
  interestedError?: Error | null;
  getInterestedUsers?: () => void;
  isRealtimeSubscribed?: boolean;
}
