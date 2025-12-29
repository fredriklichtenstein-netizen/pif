
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Comment } from "@/types/comment";

interface DemoComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface DemoInteractionsState {
  likedItems: string[];
  bookmarkedItems: string[];
  interestedItems: string[];
  comments: Record<string, DemoComment[]>;
  
  // Actions
  toggleLike: (itemId: string) => boolean;
  toggleBookmark: (itemId: string) => boolean;
  toggleInterest: (itemId: string) => boolean;
  addComment: (itemId: string, text: string, author: { id: string; name: string; avatar: string }) => Comment;
  deleteComment: (itemId: string, commentId: string) => void;
  toggleCommentLike: (itemId: string, commentId: string) => void;
  
  // Getters
  isLiked: (itemId: string) => boolean;
  isBookmarked: (itemId: string) => boolean;
  isInterested: (itemId: string) => boolean;
  getComments: (itemId: string) => Comment[];
}

// Helper to convert stored comment to Comment type
const toComment = (dc: DemoComment, currentUserId: string): Comment => ({
  id: dc.id,
  text: dc.text,
  author: {
    id: dc.authorId,
    name: dc.authorName,
    avatar: dc.authorAvatar,
  },
  createdAt: new Date(dc.createdAt),
  likes: dc.likes,
  isLiked: dc.isLiked,
  replies: [],
  isOwn: dc.authorId === currentUserId,
});

// Pre-populated demo comments for mock posts
const INITIAL_DEMO_COMMENTS: Record<string, DemoComment[]> = {
  "mock-1": [
    {
      id: "demo-comment-1",
      text: "This bookshelf is beautiful! Is it still available?",
      authorId: "mock-user-2",
      authorName: "Erik L.",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      likes: 2,
      isLiked: false,
    },
    {
      id: "demo-comment-2",
      text: "Love the vintage look! Would fit perfectly in my home office 📚",
      authorId: "mock-user-3",
      authorName: "Maria K.",
      authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      likes: 1,
      isLiked: false,
    },
  ],
  "mock-3": [
    {
      id: "demo-comment-3",
      text: "My daughter would love these! Are the puzzles complete with all pieces?",
      authorId: "mock-user-5",
      authorName: "Lisa A.",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likes: 0,
      isLiked: false,
    },
  ],
  "mock-5": [
    {
      id: "demo-comment-4",
      text: "What a gorgeous chair! The green velvet looks amazing. Can you share the dimensions?",
      authorId: "mock-user-6",
      authorName: "Oscar M.",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      likes: 3,
      isLiked: false,
    },
    {
      id: "demo-comment-5",
      text: "This is exactly what I've been looking for!",
      authorId: "mock-user-1",
      authorName: "Anna S.",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      likes: 1,
      isLiked: false,
    },
  ],
};

export const useDemoInteractionsStore = create<DemoInteractionsState>()(
  persist(
    (set, get) => ({
      likedItems: [],
      bookmarkedItems: [],
      interestedItems: [],
      comments: INITIAL_DEMO_COMMENTS,

      toggleLike: (itemId: string) => {
        const current = get().likedItems;
        const isCurrentlyLiked = current.includes(itemId);
        set({
          likedItems: isCurrentlyLiked
            ? current.filter(id => id !== itemId)
            : [...current, itemId]
        });
        return !isCurrentlyLiked;
      },

      toggleBookmark: (itemId: string) => {
        const current = get().bookmarkedItems;
        const isCurrentlyBookmarked = current.includes(itemId);
        set({
          bookmarkedItems: isCurrentlyBookmarked
            ? current.filter(id => id !== itemId)
            : [...current, itemId]
        });
        return !isCurrentlyBookmarked;
      },

      toggleInterest: (itemId: string) => {
        const current = get().interestedItems;
        const isCurrentlyInterested = current.includes(itemId);
        set({
          interestedItems: isCurrentlyInterested
            ? current.filter(id => id !== itemId)
            : [...current, itemId]
        });
        return !isCurrentlyInterested;
      },

      addComment: (itemId: string, text: string, author: { id: string; name: string; avatar: string }) => {
        const current = get().comments;
        const newDemoComment: DemoComment = {
          id: `demo-comment-${Date.now()}`,
          text,
          authorId: author.id,
          authorName: author.name,
          authorAvatar: author.avatar,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
        };
        set({
          comments: {
            ...current,
            [itemId]: [...(current[itemId] || []), newDemoComment]
          }
        });
        return toComment(newDemoComment, author.id);
      },

      deleteComment: (itemId: string, commentId: string) => {
        const current = get().comments;
        set({
          comments: {
            ...current,
            [itemId]: (current[itemId] || []).filter(c => c.id !== commentId)
          }
        });
      },

      toggleCommentLike: (itemId: string, commentId: string) => {
        const current = get().comments;
        const itemComments = current[itemId] || [];
        set({
          comments: {
            ...current,
            [itemId]: itemComments.map(c => 
              c.id === commentId 
                ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
                : c
            )
          }
        });
      },

      isLiked: (itemId: string) => get().likedItems.includes(itemId),
      isBookmarked: (itemId: string) => get().bookmarkedItems.includes(itemId),
      isInterested: (itemId: string) => get().interestedItems.includes(itemId),
      getComments: (itemId: string) => {
        const stored = get().comments[itemId] || INITIAL_DEMO_COMMENTS[itemId] || [];
        return stored.map(dc => toComment(dc, "demo-user-id"));
      },
    }),
    {
      name: "pif-demo-interactions",
    }
  )
);
