
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
      console.log('Distance filtering disabled:', { hasLocation: !!userLocation, hasDistance: !!selectedDistance });
      return posts;
    }

    console.log('Applying distance filter:', { distance: selectedDistance, userLocation, postCount: posts.length });

    const filtered = posts.filter(post => {
      if (!post.coordinates) {
        console.log('Skipping post without coordinates:', post.id);
        return false;
      }
      
      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        console.log('Skipping post with invalid coordinates:', post.id, { lng, lat });
        return false;
      }

      const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
      const withinDistance = distance <= selectedDistance;
      
      if (!withinDistance) {
        console.log('Post filtered out by distance:', post.id, { distance, maxDistance: selectedDistance });
      }
      
      return withinDistance;
    });

    console.log('Distance filtering result:', { originalCount: posts.length, filteredCount: filtered.length });
    return filtered;
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
