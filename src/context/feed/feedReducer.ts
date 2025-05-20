import { FeedItem, FeedAction } from './types';

export const feedReducer = (state: FeedItem[], action: FeedAction): FeedItem[] => {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.payload.map(item => ({
        ...item,
        __transitionState: 'normal' as const,
      }));
      
    case 'UPDATE_ITEM':
      return state.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { ...item, ...action.payload.changes, __modified: true }
          : item
      );
      
    case 'DELETE_ITEM':
      return state.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { ...item, __deleted: true, __transitionState: 'removing' as const }
          : item
      ).filter(item => !item.__deleted || item.__transitionState === 'removing');
      
    case 'ARCHIVE_ITEM':
      return state.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { 
              ...item, 
              archived_at: new Date().toISOString(), 
              archived_reason: action.payload.reason || null, 
              __archived: true, 
              __transitionState: 'archiving' as const,
              __modified: true
            }
          : item
      );
      
    case 'RESTORE_ITEM':
      return state.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { 
              ...item, 
              archived_at: null, 
              archived_reason: null, 
              __archived: false, 
              __restored: true,
              __transitionState: 'restoring' as const,
              __modified: true
            }
          : item
      );
    
    case 'SET_TRANSITION':
      return state.map(item =>
        item.id.toString() === action.payload.id.toString()
          ? { ...item, __transitionState: action.payload.state }
          : item
      ).filter(item => !(item.__deleted && item.__transitionState === 'normal'));
      
    case 'SYNC_FROM_SERVER':
      // Create a map of server items by id for quick lookup
      const serverItemsMap = new Map(action.payload.map(item => [item.id.toString(), item]));
      
      // Update existing items with server data, preserving UI state
      return state.map(item => {
        const serverItem = serverItemsMap.get(item.id.toString());
        
        // If this item exists in the new server data
        if (serverItem) {
          // Remove this item from the map so we know we've processed it
          serverItemsMap.delete(item.id.toString());
          
          // If item is marked as deleted locally but still exists on server, keep it deleted
          if (item.__deleted) return item;
          
          // Otherwise merge server data with local UI state
          return {
            ...serverItem,
            __transitionState: item.__transitionState || 'normal' as const,
            __modified: item.__modified,
            __archived: item.archived_at ? true : false,
            __restored: item.__restored
          };
        }
        
        // If not in server data but we have an in-progress transition, keep it
        if (item.__transitionState && item.__transitionState !== 'normal') {
          return item;
        }
        
        // Item was removed from server and not in transition, filter it out
        return { ...item, __deleted: true, __transitionState: 'normal' as const };
      })
      // Add any new items from server that weren't in our local state
      .concat(
        Array.from(serverItemsMap.values()).map(item => ({
          ...item,
          __transitionState: 'normal' as const
        }))
      )
      // Finally, remove any items that should be gone
      .filter(item => !(item.__deleted && item.__transitionState === 'normal'));
  }
};
