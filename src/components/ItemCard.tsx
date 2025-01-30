import { Heart, MessageCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  category: string;
  postedBy: {
    name: string;
    avatar: string;
  };
}

export function ItemCard({
  id,
  title,
  description,
  image,
  location,
  category,
  postedBy,
}: ItemCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary">{category}</span>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin size={14} className="mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <Link
            to={`/profile/${postedBy.name}`}
            className="flex items-center"
          >
            <img
              src={postedBy.avatar}
              alt={postedBy.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-600">{postedBy.name}</span>
          </Link>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <Link
              to={`/messages/new/${postedBy.name}`}
              className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors"
            >
              <MessageCircle size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}