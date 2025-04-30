
export type Post = {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string;
  coordinates: string | null;
  category: string;
  condition: string;
  measurements: Record<string, any>;
  user_id: string;
  user_name: string;
  user_avatar: string;
};

export interface FeedPostsResult {
  posts: Post[];
  allPosts: Post[];
  isLoading: boolean;
  error: Error | null;
  refreshPosts: () => Promise<void>;
  filterByCategories: (categories: string[]) => void;
  loadSavedPosts: () => Promise<void>;
  loadMyPosts: () => Promise<void>;
  loadInterestedPosts: () => Promise<void>;
}
