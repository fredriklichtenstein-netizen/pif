import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RatingOutcome = "positive" | "no_show";

export interface RatingRecord {
  id: string;
  itemId: string | number;
  raterId: string;
  rateeId: string;
  outcome: RatingOutcome;
  privateNote?: string;
  createdAt: string;
}

interface DemoRatingsState {
  ratings: RatingRecord[];
  submitRating: (input: Omit<RatingRecord, "id" | "createdAt">) => RatingRecord;
  getForItem: (itemId: string | number) => RatingRecord[];
  hasRated: (itemId: string | number, raterId: string) => boolean;
  getReliability: (userId: string) => {
    reliability_score: number;
    completed_pifs: number;
    no_shows: number;
  };
}

export const useDemoRatingsStore = create<DemoRatingsState>()(
  persist(
    (set, get) => ({
      ratings: [],

      submitRating: (input) => {
        // Upsert by (itemId, raterId, rateeId) — a single rater may
        // rate multiple ratees on the same item (wishes can have many
        // selected helpers). Re-rating the same (item, rater, ratee)
        // overwrites the previous outcome/note.
        const next: RatingRecord = {
          ...input,
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          ratings: [
            ...state.ratings.filter(
              (r) =>
                !(
                  String(r.itemId) === String(input.itemId) &&
                  r.raterId === input.raterId &&
                  r.rateeId === input.rateeId
                )
            ),
            next,
          ],
        }));
        return next;
      },

      getForItem: (itemId) =>
        get().ratings.filter((r) => String(r.itemId) === String(itemId)),

      hasRated: (itemId, raterId) =>
        get().ratings.some(
          (r) => String(r.itemId) === String(itemId) && r.raterId === raterId
        ),

      getReliability: (userId) => {
        const mine = get().ratings.filter((r) => r.rateeId === userId);
        const completed = mine.filter((r) => r.outcome === "positive").length;
        const noShows = mine.filter((r) => r.outcome === "no_show").length;
        const total = completed + noShows;
        const score = total === 0 ? 0 : Math.round((completed / total) * 5 * 100) / 100;
        return {
          reliability_score: score,
          completed_pifs: completed,
          no_shows: noShows,
        };
      },
    }),
    { name: "pif-demo-ratings" }
  )
);
