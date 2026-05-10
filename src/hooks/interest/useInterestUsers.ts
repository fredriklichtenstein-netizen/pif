
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { useAuthStore } from "@/hooks/auth/authStore";

export function useInterestUsers(itemId: number) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const authInitialized = useAuthStore((s) => s.initialized);

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
        .select("*, profiles:user_id(id, first_name, last_name, avatar_url)")
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
    if (!itemId) return;
    fetchInterests();
  }, [itemId]);

  return {
    users,
    loading,
    refetchUsers: fetchInterests
  };
}
