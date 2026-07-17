
import { useState, useMemo, useCallback } from 'react';
import { calculateDistance } from '@/utils/distance';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import type { Post } from '@/types/post';

interface UseDistanceFilteringProps {
  posts: Post[];
  userLocation: [number, number] | null;
}

const DISTANCE_STORAGE_KEY = 'map_selected_distance';

function readStoredDistance(): number | null {
  try {
    const raw = sessionStorage.getItem(DISTANCE_STORAGE_KEY);
    if (raw === null || raw === 'null') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export const useDistanceFiltering = ({ posts, userLocation }: UseDistanceFilteringProps) => {
  const [selectedDistance, setSelectedDistanceState] = useState<number | null>(() => readStoredDistance());
  const { user } = useGlobalAuth();
  const currentUserId = user?.id;

  const setSelectedDistance = useCallback((distance: number | null) => {
    setSelectedDistanceState(distance);
    try {
      sessionStorage.setItem(DISTANCE_STORAGE_KEY, distance === null ? 'null' : String(distance));
    } catch {}
  }, []);

  const filteredPosts = useMemo(() => {
    // Poster-set visibility radius (post.visibilityRadiusKm) is enforced
    // independently of the viewer's own opt-in distance filter below: it
    // always applies once we know the viewer's active location (home
    // address or current GPS — whichever is toggled on), regardless of
    // whether the viewer has set selectedDistance. Owners always see their
    // own posts. Posts feeding this hook come from two shapes (the /feed
    // path's `Post.postedBy.id`, and the /map path's flat `user_id`), so
    // check both.
    const withinPosterRadius = (post: Post) => {
      const radius = (post as any).visibilityRadiusKm;
      if (radius == null || !userLocation) return true;
      const ownerId = (post as any).postedBy?.id ?? (post as any).user_id;
      if (currentUserId && ownerId === currentUserId) return true;
      if (!post.coordinates) return false;
      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') return false;
      const [userLng, userLat] = userLocation;
      const distance = calculateDistance(userLng, userLat, lng, lat);
      return !isNaN(distance) && distance <= radius;
    };

    const radiusFiltered = posts.filter(withinPosterRadius);

    if (!userLocation || !selectedDistance) {
      return radiusFiltered;
    }
    const filtered = radiusFiltered.filter(post => {
      if (!post.coordinates) {
        return false;
      }

      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return false;
      }

      // Use corrected coordinate order: lng, lat
      const [userLng, userLat] = userLocation;
      const distance = calculateDistance(userLng, userLat, lng, lat);
      const withinDistance = !isNaN(distance) && distance <= selectedDistance;

      if (!withinDistance) {
      }

      return withinDistance;
    });
    return filtered;
  }, [posts, userLocation, selectedDistance, currentUserId]);

  const postsWithDistances = useMemo(() => {
    if (!userLocation) {
      return posts.map(post => ({ ...post, distance: null }));
    }

    const [userLng, userLat] = userLocation;

    return posts.map(post => {
      if (!post.coordinates) {
        return { ...post, distance: null };
      }

      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return { ...post, distance: null };
      }

      const distance = calculateDistance(userLng, userLat, lng, lat);
      return { ...post, distance: isNaN(distance) ? null : distance };
    });
  }, [posts, userLocation]);

  return {
    filteredPosts,
    postsWithDistances,
    selectedDistance,
    setSelectedDistance
  };
};
