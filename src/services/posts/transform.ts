
import { parseCoordinatesFromDB } from "@/types/post";
import type { Post } from "@/types/post";
import type { InteractionCounts } from "./types";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { extractCoordinates } from "@/utils/coordinates/coordinateExtractor";

export const transformPostData = (
  item: any,
  interactionCounts: InteractionCounts
): Post => {
  console.log("Transform - Raw item coordinates:", item.coordinates, "Type:", typeof item.coordinates);
  
  let parsedCoordinates = null;
  if (item.coordinates) {
    try {
      // First try the robust coordinate extractor
      parsedCoordinates = extractCoordinates(item.coordinates);
      
      // Fallback to string parsing if needed
      if (!parsedCoordinates) {
        const coordsStr = String(item.coordinates);
        parsedCoordinates = parseCoordinatesFromDB(coordsStr);
      }
      
      console.log("Transform - Final parsed coordinates:", parsedCoordinates);
    } catch (err) {
      console.error("Error parsing coordinates:", err, item.coordinates);
    }
  } else {
    console.log("Transform - No coordinates for item:", item.id);
  }
  
  // Process measurements to ensure they are correctly formatted
  const measurements = (typeof item.measurements === 'object' && item.measurements !== null) 
    ? item.measurements
    : {};

  const extractedUser = extractUserFromProfile(item.profiles, item.user_id);
  
  return {
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    item_type: item.item_type || 'offer',
    measurements: measurements,
    images: item.images || [],
    location: item.location || '',
    coordinates: parsedCoordinates,
    postedBy: {
      ...extractedUser,
      avatar: extractedUser.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
    },
    createdAt: item.created_at || '',
    status: item.status || '',
    likesCount: interactionCounts.likesCount,
    interestsCount: interactionCounts.interestsCount,
    commentsCount: interactionCounts.commentsCount
  };
};
