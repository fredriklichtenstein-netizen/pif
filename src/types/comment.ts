export interface Comment {
  id: string;
  text: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  createdAt: Date;
}

export interface PostAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline";
  active?: boolean;
}