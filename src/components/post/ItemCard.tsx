
import type { ReactNode } from "react";
import { ItemCardContainer } from "./ItemCardContainer";
import type { ItemType } from "@/components/item/types";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

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
  item_type?: ItemType;
  onDeleted?: (operationType?: OperationType) => void;
}

export function ItemCard(props: ItemCardProps) {
  return <ItemCardContainer {...props} />;
}
