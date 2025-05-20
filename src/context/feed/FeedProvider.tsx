
import { createContext, useReducer, useCallback, ReactNode } from "react";
import { FeedContextValue, FeedItem } from './types';
import { feedReducer } from './feedReducer';
import { showDeleteToast, showArchiveToast, showRestoreToast } from './feedToasts';

export const FeedContext = createContext<FeedContextValue | undefined>(undefined);

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
    
    showDeleteToast();
  }, []);

  const archiveItem = useCallback((id: string | number, reason?: string) => {
    dispatch({ type: 'ARCHIVE_ITEM', payload: { id, reason } });
    
    // After animation completes, set state to normal
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITION', payload: { id, state: 'normal' } });
    }, 500);
    
    showArchiveToast();
  }, []);

  const restoreItem = useCallback((id: string | number) => {
    dispatch({ type: 'RESTORE_ITEM', payload: { id } });
    
    // After animation completes, set state to normal
    setTimeout(() => {
      dispatch({ type: 'SET_TRANSITION', payload: { id, state: 'normal' } });
    }, 500);
    
    showRestoreToast();
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
