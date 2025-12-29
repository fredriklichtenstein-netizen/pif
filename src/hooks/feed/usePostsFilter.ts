
import { useState, useMemo, useCallback } from "react";

export function usePostsFilter(allPosts: any[]) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Compute filtered posts whenever allPosts or selectedCategories change
  const filteredPosts = useMemo(() => {
    if (!selectedCategories.length) {
      return allPosts;
    }
    return allPosts.filter(post => 
      post.category && selectedCategories.includes(post.category)
    );
  }, [allPosts, selectedCategories]);
  
  const filterByCategories = useCallback((categories: string[]) => {
    setSelectedCategories(categories);
  }, []);

  return {
    filteredPosts,
    filterByCategories
  };
}
