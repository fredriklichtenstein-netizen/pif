
import { ReactNode } from 'react';

export interface ItemCardProps {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category?: string;
  condition?: string;
  measurements?: Record<string, string>;
  postedBy: {
    id?: string;
    name: string;
    avatar?: string;
  };
  images?: string[];
  archived_at?: string | null;
  onOperationSuccess?: () => void;
}

export interface ItemActionProps {
  id: string | number;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface ItemContentProps {
  title: string;
  description?: string;
  condition?: string;
  measurements?: Record<string, string>;
  children?: ReactNode;
}
