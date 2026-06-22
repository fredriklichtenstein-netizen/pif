
import { parseCoordinatesFromDB } from "@/types/post";
import type { Post } from "@/types/post";
import type { InteractionCounts } from "./types";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { extractCoordinates } from "@/utils/coordinates/coordinateExtractor";

export const transformPostData = (
  item: any,
  interactionCounts: InteractionCounts
): Post => {
  let parsedCoordinates = null;
  // Prefer the new jsonb {lng,lat} column. Fall back to the legacy `coordinates`
  // jsonb-string column for any row not yet migrated by the writer.
  const coordSource = item.coordinates_json ?? item.coordinates;
  if (coordSource) {
    try {
      // First try the robust coordinate extractor (handles {lng,lat} objects)
      parsedCoordinates = extractCoordinates(coordSource);

      // Fallback to string parsing if needed (legacy "(lng,lat)" text)
      if (!parsedCoordinates) {
        const coordsStr = String(coordSource);
        parsedCoordinates = parseCoordinatesFromDB(coordsStr);
      }
    } catch (err) {
      console.error("Error parsing coordinates:", err, coordSource);
    }
  }
  
  
  // Process measurements to ensure they are correctly formatted
  const measurements = (typeof item.measurements === 'object' && item.measurements !== null) 
    ? item.measurements
    : {};

  const extractedUser = extractUserFromProfile(item.profiles, item.user_id);

  // Normalize legacy item_type values ('wish' -> 'request', 'pif' -> 'offer')
  const rawType = String(item.item_type || 'offer').toLowerCase();
  const normalizedType: 'offer' | 'request' =
    rawType === 'request' || rawType === 'wish' ? 'request' : 'offer';

  return {
    id: item.id.toString(),
    title: item.title,
    description: item.description || '',
    category: item.category || '',
    condition: item.condition || '',
    item_type: normalizedType,
    measurements: measurements,
    images: item.images || [],
    location: item.location || '',
    coordinates: parsedCoordinates,
    postedBy: {
      ...extractedUser,
      avatar: extractedUser.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
    },
    createdAt: item.created_at || '',
    status: item.pif_status || item.status || '',
    archived_at: item.archived_at ?? null,
    archived_reason: item.archived_reason ?? null,
    likesCount: interactionCounts.likesCount,
    interestsCount: interactionCounts.interestsCount,
    commentsCount: interactionCounts.commentsCount
  };
};
