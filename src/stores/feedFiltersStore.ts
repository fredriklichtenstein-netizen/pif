import { create } from "zustand";
import {
  loadMapFilters,
  saveMapFilters,
  type MapFilterData,
} from "@/utils/mapFiltersStorage";

/**
 * Shared filter store used by both the `/feed` and `/map` views so the
 * two stay perfectly in sync. Persistence is delegated to the existing
 * versioned `mapFiltersStorage` helper (same localStorage key) so saved
 * selections carry over seamlessly.
 */
interface FeedFiltersState extends MapFilterData {
  setCategories: (categories: string[]) => void;
  setConditions: (conditions: string[]) => void;
  setItemTypes: (itemTypes: string[]) => void;
  setOnlyInterested: (value: boolean) => void;
  setShowArchived: (value: boolean) => void;
  clearAll: () => void;
  hydrate: () => void;
}

const initial = loadMapFilters();

export const useFeedFiltersStore = create<FeedFiltersState>((set, get) => ({
  categories: initial.categories,
  conditions: initial.conditions,
  itemTypes: initial.itemTypes,
  onlyInterested: initial.onlyInterested,
  showArchived: initial.showArchived,

  setCategories: (categories) => {
    set({ categories });
    persist(get());
  },
  setConditions: (conditions) => {
    set({ conditions });
    persist(get());
  },
  setItemTypes: (itemTypes) => {
    set({ itemTypes });
    persist(get());
  },
  setOnlyInterested: (onlyInterested) => {
    set({ onlyInterested });
    persist(get());
  },
  setShowArchived: (showArchived) => {
    set({ showArchived });
    persist(get());
  },
  clearAll: () => {
    const cleared: MapFilterData = {
      categories: [],
      conditions: [],
      itemTypes: [],
      onlyInterested: false,
      showArchived: false,
    };
    set(cleared);
    persist(get());
  },
  hydrate: () => {
    const fresh = loadMapFilters();
    set({
      categories: fresh.categories,
      conditions: fresh.conditions,
      itemTypes: fresh.itemTypes,
      onlyInterested: fresh.onlyInterested,
      showArchived: fresh.showArchived,
    });
  },
}));

function persist(state: FeedFiltersState) {
  saveMapFilters({
    categories: state.categories,
    conditions: state.conditions,
    itemTypes: state.itemTypes,
    onlyInterested: state.onlyInterested,
    showArchived: state.showArchived,
  });
}

// Cross-tab sync — rehydrate when the persisted payload changes elsewhere.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "map_filters") {
      useFeedFiltersStore.getState().hydrate();
    }
  });
}
