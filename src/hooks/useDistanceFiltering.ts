
import { useState, useMemo, useCallback } from 'react';
import { calculateDistance } from '@/utils/distance';
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

  const setSelectedDistance = useCallback((distance: number | null) => {
    setSelectedDistanceState(distance);
    try {
      sessionStorage.setItem(DISTANCE_STORAGE_KEY, distance === null ? 'null' : String(distance));
    } catch {}
  }, []);

  const filteredPosts = useMemo(() => {
    if (!userLocation || !selectedDistance) {
      return posts;
    }
    const filtered = posts.filter(post => {
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
  }, [posts, userLocation, selectedDistance]);

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
