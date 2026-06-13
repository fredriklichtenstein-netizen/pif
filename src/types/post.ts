
export interface CreatePostInput {
  title: string;
  description: string;
  category: string;
  condition: string;
  item_type: 'offer' | 'request';
  pif_status?: 'active' | 'completed' | 'cancelled' | 'archived';
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
  item_type: 'offer' | 'request';
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  location: string;
  images: string[];
  measurements: Record<string, string>;
  pickup_preference?: 'meetup' | 'leave_at_door' | 'flexible' | '';
  pickup_door_code?: string;
  pickup_floor?: string;
  pickup_instructions?: string;
  preferred_time_window?: string;
  pickup_address?: string;
  pickup_address_mode?: 'primary' | 'custom';
  primary_address?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  item_type?: 'offer' | 'request';
  pif_status?: 'active' | 'completed' | 'cancelled' | 'archived';
  measurements: Record<string, string>;
  images: string[];
  location: string;
  coordinates: { lat: number; lng: number } | null;
  postedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  status: string;
  archived_at?: string | null;
  archived_reason?: string | null;
  likesCount: number;
  interestsCount: number;
  commentsCount: number;
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

/**
 * Parse coordinates from PostGIS database format to lat/lng object
 */
export function parseCoordinatesFromDB(coordinates: string): { lat: number; lng: number } | null {
  if (!coordinates) return null;
  
  try {
    // Match both standard PostGIS format "(lng,lat)" and variations like "POINT(lng lat)"
    const simpleMatches = coordinates.match(/\(([-\d.]+),([-\d.]+)\)/);
    const pointMatches = coordinates.match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
    
    if (simpleMatches && simpleMatches.length >= 3) {
      return {
        lat: parseFloat(simpleMatches[2]),  // lat is the second value
        lng: parseFloat(simpleMatches[1]),  // lng is the first value
      };
    }
    
    if (pointMatches && pointMatches.length >= 3) {
      return {
        lng: parseFloat(pointMatches[1]),  // lng is the first value
        lat: parseFloat(pointMatches[2]),  // lat is the second value
      };
    }
    
    return null;
  } catch (err) {
    console.error("Error parsing coordinates:", err, coordinates);
    return null;
  }
}
