
export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  measurements: {
    [key: string]: string;
  };
  images: string[];
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  status: string;
}

export type CreatePostInput = Omit<Post, "id" | "postedBy" | "createdAt">;
