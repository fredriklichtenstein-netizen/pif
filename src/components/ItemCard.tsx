import { Heart, MessageCircle, MapPin, ThumbsUp, Reply } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Comment {
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

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  category: string;
  condition?: string;
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
  condition,
  postedBy,
}: ItemCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [showInterest, setShowInterest] = useState(false);
  const { toast } = useToast();

  const handleShowInterest = () => {
    setShowInterest(!showInterest);
    toast({
      title: showInterest ? "Interest removed" : "Interest shown!",
      description: showInterest 
        ? "You will no longer receive updates about this item" 
        : "The owner will be notified of your interest",
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: {
        name: "Current User", // This will be replaced with actual user data
        avatar: "https://i.pravatar.cc/150?img=3",
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="space-x-2">
            <span className="text-sm font-medium text-secondary">{category}</span>
            {condition && (
              <span className="text-sm text-gray-500">• {condition}</span>
            )}
          </div>
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
            <button
              onClick={() => setShowComments(!showComments)}
              className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors"
            >
              <MessageCircle size={20} />
            </button>
            <Link
              to={`/messages/new/${postedBy.name}`}
              className="p-2 rounded-full text-gray-400 hover:text-primary transition-colors"
            >
              <MessageCircle size={20} />
            </Link>
            <Button
              variant={showInterest ? "default" : "outline"}
              size="sm"
              onClick={handleShowInterest}
              className="ml-2"
            >
              <ThumbsUp size={16} className="mr-2" />
              {showInterest ? "Interested" : "Show Interest"}
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[60px]"
              />
              <Button onClick={handleAddComment}>Post</Button>
            </div>
            
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.author.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`text-sm flex items-center gap-1 ${
                            comment.isLiked ? "text-primary" : "text-gray-500"
                          }`}
                        >
                          <ThumbsUp size={14} />
                          {comment.likes > 0 && <span>{comment.likes}</span>}
                        </button>
                        <button className="text-sm flex items-center gap-1 text-gray-500">
                          <Reply size={14} />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}