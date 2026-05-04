// Updated TypeScript Definitions

export type profiles = {
  // existing fields
  created_at: string;
  reliability_score: number; // New column
  completed_pifs: number; // New column
  no_shows: number; // New column
};

export type profilesInsert = {
  // existing fields
  created_at?: string;
  reliability_score?: number; // New column
  completed_pifs?: number; // New column
  no_shows?: number; // New column
};

export type profilesUpdate = {
  // existing fields
  created_at?: string;
  reliability_score?: number; // New column
  completed_pifs?: number; // New column
  no_shows?: number; // New column
};

export type ratings = {
  item_id: string;
  profile_id: string;
  rating: number;
};

// Relationships
export const relationships = {
  item: 'items',
  profile: 'profiles',
};

export const Functions = {
  submit_rating: function(item_id: string, profile_id: string, rating: number) {
    // function implementation here
  },
  recompute_reliability: function(profile_id: string) {
    // function implementation here
  },
  select_receiver: {
    Args: { p_item_id: 0 as number, p_receiver_id: "" as string },
    Returns: "" as string,
  }
};
