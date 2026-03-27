import { Comment } from "@/types/comment";
import i18n from "@/i18n";

export const getFallbackComments = (): Comment[] => [
  {
    id: "fallback-1",
    text: i18n.t('interactions:comments.welcome_message'),
    author: {
      name: "PiF Team",
      avatar: "https://ui-avatars.com/api/?name=PiF&background=random",
      id: "fallback-author-1"
    },
    likes: 5,
    isLiked: false,
    replies: [],
    createdAt: new Date(),
    isOwn: false
  }
];
