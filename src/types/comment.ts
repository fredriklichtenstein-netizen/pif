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
  isOwn?: boolean;
}

export interface PostAction {
  icon: React.ReactElement;
  label: string;
  labelText: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}
