
import type { User, Session } from "@supabase/supabase-js";

/**
 * Mock user for demo mode
 */
export const DEMO_USER: User = {
  id: "demo-user-id",
  email: "demo@example.com",
  app_metadata: {},
  user_metadata: {
    full_name: "Demo User",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

export const DEMO_SESSION: Session = {
  access_token: "demo-access-token",
  refresh_token: "demo-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: "bearer",
  user: DEMO_USER,
};
