
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompletionStatus = "active" | "pending_confirmation" | "completed" | "archived";

interface CompletionRecord {
  itemId: string | number;
  status: CompletionStatus;
  piffedAt?: string;
  confirmedAt?: string;
  archivedAt?: string;
  receiverId?: string;
  pifferFeedback?: string;
  receiverFeedback?: string;
}

interface DemoCompletionState {
  completions: CompletionRecord[];
  
  // Actions
  markAsPiffed: (itemId: string | number, receiverId?: string) => void;
  confirmReceipt: (itemId: string | number, feedback?: string) => void;
  archiveItem: (itemId: string | number) => void;
  addPifferFeedback: (itemId: string | number, feedback: string) => void;
  
  // Getters
  getStatus: (itemId: string | number) => CompletionStatus;
  getCompletion: (itemId: string | number) => CompletionRecord | null;
  isPendingConfirmation: (itemId: string | number) => boolean;
  isCompleted: (itemId: string | number) => boolean;
  isArchived: (itemId: string | number) => boolean;
}

export const useDemoCompletionStore = create<DemoCompletionState>()(
  persist(
    (set, get) => ({
      completions: [],
      
      markAsPiffed: (itemId, receiverId) => {
        set((state) => {
          const filtered = state.completions.filter(
            (c) => String(c.itemId) !== String(itemId)
          );
          return {
            completions: [
              ...filtered,
              {
                itemId,
                status: "pending_confirmation" as CompletionStatus,
                piffedAt: new Date().toISOString(),
                receiverId,
              },
            ],
          };
        });
      },
      
      confirmReceipt: (itemId, feedback) => {
        set((state) => ({
          completions: state.completions.map((c) =>
            String(c.itemId) === String(itemId)
              ? {
                  ...c,
                  status: "completed" as CompletionStatus,
                  confirmedAt: new Date().toISOString(),
                  receiverFeedback: feedback,
                }
              : c
          ),
        }));
        
        // Auto-archive after 24 hours simulation (immediate for demo)
        setTimeout(() => {
          get().archiveItem(itemId);
        }, 5000); // 5 seconds for demo purposes
      },
      
      archiveItem: (itemId) => {
        set((state) => ({
          completions: state.completions.map((c) =>
            String(c.itemId) === String(itemId)
              ? {
                  ...c,
                  status: "archived" as CompletionStatus,
                  archivedAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },
      
      addPifferFeedback: (itemId, feedback) => {
        set((state) => ({
          completions: state.completions.map((c) =>
            String(c.itemId) === String(itemId)
              ? { ...c, pifferFeedback: feedback }
              : c
          ),
        }));
      },
      
      getStatus: (itemId) => {
        const completion = get().completions.find(
          (c) => String(c.itemId) === String(itemId)
        );
        return completion?.status || "active";
      },
      
      getCompletion: (itemId) => {
        return get().completions.find(
          (c) => String(c.itemId) === String(itemId)
        ) || null;
      },
      
      isPendingConfirmation: (itemId) => {
        return get().getStatus(itemId) === "pending_confirmation";
      },
      
      isCompleted: (itemId) => {
        const status = get().getStatus(itemId);
        return status === "completed" || status === "archived";
      },
      
      isArchived: (itemId) => {
        return get().getStatus(itemId) === "archived";
      },
    }),
    {
      name: "pif-demo-completions",
    }
  )
);
