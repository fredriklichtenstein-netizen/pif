
import { Comment } from "@/types/comment";

export const FALLBACK_COMMENTS: Comment[] = [
  {
    id: "fallback-1",
    text: "Welcome to our circular economy community! Share items you no longer need, and find treasures others are sharing.",
    author: {
      name: "PiF Team",
      avatar: "https://ui-avatars.com/api/?name=PiF&background=random",
      id: "fallback-author-1"
    },
    likes: 5,
    isLiked: false,
    replies: [],
    createdAt: new Date(),
    isOwn: false
  }
];
