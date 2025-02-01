import { Button } from "../ui/button";
import type { PostAction } from "@/types/comment";

interface PostActionsProps {
  actions: PostAction[];
}

export function PostActions({ actions }: PostActionsProps) {
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
    </div>
  );
}