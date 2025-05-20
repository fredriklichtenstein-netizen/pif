
import { extractUserFromProfile } from '@/hooks/item/utils/userUtils';

export function transformItemsToPostsFormat(items: any[]) {
  return items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    images: item.images,
    location: item.location,
    coordinates: item.coordinates,
    category: item.category,
    condition: item.condition,
    measurements: item.measurements,
    user_id: item.user_id,
    status: item.status,
    archived_at: item.archived_at,
    archived_reason: item.archived_reason,
    user_name: extractUserFromProfile(item.profiles, item.user_id).name,
    user_avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || '',
  }));
}
