
import React from 'react';
import { Heart, MessageSquare, Star, Sparkles } from 'lucide-react';

type IconType = "heart" | "message-square" | "star" | "sparkles";

interface InteractionIconProps {
  type: IconType;
  isActive: boolean;
}

export function InteractionIcon({ type, isActive }: InteractionIconProps) {
  const ACTIVE_COLOR = "#00D1A0";
  const PASSIVE_COLOR = "#333333";
  const isWishGrant = type === "sparkles";
  // Wishes use the project's amber accent so the "Grant wish" affordance
  // visually matches the wish/star colour family used elsewhere.
  const activeColor = isWishGrant ? "#F59E0B" : ACTIVE_COLOR;

  let IconComponent;
  switch (type) {
    case "heart":
      IconComponent = Heart;
      break;
    case "message-square":
      IconComponent = MessageSquare;
      break;
    case "sparkles":
      IconComponent = Sparkles;
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
      fill={isActive && !isWishGrant ? activeColor : "none"}
      stroke={isActive ? activeColor : PASSIVE_COLOR}
      strokeWidth={isActive ? 2.4 : 2}
    />
  );
}
