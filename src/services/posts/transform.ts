
import { parseCoordinatesFromDB } from "@/types/post";
import type { Post } from "@/types/post";
import type { InteractionCounts } from "./types";

export const transformPostData = (
  item: any,
  interactionCounts: InteractionCounts
): Post => {
  let parsedCoordinates = null;
  if (item.coordinates) {
    try {
      const coordsStr = String(item.coordinates);
      const coords = parseCoordinatesFromDB(coordsStr);
      if (coords) {
        parsedCoordinates = JSON.stringify(coords);
      }
    } catch (err) {
      console.error("Error parsing coordinates:", err, item.coordinates);
    }
  }

  return {
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    measurements: (typeof item.measurements === 'object' && item.measurements !== null) 
      ? item.measurements
      : {},
    images: item.images || [],
    location: item.location || '',
    coordinates: parsedCoordinates,
    postedBy: {
      id: item.user_id,
      name: item.profiles 
        ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || 'Unknown User'
        : 'Unknown User',
      avatar: item.profiles?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
    },
    createdAt: item.created_at || '',
    status: item.status || '',
    likesCount: interactionCounts.likesCount,
    interestsCount: interactionCounts.interestsCount,
    commentsCount: interactionCounts.commentsCount
  };
};
