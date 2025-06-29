
import React, { useMemo, useCallback } from 'react';
import { VirtualizedList } from './virtualized-list';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemHeight = 400,
  containerHeight = 600,
  onEndReached,
  onEndReachedThreshold = 0.8
}: OptimizedListProps<T>) {
  // Memoize the render function to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback((item: T, index: number) => {
    const key = keyExtractor(item, index);
    return (
      <div key={key} className="mb-4">
        {renderItem(item, index)}
      </div>
    );
  }, [renderItem, keyExtractor]);

  // Memoize the items to prevent unnecessary recalculations
  const memoizedItems = useMemo(() => items, [items]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!onEndReached) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const threshold = scrollHeight * onEndReachedThreshold!;
    
    if (scrollTop + clientHeight >= threshold) {
      onEndReached();
    }
  }, [onEndReached, onEndReachedThreshold]);

  // Use virtualization for large lists
  if (items.length > 20) {
    return (
      <VirtualizedList
        items={memoizedItems}
        height={containerHeight}
        itemHeight={itemHeight}
        renderItem={memoizedRenderItem}
        className={className}
      />
    );
  }

  // Regular list for smaller datasets
  return (
    <div 
      className={className}
      style={{ maxHeight: containerHeight, overflowY: 'auto' }}
      onScroll={handleScroll}
    >
      {memoizedItems.map((item, index) => memoizedRenderItem(item, index))}
    </div>
  );
}

export { OptimizedList };
