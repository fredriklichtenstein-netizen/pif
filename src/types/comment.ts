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
  isEditing?: boolean;
  reactions?: {
    type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
    count: number;
  }[];
}

export interface PostAction {
  icon: React.ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "outline";
  active?: boolean;
  component?: any;
  to?: string;
}

export interface ReactionType {
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
  icon: React.ReactNode;
  label: string;
}