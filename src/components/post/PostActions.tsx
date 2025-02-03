import { Button } from "../ui/button";
import type { PostAction } from "@/types/comment";

interface PostActionsProps {
  actions: PostAction[];
}

export function PostActions({ actions }: PostActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => {
        const Component = action.component || Button;
        return (
          <Component
            key={index}
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => action.onClick(e)}
            to={action.to}
            className={`p-2 rounded-full transition-colors ${
              action.active ? "text-primary" : "text-gray-500 hover:text-primary"
            }`}
          >
            {action.icon}
          </Component>
        );
      })}
    </div>
  );
}