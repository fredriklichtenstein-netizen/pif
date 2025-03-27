
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
  isOwn?: boolean; // Added this property
}

export interface PostAction {
  icon: React.ReactNode;
  label?: string;
  onClick?: (e: React.MouseEvent) => void;
  to?: string;
  active?: boolean;
  component?: React.ComponentType<any>;
}
