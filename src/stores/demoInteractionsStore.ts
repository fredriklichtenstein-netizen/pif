
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DemoInteractionsState {
  likedItems: string[];
  bookmarkedItems: string[];
  interestedItems: string[];
  comments: Record<string, { id: string; text: string; userId: string; createdAt: string }[]>;
  
  // Actions
  toggleLike: (itemId: string) => boolean;
  toggleBookmark: (itemId: string) => boolean;
  toggleInterest: (itemId: string) => boolean;
  addComment: (itemId: string, text: string) => void;
  
  // Getters
  isLiked: (itemId: string) => boolean;
  isBookmarked: (itemId: string) => boolean;
  isInterested: (itemId: string) => boolean;
  getComments: (itemId: string) => { id: string; text: string; userId: string; createdAt: string }[];
}

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

      addComment: (itemId: string, text: string) => {
        const current = get().comments;
        const newComment = {
          id: `demo-comment-${Date.now()}`,
          text,
          userId: "demo-user-id",
          createdAt: new Date().toISOString()
        };
        set({
          comments: {
            ...current,
            [itemId]: [...(current[itemId] || []), newComment]
          }
        });
      },

      isLiked: (itemId: string) => get().likedItems.includes(itemId),
      isBookmarked: (itemId: string) => get().bookmarkedItems.includes(itemId),
      isInterested: (itemId: string) => get().interestedItems.includes(itemId),
      getComments: (itemId: string) => get().comments[itemId] || [],
    }),
    {
      name: "pif-demo-interactions",
    }
  )
);
