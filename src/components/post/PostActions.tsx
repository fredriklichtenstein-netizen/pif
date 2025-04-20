
import React from "react";
import type { PostAction } from "@/types/comment";

interface PostActionsProps {
  actions: PostAction[];
}

export function PostActions({ actions }: PostActionsProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`
            flex flex-col items-center justify-center p-2 space-y-1 flex-1
            ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
            ${action.active ? 'text-primary' : 'text-gray-600'}
          `}
        >
          {React.cloneElement(action.icon, {
            className: `h-5 w-5 mb-1 ${action.active ? 'fill-current' : ''}`
          })}
          <span className="text-xs font-medium">{action.labelText}</span>
        </button>
      ))}
    </div>
  );
}
