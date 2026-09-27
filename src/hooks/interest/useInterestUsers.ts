
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { useAuthStore } from "@/hooks/auth/authStore";
import { getProfileEmbedColumns } from "@/services/profile/publicColumns";

export function useInterestUsers(itemId: number) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const authInitialized = useAuthStore((s) => s.initialized);
  const authUser = useAuthStore((s) => s.user);

  const fetchInterests = async () => {
    if (isAuthRequestCircuitOpen()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const numericItemId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { data, error } = await supabase
        .from("interests")
        .select(`*, profiles:user_id(${getProfileEmbedColumns(!!authUser)})`)
        .eq("item_id", numericItemId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      maybeRecoverFromAuthError(err, "profile interest users fetch");
      console.error("Error fetching interested users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authInitialized) return;
    if (!itemId) return;
    fetchInterests();
  }, [itemId, authInitialized, authUser]);

  return {
    users,
    loading,
    refetchUsers: fetchInterests
  };
}
