
import { useState, useMemo } from 'react';
import { calculateDistance } from '@/utils/distance';
import type { Post } from '@/types/post';

interface UseDistanceFilteringProps {
  posts: Post[];
  userLocation: [number, number] | null;
}

export const useDistanceFiltering = ({ posts, userLocation }: UseDistanceFilteringProps) => {
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);

  const filteredPosts = useMemo(() => {
    if (!userLocation || !selectedDistance) {
      return posts;
    }

    return posts.filter(post => {
      if (!post.coordinates) return false;
      
      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') return false;

      const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
      return distance <= selectedDistance;
    });
  }, [posts, userLocation, selectedDistance]);

  const postsWithDistances = useMemo(() => {
    if (!userLocation) {
      return posts.map(post => ({ ...post, distance: null }));
    }

    return posts.map(post => {
      if (!post.coordinates) {
        return { ...post, distance: null };
      }

      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        return { ...post, distance: null };
      }

      const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
      return { ...post, distance };
    });
  }, [posts, userLocation]);

  return {
    filteredPosts,
    postsWithDistances,
    selectedDistance,
    setSelectedDistance
  };
};
