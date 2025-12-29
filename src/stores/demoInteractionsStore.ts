
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

export const useDemoInteractionsStore = create<DemoInteractionsState>()(
  persist(
    (set, get) => ({
      likedItems: [],
      bookmarkedItems: [],
      interestedItems: [],
      comments: {},

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
        const stored = get().comments[itemId] || [];
        return stored.map(dc => toComment(dc, "demo-user-id"));
      },
    }),
    {
      name: "pif-demo-interactions",
    }
  )
);
