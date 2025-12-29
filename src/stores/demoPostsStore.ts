
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PostFormData } from "@/types/post";

interface DemoPost {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: string;
  coordinates: { lng: number; lat: number };
  category: string;
  condition: string | null;
  item_type: "offer" | "request";
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  created_at: string;
  __isMock: boolean;
  __isUserCreated: boolean;
}

interface DemoPostsState {
  userPosts: DemoPost[];
  
  // Actions
  addPost: (formData: PostFormData, user: { id: string; name: string; avatar: string }) => DemoPost;
  updatePost: (postId: string, formData: Partial<PostFormData>) => void;
  deletePost: (postId: string) => void;
  
  // Getters
  getUserPosts: (userId: string) => DemoPost[];
  getAllUserPosts: () => DemoPost[];
}

export const useDemoPostsStore = create<DemoPostsState>()(
  persist(
    (set, get) => ({
      userPosts: [],

      addPost: (formData: PostFormData, user: { id: string; name: string; avatar: string }) => {
        const newPost: DemoPost = {
          id: `demo-user-post-${Date.now()}`,
          title: formData.title,
          description: formData.description || "",
          images: formData.images,
          location: formData.location || "Stockholm",
          coordinates: formData.coordinates || { lng: 18.0686, lat: 59.3293 },
          category: formData.category,
          condition: formData.condition || null,
          item_type: formData.item_type === "request" ? "request" : "offer",
          postedBy: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
          },
          created_at: new Date().toISOString(),
          __isMock: true,
          __isUserCreated: true,
        };
        
        set((state) => ({
          userPosts: [newPost, ...state.userPosts]
        }));
        
        return newPost;
      },

      updatePost: (postId: string, formData: Partial<PostFormData>) => {
        set((state) => ({
          userPosts: state.userPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  ...(formData.title && { title: formData.title }),
                  ...(formData.description !== undefined && { description: formData.description }),
                  ...(formData.images && { images: formData.images }),
                  ...(formData.location && { location: formData.location }),
                  ...(formData.coordinates && { coordinates: formData.coordinates }),
                  ...(formData.category && { category: formData.category }),
                  ...(formData.condition !== undefined && { condition: formData.condition }),
                  ...(formData.item_type && { item_type: formData.item_type === "request" ? "request" : "offer" as const }),
                }
              : post
          )
        }));
      },

      deletePost: (postId: string) => {
        set((state) => ({
          userPosts: state.userPosts.filter((post) => post.id !== postId)
        }));
      },

      getUserPosts: (userId: string) => {
        return get().userPosts.filter((post) => post.postedBy.id === userId);
      },

      getAllUserPosts: () => {
        return get().userPosts;
      },
    }),
    {
      name: "pif-demo-posts",
    }
  )
);
