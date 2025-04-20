
export interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  isOwn: boolean;
  isPending?: boolean; // Add this flag to show comments that haven't been sent to server
}
