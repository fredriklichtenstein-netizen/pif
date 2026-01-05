
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Selection {
  itemId: number | string;
  selectedUserId: string;
  selectedAt: string;
}

interface DemoSelectionsState {
  selections: Selection[];
  
  // Actions
  selectUser: (itemId: number | string, userId: string) => void;
  unselectUser: (itemId: number | string) => void;
  
  // Getters
  getSelectedUser: (itemId: number | string) => string | null;
  isUserSelected: (itemId: number | string, userId: string) => boolean;
  hasSelection: (itemId: number | string) => boolean;
}

export const useDemoSelectionsStore = create<DemoSelectionsState>()(
  persist(
    (set, get) => ({
      selections: [],
      
      selectUser: (itemId, userId) => {
        set((state) => {
          // Remove any existing selection for this item
          const filtered = state.selections.filter(
            (s) => String(s.itemId) !== String(itemId)
          );
          return {
            selections: [
              ...filtered,
              {
                itemId,
                selectedUserId: userId,
                selectedAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
      
      unselectUser: (itemId) => {
        set((state) => ({
          selections: state.selections.filter(
            (s) => String(s.itemId) !== String(itemId)
          ),
        }));
      },
      
      getSelectedUser: (itemId) => {
        const selection = get().selections.find(
          (s) => String(s.itemId) === String(itemId)
        );
        return selection?.selectedUserId || null;
      },
      
      isUserSelected: (itemId, userId) => {
        const selection = get().selections.find(
          (s) => String(s.itemId) === String(itemId)
        );
        return selection?.selectedUserId === userId;
      },
      
      hasSelection: (itemId) => {
        return get().selections.some(
          (s) => String(s.itemId) === String(itemId)
        );
      },
    }),
    {
      name: "pif-demo-selections",
    }
  )
);
