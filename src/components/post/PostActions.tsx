
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import type { PostAction } from "@/types/comment";

interface PostActionsProps {
  actions: PostAction[];
}

export function PostActions({ actions }: PostActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      {actions.map((action, index) => {
        // If component is provided, use it
        if (action.component) {
          const Component = action.component;
          return (
            <Component
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className={`p-2 rounded-full transition-colors ${
                action.active ? "text-primary" : "text-gray-500 hover:text-primary"
              }`}
            >
              {action.icon}
            </Component>
          );
        }
        
        // If 'to' prop is provided, use Link, otherwise use Button
        return action.to ? (
          <Link
            key={index}
            to={action.to}
            className={`inline-flex items-center justify-center p-2 rounded-full transition-colors ${
              action.active ? "text-primary" : "text-gray-500 hover:text-primary"
            }`}
            onClick={action.onClick}
          >
            {action.icon}
          </Link>
        ) : (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={action.onClick}
            className={`p-2 rounded-full transition-colors ${
              action.active ? "text-primary" : "text-gray-500 hover:text-primary"
            }`}
          >
            {action.icon}
          </Button>
        );
      })}
    </div>
  );
}
