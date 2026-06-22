
import type { ReactNode } from "react";
import { ItemCardContainer } from "./ItemCardContainer";

interface ItemCardProps {
  id: number;
  title: string;
  description: string;
  image: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  markAsPiffedAction?: () => void;
  awaitingConfirmationSlot?: ReactNode;
  images?: string[];
}

// This component is now just a simple wrapper around ItemCardContainer
// to maintain backward compatibility
export function ItemCard(props: ItemCardProps) {
  return <ItemCardContainer {...props} />;
}
