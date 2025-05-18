import { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";
import { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export interface FeedItem {
  id: string | number;
  title: string;
  description?: string;
  images?: string[];
  location?: string;
  coordinates?: any;
  category?: string;
  condition?: string;
  measurements?: Record<string, string>;
  user_id?: string;
  user_name?: string;
  user_avatar?: string;
  archived_at?: string | null;
  archived_reason?: string | null;
  status?: string;
  // UI state properties
  __deleted?: boolean;
  __archived?: boolean;
  __restored?: boolean;
  __modified?: boolean;
  __transitionState?: 'removing' | 'archiving' | 'restoring' | 'normal';
}

type FeedAction = 
  | { type: 'SET_ITEMS'; payload: FeedItem[] }
  | { type: 'UPDATE_ITEM'; payload: { id: string | number; changes: Partial<FeedItem> } }
  | { type: 'DELETE_ITEM'; payload: { id: string | number } }
  | { type: 'ARCHIVE_ITEM'; payload: { id: string | number; reason?: string } }
  | { type: 'RESTORE_ITEM'; payload: { id: string | number } }
  | { type: 'SET_TRANSITION'; payload: { id: string | number; state: FeedItem['__transitionState'] } }
  | { type: 'SYNC_FROM_SERVER'; payload: FeedItem[] };

interface FeedContextValue {
  items: FeedItem[];
  updateItem: (id: string | number, changes: Partial<FeedItem>) => void;
  deleteItem: (id: string | number) => void;
  archiveItem: (id: string | number, reason?: string) => void;
  restoreItem: (id: string | number) => void;
  syncFromServer: (serverItems: FeedItem[]) => void;
  setItems: (items: FeedItem[]) => void;
}

const FeedContext = createContext<FeedContextValue | undefined>(undefined);

const feedReducer = (state: FeedItem[], action: FeedAction): FeedItem[] => {
  switch (action.type) {
    case 'SET_ITEMS':
      return action.payload.map(item => ({
        ...item,
        __transitionState: 'normal',
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
          ? { ...item, __deleted: true, __transitionState: 'removing' }
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
              __transitionState: 'archiving',
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
              __transitionState: 'restoring',
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
            __transitionState: item.__transitionState || 'normal',
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
        return { ...item, __deleted: true, __transitionState: 'normal' };
      })
      // Add any new items from server that weren't in our local state
      .concat(
        Array.from(serverItemsMap.values()).map(item => ({
          ...item,
          __transitionState: 'normal'
        }))
      )
      // Finally, remove any items that should be gone
      .filter(item => !(item.__deleted && item.__transitionState === 'normal'));
  }
};

export const FeedProvider = ({ children }: { children: ReactNode }) => {
  const [items, dispatch] = useReducer(feedReducer, []);

  const setItems = useCallback((newItems: FeedItem[]) => {
    dispatch({ type: 'SET_ITEMS', payload: newItems });
  }, []);

  const updateItem = useCallback((id: string | number, changes: Partial<FeedItem>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { id, changes } });
  }, []);

  const deleteItem = useCallback((id: string | number) => {
    dispatch({ type: 'DELETE_ITEM', payload: { id } });
    
    // After animation completes, set state to normal to allow filtering
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITION', payload: { id, state: 'normal' } });
    }, 500);
    
    toast({
      title: "Item deleted",
      description: "The item has been removed",
      variant: "default",
      action: (
        <button 
          className="bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-xs"
          onClick={() => {
            // This would be implemented with actual undo functionality
            toast({
              title: "Cannot undo",
              description: "This action cannot be undone",
              variant: "destructive" 
            });
          }}
        >
          Undo
        </button>
      ),
    });
  }, []);

  const archiveItem = useCallback((id: string | number, reason?: string) => {
    dispatch({ type: 'ARCHIVE_ITEM', payload: { id, reason } });
    
    // After animation completes, set state to normal
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITION', payload: { id, state: 'normal' } });
    }, 500);
    
    toast({
      title: "Item archived",
      description: "The item has been archived and can be restored later",
      variant: "default"
    });
  }, []);

  const restoreItem = useCallback((id: string | number) => {
    dispatch({ type: 'RESTORE_ITEM', payload: { id } });
    
    // After animation completes, set state to normal
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITION', payload: { id, state: 'normal' } });
    }, 500);
    
    toast({
      title: "Item restored",
      description: "The item has been restored successfully",
      variant: "default"
    });
  }, []);

  const syncFromServer = useCallback((serverItems: FeedItem[]) => {
    dispatch({ type: 'SYNC_FROM_SERVER', payload: serverItems });
  }, []);

  return (
    <FeedContext.Provider
      value={{
        items,
        updateItem,
        deleteItem,
        archiveItem,
        restoreItem,
        syncFromServer,
        setItems
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeedContext = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeedContext must be used within a FeedProvider');
  }
  return context;
};
