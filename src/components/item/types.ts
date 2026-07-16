
import type { ImageCrop } from "@/types/post";

export type ItemType = 'offer' | 'request';

export interface ItemCardProps {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  images?: string[];
  /** Per-image preview-frame metadata, parallel to `images`. See ImageCrop. */
  imageCrops?: (ImageCrop | null)[];
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category?: string;
  condition?: string;
  item_type?: ItemType;
  measurements?: Record<string, string>;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  archived_at?: string;
  archived_reason?: string;
  onOperationSuccess?: () => void;
  /** Server-provided counts to seed UI before per-card hooks load. */
  likesCount?: number;
  commentsCount?: number;
  interestsCount?: number;
  /** When true, applies a subtle background tint if the current user owns the post. Feed-only. */
  showOwnerTint?: boolean;
}

export interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
    avatar?: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
  /** Used to flip "Interest" → "Grant wish" UX on requests. */
  itemType?: ItemType;
  /** Wish title — surfaced inside the Grant Wish dialog as context. */
  itemTitle?: string;
  commentsCount?: number;
  /** Eagerly-known "has the current user commented" signal — preferred over deriving from `commenters`. */
  hasCommented?: boolean;
  likesCount?: number;
  interestsCount?: number;
  likers?: any[];
  interestedUsers?: any[];
  commenters?: any[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: (note?: string) => void;
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
