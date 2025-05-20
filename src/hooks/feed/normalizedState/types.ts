
import { FeedItem } from "@/context/feed/types";

export type FeedItemsMap = Record<string | number, FeedItem>;

export interface NormalizedFeedState {
  byId: FeedItemsMap;
  allIds: (string | number)[];
}

export interface NormalizedStateHook {
  items: FeedItem[];
  setItems: (newItems: FeedItem[]) => void;
  updateItem: (id: string | number, changes: Partial<FeedItem>) => void;
  deleteItem: (id: string | number) => void;
  archiveItem: (id: string | number, reason?: string) => void;
  restoreItem: (id: string | number) => void;
}
