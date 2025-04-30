
import { useState, useCallback } from "react";

export function usePostsFilter(allPosts: any[]) {
  const [filteredPosts, setFilteredPosts] = useState<any[]>(allPosts);
  
  const filterByCategories = useCallback((categories: string[]) => {
    if (!categories.length) {
      // If no categories selected, show all posts
      setFilteredPosts(allPosts);
      return;
    }

    const filtered = allPosts.filter(post => 
      post.category && categories.includes(post.category)
    );
    
    setFilteredPosts(filtered);
  }, [allPosts]);

  return {
    filteredPosts,
    filterByCategories
  };
}
