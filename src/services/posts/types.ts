
import type { Post, CreatePostInput } from "@/types/post";

export interface InteractionCounts {
  likesCount: number;
  interestsCount: number;
  commentsCount: number;
}

export interface PostWithCounts extends Post {
  interactionCounts?: InteractionCounts;
}
