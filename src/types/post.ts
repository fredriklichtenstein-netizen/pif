
export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  measurements: {
    [key: string]: string;
  };
  images: string[];
  location: string;
  coordinates: string | null;
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  status: string;
  likesCount?: number;
  interestsCount?: number;
  commentsCount?: number;
}

export type CreatePostInput = Omit<Post, "id" | "postedBy" | "createdAt" | "likesCount" | "interestsCount" | "commentsCount"> & {
  user_id?: string;
};

export interface Coordinates {
  lat: number;
  lng: number;
}

export const formatCoordinatesForDB = (coords: Coordinates | undefined): string | null => {
  if (!coords) return null;
  return `(${coords.lng},${coords.lat})`;
};

export const parseCoordinatesFromDB = (point: string | null): Coordinates | undefined => {
  // Early return if point is null
  if (!point) return undefined;
  
  // Handle different potential formats
  try {
    // If it's already a parsed object
    if (typeof point === 'object' && point !== null) {
      if ('lat' in point && 'lng' in point) {
        return {
          // Use type assertion after null check
          lat: Number((point as any).lat),
          lng: Number((point as any).lng)
        };
      }
    }
    
    // At this point, we know point is a non-null string if not an object
    if (typeof point === 'string') {
      // Handle the string format: (lng,lat)
      const matches = point.match(/\(([-\d.]+),([-\d.]+)\)/);
      if (matches && matches.length >= 3) {
        return {
          lng: parseFloat(matches[1]),
          lat: parseFloat(matches[2])
        };
      }
      
      // Try to parse as JSON if it's a stringified object
      try {
        const parsed = JSON.parse(point);
        if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lng' in parsed) {
          return {
            lat: Number(parsed.lat),
            lng: Number(parsed.lng)
          };
        }
      } catch (e) {
        // Not a valid JSON string, ignore this error
        console.log("Not a valid JSON string:", point);
      }
    }
  } catch (e) {
    console.error("Error parsing coordinates:", e, point);
  }
  
  return undefined;
};
