
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { formatRelativeTime } from "@/utils/formatDate";

interface CommentHeaderProps {
  author: {
    name: string;
    avatar: string;
    id?: string;
  };
  createdAt: Date;
  authorInitials: string;
}

export function CommentHeader({ author, createdAt, authorInitials }: CommentHeaderProps) {
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("Avatar failed to load, using fallback");
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="flex items-center gap-2">
      <Avatar className="w-8 h-8">
        <AvatarImage 
          src={author.avatar} 
          alt={author.name}
          className="rounded-full object-cover"
          onError={handleAvatarError}
        />
        <AvatarFallback>{authorInitials}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="font-medium">{author.name}</span>
        <span className="text-sm text-gray-500">
          {formatRelativeTime(createdAt)}
        </span>
      </div>
    </div>
  );
}
