import { useQuery } from "@tanstack/react-query";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { DRAFTS_QUERY_KEY, fetchMyDrafts } from "@/services/drafts";

export function useMyDrafts() {
  const { user } = useGlobalAuth();
  return useQuery({
    queryKey: [...DRAFTS_QUERY_KEY, user?.id],
    queryFn: fetchMyDrafts,
    enabled: !!user?.id && !DEMO_MODE,
    staleTime: 30_000,
  });
}
