
import { parseCoordinatesFromDB } from "@/types/post";
import type { Post, ImageCrop } from "@/types/post";
import type { InteractionCounts } from "./types";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { extractCoordinates } from "@/utils/coordinates/coordinateExtractor";

export const transformPostData = (
  item: any,
  interactionCounts: InteractionCounts
): Post => {
  let parsedCoordinates = null;
  if (item.coordinates_json) {
    try {
      parsedCoordinates = extractCoordinates(item.coordinates_json);
    } catch (err) {
      console.error("Error parsing coordinates:", err, item.coordinates_json);
    }
  }
  
  
  
  // Process measurements to ensure they are correctly formatted
  const measurements = (typeof item.measurements === 'object' && item.measurements !== null)
    ? item.measurements
    : {};

  // image_crops is a plain array parallel to images; anything else (null,
  // missing column, malformed value) means "no preference for any image".
  const imageCrops: (ImageCrop | null)[] | undefined = Array.isArray(item.image_crops)
    ? item.image_crops
    : undefined;

  const visibilityRadiusKm: number | null =
    typeof item.visibility_radius_km === 'number' ? item.visibility_radius_km : null;

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
    imageCrops,
    location: item.location || '',
    coordinates: parsedCoordinates,
    visibilityRadiusKm,
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
