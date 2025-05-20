
import { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export interface FeedItem {
  id: string | number;
  title: string;
  description?: string;
  images?: string[];
  location?: string;
  coordinates?: any;
  category?: string;
  condition?: string;
  measurements?: Record<string, any>; // Changed from Record<string, string> to Record<string, any>
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  archived_at?: string | null;
  archived_reason?: string | null;
  status?: string;
  // UI state properties
  __deleted?: boolean;
  __archived?: boolean;
  __restored?: boolean;
  __modified?: boolean;
  __transitionState?: 'removing' | 'archiving' | 'restoring' | 'normal';
}

export type FeedAction = 
  | { type: 'SET_ITEMS'; payload: FeedItem[] }
  | { type: 'UPDATE_ITEM'; payload: { id: string | number; changes: Partial<FeedItem> } }
  | { type: 'DELETE_ITEM'; payload: { id: string | number } }
  | { type: 'ARCHIVE_ITEM'; payload: { id: string | number; reason?: string } }
  | { type: 'RESTORE_ITEM'; payload: { id: string | number } }
  | { type: 'SET_TRANSITION'; payload: { id: string | number; state: 'removing' | 'archiving' | 'restoring' | 'normal' } }
  | { type: 'SYNC_FROM_SERVER'; payload: FeedItem[] };

export interface FeedContextValue {
  items: FeedItem[];
  updateItem: (id: string | number, changes: Partial<FeedItem>) => void;
  deleteItem: (id: string | number) => void;
  archiveItem: (id: string | number, reason?: string) => void;
  restoreItem: (id: string | number) => void;
  syncFromServer: (serverItems: FeedItem[]) => void;
  setItems: (items: FeedItem[]) => void;
}
