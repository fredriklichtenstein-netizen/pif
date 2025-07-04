
import { parseCoordinatesFromDB } from "@/types/post";
import type { Post } from "@/types/post";
import type { InteractionCounts } from "./types";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";

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
  
  // Process measurements to ensure they are correctly formatted
  const measurements = (typeof item.measurements === 'object' && item.measurements !== null) 
    ? item.measurements
    : {};

  return {
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    measurements: measurements,
    images: item.images || [],
    location: item.location || '',
    coordinates: parsedCoordinates,
    postedBy: {
      ...extractUserFromProfile(item.profiles, item.user_id),
      avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
    },
    createdAt: item.created_at || '',
    status: item.status || '',
    likesCount: interactionCounts.likesCount,
    interestsCount: interactionCounts.interestsCount,
    commentsCount: interactionCounts.commentsCount
  };
};
