
export interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    avatar: string;
    id?: string;
  };
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  createdAt: Date;
}
