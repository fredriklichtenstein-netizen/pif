
import React from 'react';
import { Heart, MessageSquare, Star } from 'lucide-react';

type IconType = "heart" | "message-square" | "star";

interface InteractionIconProps {
  type: IconType;
  isActive: boolean;
}

export function InteractionIcon({ type, isActive }: InteractionIconProps) {
  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";
  
  let IconComponent;
  switch (type) {
    case "heart":
      IconComponent = Heart;
      break;
    case "message-square":
      IconComponent = MessageSquare;
      break;
    case "star":
      IconComponent = Star;
      break;
    default:
      IconComponent = Heart;
  }

  return (
    <IconComponent 
      className="w-6 h-6 flex-shrink-0" 
      fill={isActive ? ACTIVE_COLOR : "none"} 
      stroke={isActive ? ACTIVE_COLOR : PASSIVE_COLOR} 
      strokeWidth={isActive ? 2.4 : 2} 
    />
  );
}
