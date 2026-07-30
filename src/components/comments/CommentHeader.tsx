
import { AvatarImage } from "@/components/ui/optimized-image";
import { formatRelativeTime } from "@/utils/formatDate";
import { Link } from "react-router-dom";

interface CommentHeaderProps {
  author: {
    name: string;
    avatar?: string;
    id?: string;
  };
  createdAt: Date;
}

export function CommentHeader({ author, createdAt }: CommentHeaderProps) {
  const inner = (
    <>
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <AvatarImage
          src={author.avatar}
          alt={author.name}
          size={32}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="font-medium truncate">{author.name}</span>
    </>
  );

  return (
    <div className="flex items-center gap-2 min-w-0">
      {author.id ? (
        <Link to={`/feed?user=${author.id}`} className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity">
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-2 min-w-0 flex-1">{inner}</div>
      )}
      <span className="text-sm text-gray-500 flex-shrink-0">
        {formatRelativeTime(createdAt)}
      </span>
    </div>
  );
}
