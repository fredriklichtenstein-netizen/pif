import { Button } from "../ui/button";
import { Heart, Bookmark, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import type { PostAction, ReactionType } from "@/types/comment";

interface PostActionsProps {
  actions: PostAction[];
  onReact?: (type: string) => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const reactions: ReactionType[] = [
  { type: "like", icon: "👍", label: "Like" },
  { type: "love", icon: "❤️", label: "Love" },
  { type: "haha", icon: "😄", label: "Haha" },
  { type: "wow", icon: "😮", label: "Wow" },
  { type: "sad", icon: "😢", label: "Sad" },
  { type: "angry", icon: "😠", label: "Angry" },
];

const shareOptions = [
  { platform: "Facebook", icon: "facebook", url: "https://www.facebook.com/sharer/sharer.php?u=" },
  { platform: "Twitter", icon: "twitter", url: "https://twitter.com/intent/tweet?url=" },
  { platform: "WhatsApp", icon: "whatsapp", url: "https://wa.me/?text=" },
];

export function PostActions({ actions, onReact, onBookmark, isBookmarked }: PostActionsProps) {
  const handleShare = (platform: string, url: string) => {
    const shareUrl = `${url}${window.location.href}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="flex items-center space-x-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || "ghost"}
          size="sm"
          onClick={action.onClick}
          className={`p-2 rounded-full transition-colors ${
            action.active ? "text-primary" : "text-gray-400 hover:text-primary"
          }`}
        >
          {action.icon}
        </Button>
      ))}

      {onReact && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2 rounded-full">
              <Heart className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="flex p-2 gap-2">
              {reactions.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => onReact(reaction.type)}
                  className="hover:scale-125 transition-transform"
                  title={reaction.label}
                >
                  {reaction.icon}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onBookmark && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          className={`p-2 rounded-full ${isBookmarked ? "text-primary" : "text-gray-400"}`}
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2 rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {shareOptions.map((option) => (
            <DropdownMenuItem
              key={option.platform}
              onClick={() => handleShare(option.platform, option.url)}
            >
              Share on {option.platform}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}