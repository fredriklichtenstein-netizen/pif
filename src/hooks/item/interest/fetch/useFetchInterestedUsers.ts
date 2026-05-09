
import { supabase } from "@/integrations/supabase/client";
import type { User } from "../../utils/userUtils";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

export const useFetchInterestedUsers = () => {
  const fetchInterestedUsersCore = async (numericId: number): Promise<User[]> => {
    if (isAuthRequestCircuitOpen()) return [];

    try {
      // Use a single joined query (matches the profile grid view) so we never
      // return an empty list when interests exist but a follow-up profile fetch fails.
      const { data, error } = await supabase
        .from('interests')
        .select('id, user_id, status, created_at, profiles:user_id(id, first_name, last_name, avatar_url)')
        .eq('item_id', numericId);

      if (error) {
        if (maybeRecoverFromAuthError(error, "fetch interested users")) throw error;
        console.error('Error fetching interests data:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      const seen = new Set<string>();
      const users: User[] = [];
      for (const row of data as any[]) {
        const profile = row.profiles;
        if (!profile || seen.has(profile.id)) continue;
        seen.add(profile.id);
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
        users.push({
          id: profile.id,
          name,
          avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`,
        });
      }

      return users;
    } catch (error) {
      if (maybeRecoverFromAuthError(error, "fetch interested users exception")) throw error;
      console.error('Error in fetchInterestedUsersCore:', error);
      return [];
    }
  };

  return { fetchInterestedUsersCore };
};
