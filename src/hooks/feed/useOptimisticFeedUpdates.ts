import { useState, useCallback } from "react";

export type OperationType = 'delete' | 'archive' | 'restore';

export interface ItemOperation {
  id: string | number;
  type: OperationType;
  timestamp: number;
}

export function useOptimisticFeedUpdates() {
  // Track recently modified items to enable optimistic UI updates
  const [recentOperations, setRecentOperations] = useState<ItemOperation[]>([]);

  // Record a new operation
  const recordOperation = useCallback((id: string | number, type: OperationType) => {
    console.log(`Recording operation: ${type} for item ${id}`);
    setRecentOperations(prev => [
      ...prev.filter(op => op.id !== id), // Remove any previous operations for this item
      { id, type, timestamp: Date.now() }
    ]);
    
    // Clean up old operations after 30 seconds
    setTimeout(() => {
      setRecentOperations(prev => prev.filter(op => op.id !== id));
    }, 30000);
  }, []);

  // Apply optimistic updates to the current posts list
  const applyOptimisticUpdates = useCallback((posts: any[]) => {
    if (recentOperations.length === 0) {
      return posts;
    }

    return posts.map(post => {
      // Find if this post has a recent operation
      const operation = recentOperations.find(op => op.id.toString() === post.id.toString());
      
      if (!operation) {
        return post;
      }
      
      // Apply the operation optimistically
      switch (operation.type) {
        case 'delete':
          // Mark as deleted but keep in array (will be filtered out by parent component)
          return { ...post, __deleted: true };
        
        case 'archive':
          // Mark as archived with current timestamp
          return { 
            ...post, 
            archived_at: new Date().toISOString(),
            __modified: true 
          };
        
        case 'restore':
          // Clear archived status
          return { 
            ...post, 
            archived_at: null,
            archived_reason: null,
            __modified: true 
          };
        
        default:
          return post;
      }
    }).filter(post => !post.__deleted); // Remove deleted posts
  }, [recentOperations]);

  // Determine if an item should be shown based on optimistic updates and current view
  const shouldShowItem = useCallback((itemId: string | number, viewMode: string) => {
    const operation = recentOperations.find(op => op.id.toString() === itemId.toString());
    
    if (!operation) return true;
    
    switch (viewMode) {
      case 'archived':
        // In archived view, show only if item was not restored
        return operation.type !== 'restore';
      
      case 'all':
      case 'saved':
      case 'myPifs':
      case 'interested':
        // In normal views, show only if item was not deleted or archived
        return operation.type !== 'delete' && operation.type !== 'archive';
      
      default:
        return true;
    }
  }, [recentOperations]);

  return {
    recentOperations,
    recordOperation,
    applyOptimisticUpdates,
    shouldShowItem
  };
}
