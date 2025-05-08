
import { Link } from "react-router-dom";

interface PosterInfoProps {
  postedBy: {
    id?: string;
    name: string;
    avatar?: string; // Make avatar optional to match our updated types
  };
}

export function PosterInfo({ postedBy }: PosterInfoProps) {
  return (
    <Link
      to={postedBy.id ? `/user/${postedBy.id}` : '#'}
      className="flex items-center"
    >
      <img
        src={postedBy.avatar || ''}
        alt={postedBy.name}
        className="w-6 h-6 rounded-full mr-2"
      />
      <span className="text-sm text-gray-600">{postedBy.name}</span>
    </Link>
  );
}
