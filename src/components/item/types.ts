
import { ReactNode } from 'react';

export interface ItemCardProps {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category?: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id?: string;
    name: string;
    avatar?: string;
  };
  images?: string[];
  archived_at?: string | null;
  onOperationSuccess?: () => void;
}

export interface ItemActionProps {
  id: string | number;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface ItemContentProps {
  title: string;
  description?: string;
  condition?: string;
  measurements?: Record<string, string>;
  children?: ReactNode;
}

export interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
    avatar?: string;  // Make avatar optional here to match the ItemCardProps
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
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
