
export interface CreatePostInput {
  title: string;
  description: string;
  category: string;
  condition: string;
  item_type: 'offer' | 'request'; // Nytt: Piffa vs Önska
  pif_status?: 'active' | 'completed' | 'cancelled'; // Nytt: PIF-status
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  location: string;
  images: string[];
  measurements?: Record<string, string>;
}

export interface PostFormData {
  title: string;
  description: string;
  category: string;
  condition: string;
  item_type: 'offer' | 'request'; // Nytt
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  location: string;
  images: string[];
  measurements: Record<string, string>;
}

export interface Rating {
  id: string;
  rater_id: string;
  rated_user_id: string;
  item_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_item_id?: number;
  reported_user_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}
