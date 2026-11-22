import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { flashToast } from "@/lib/flashToast";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/optimized-image";
import { supabase } from "@/integrations/supabase/client";
import { useBlockStore } from "@/stores/blockStore";

interface BlockedUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

/** Settings → Blockerade användare: who I blocked, with "Häv blockering". */
export function BlockedUsersSettings() {
  const { t } = useTranslation();
  const unblock = useBlockStore((s) => s.unblock);
  // Re-read the list whenever a block is added elsewhere in the app.
  const hiddenIds = useBlockStore((s) => s.hiddenIds);
  const [users, setUsers] = useState<BlockedUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await (supabase.rpc as any)("get_my_blocked_users");
    if (error) {
      console.warn("[blocks] list failed", error.message);
      setUsers([]);
      return;
    }
    setUsers((data ?? []) as BlockedUser[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load, hiddenIds]);

  const handleUnblock = async (u: BlockedUser) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || t("blocking.this_person");
    setBusyId(u.user_id);
    try {
      await unblock(u.user_id);
      flashToast("success", t("blocking.unblocked_toast", { name }));
      await load();
    } catch (e) {
      console.error("[blocks] unblock failed", e);
      flashToast("error", t("blocking.error"), 3000);
    } finally {
      setBusyId(null);
    }
  };

  if (users === null) return <div className="h-10 rounded-md bg-muted animate-pulse" />;
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("blocking.settings_empty")}</p>;
  }

  return (
    <ul className="divide-y">
      {users.map((u) => {
        const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
        return (
          <li key={u.user_id} className="flex items-center gap-3 py-2">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
              <AvatarImage src={u.avatar_url ?? undefined} alt={name} size={36} className="h-full w-full object-cover" />
            </div>
            <span className="flex-1 truncate text-sm">{name || t("blocking.this_person")}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={busyId === u.user_id}
              onClick={() => void handleUnblock(u)}
            >
              {t("blocking.unblock")}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
