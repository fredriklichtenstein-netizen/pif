
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { formatRelativeTime } from "@/utils/formatDate";
import { Link } from "react-router-dom";

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
    e.currentTarget.style.display = 'none';
  };

  const inner = (
    <>
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={author.avatar}
          alt={author.name}
          className="rounded-full object-cover"
          onError={handleAvatarError}
        />
        <AvatarFallback>{authorInitials}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{author.name}</span>
    </>
  );

  return (
    <div className="flex items-center gap-2">
      {author.id ? (
        <Link to={`/user/${author.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-2">{inner}</div>
      )}
      <span className="text-sm text-gray-500">
        {formatRelativeTime(createdAt)}
      </span>
    </div>
  );
}
