
/**
 * Mock profile data for demo mode
 */
export const DEMO_PROFILE = {
  id: "demo-user-id",
  first_name: "Demo",
  last_name: "User",
  avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  gender: null,
  address: "Stockholm, Sweden",
  location: { lng: 18.0686, lat: 59.3293 },
  neighborhood: "Södermalm",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mock interested users for demo mode
 */
export const MOCK_INTERESTED_USERS = [
  {
    id: 101,
    user_id: "user-anna",
    status: "pending",
    message: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    users: {
      id: "user-anna",
      first_name: "Anna",
      last_name: "Svensson",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      reliability_score: 4.8,
      completed_pifs: 12,
      no_shows: 0,
    }
  },
  {
    id: 102,
    user_id: "user-erik",
    status: "pending",
    message: "I would love this for my new apartment!",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    users: {
      id: "user-erik",
      first_name: "Erik",
      last_name: "Lindqvist",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      reliability_score: 4.2,
      completed_pifs: 5,
      no_shows: 1,
    }
  },
  {
    id: 103,
    user_id: "user-maria",
    status: "pending",
    message: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    users: {
      id: "user-maria",
      first_name: "Maria",
      last_name: "Karlsson",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      reliability_score: 5.0,
      completed_pifs: 28,
      no_shows: 0,
    }
  },
];
