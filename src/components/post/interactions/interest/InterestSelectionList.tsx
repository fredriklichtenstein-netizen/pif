import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { UserMinus, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AvatarImage } from "@/components/ui/optimized-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { TrustIndicator } from "@/components/profile/interest/TrustIndicator";
import { subscribeItemTable } from "@/services/realtime/itemRealtimeManager";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_INTERESTED_USERS } from "@/data/mockProfiles";
import {
  useDemoSelectionsStore,
} from "@/stores/demoSelectionsStore";

interface InterestSelectionListProps {
  itemId: string | number;
  itemOwnerId?: string;
  currentUserId?: string;
  /** When 'request', enables multi-helper selection and the wish-flow copy. */
  itemType?: 'offer' | 'request';
  setShowPopup: (show: boolean) => void;
}

interface InterestRow {
  id: number;
  user_id: string;
  status: "pending" | "selected" | "not_selected" | string;
  created_at: string;
  /** Helper note left when granting a wish. */
  note?: string | null;
  profile?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    reliability_score?: number | null;
    completed_pifs?: number | null;
    no_shows?: number | null;
  } | null;
}

const PAGE_SIZE = 20;

/**
 * Unified interested-users list rendered inside the interest counter
 * popover on every page (feed, expanded post, profile).
 *
 *  - Anyone can open user profiles via the avatar/name link.
 *  - The piffer (item owner) sees Select / Withdraw controls inline.
 *  - Subscribes to the shared per-item realtime channel so the list
 *    refreshes across sessions when interest is added/removed/selected.
 */
export function InterestSelectionList({
  itemId,
  itemOwnerId,
  currentUserId,
  itemType,
  setShowPopup,
}: InterestSelectionListProps) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("sv") ? sv : enUS;
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOwner = !!currentUserId && currentUserId === itemOwnerId;
  const isWish = itemType === 'request';

  const [rows, setRows] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [withdrawId, setWithdrawId] = useState<number | null>(null);

  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const demoSelections = useDemoSelectionsStore();

  const numericItemId =
    typeof itemId === "number" ? itemId : parseInt(itemId as string, 10);

  const loadDemo = useCallback(() => {
    const selectedUserId = demoSelections.getSelectedUser(itemId);
    const mockRows: InterestRow[] = MOCK_INTERESTED_USERS.map((u: any, idx: number) => ({
      id: idx + 1,
      user_id: u.user_id,
      status:
        selectedUserId === u.user_id
          ? "selected"
          : selectedUserId
          ? "not_selected"
          : "pending",
      created_at: u.created_at || new Date().toISOString(),
      profile: u.users
        ? {
            id: u.user_id,
            first_name: u.users.first_name,
            last_name: u.users.last_name,
            avatar_url: u.users.avatar_url,
            reliability_score: u.users.reliability_score,
            completed_pifs: u.users.completed_pifs,
            no_shows: u.users.no_shows,
          }
        : null,
    }));
    setRows(mockRows);
    setHasMore(false);
    setLoading(false);
  }, [demoSelections, itemId]);

  const loadPage = useCallback(
    async (initial: boolean) => {
      if (DEMO_MODE) {
        if (initial) loadDemo();
        return;
      }
      if (inFlightRef.current) return;
      if (!initial && !hasMore) return;
      if (isNaN(numericItemId)) {
        setLoading(false);
        return;
      }
      inFlightRef.current = true;
      if (initial) setLoading(true);
      else setLoadingMore(true);
      try {
        const offset = initial ? 0 : offsetRef.current;
        // Hard timeout so the popup never hangs forever on a stalled request.
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 8000),
        );
        const queryPromise = (supabase
          .from("interests") as any)
          .select(
            "id, user_id, status, created_at, note, profiles:user_id(id, first_name, last_name, avatar_url, reliability_score, completed_pifs, no_shows)"
          )
          .eq("item_id", numericItemId)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE);
        const { data, error: err } = (await Promise.race([
          queryPromise,
          timeoutPromise,
        ])) as { data: any[] | null; error: any };
        if (err) throw err;
        const fetched = (data || []) as any[];
        const more = fetched.length > PAGE_SIZE;
        const slice = fetched.slice(0, PAGE_SIZE).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          status: r.status,
          created_at: r.created_at,
          note: r.note ?? null,
          profile: r.profiles,
        })) as InterestRow[];
        offsetRef.current = offset + slice.length;
        setHasMore(more);
        setRows((prev) => (initial ? slice : [...prev, ...slice]));
        setError(null);
      } catch (e) {
        console.error("[InterestSelectionList] load failed", e);
        setError(e instanceof Error ? e : new Error("load failed"));
      } finally {
        if (initial) setLoading(false);
        else setLoadingMore(false);
        inFlightRef.current = false;
      }
    },
    [hasMore, loadDemo, numericItemId]
  );

  const reload = useCallback(() => {
    inFlightRef.current = false;
    offsetRef.current = 0;
    setHasMore(true);
    loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: refresh on any change to interests for this item.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!itemId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeItemTable(itemId, "interests", () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(reload, 350);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [itemId, reload]);

  // Auto-load next page on scroll.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !loading &&
          !loadingMore
        ) {
          loadPage(false);
        }
      },
      { root: node.parentElement, rootMargin: "40px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadPage]);

  const displayName = (r: InterestRow) => {
    const p = r.profile;
    if (!p) return t("interactions.interested");
    return `${p.first_name || ""} ${p.last_name?.[0] || ""}`.trim() ||
      t("interactions.interested");
  };

  const handleSelect = async (interestId: number) => {
    const row = rows.find((r) => r.id === interestId);
    if (!row) return;
    setConfirmId(null);
    if (busyId !== null) return;
    setBusyId(interestId);

    if (DEMO_MODE) {
      demoSelections.selectUser(itemId, row.user_id);
      reload();
      toast({
        title: t("interactions.receiver_selected"),
        description: t("interactions.receiver_selected_with_name", {
          name: displayName(row),
        }),
      });
      setBusyId(null);
      return;
    }

    try {
      const rpcName = isWish ? "select_wish_helper" : "select_receiver";
      const rpcArgs = isWish
        ? { p_item_id: numericItemId, p_helper_id: row.user_id }
        : { p_item_id: numericItemId, p_receiver_id: row.user_id };
      const { data: conversationId, error: rpcError } = await (supabase.rpc as any)(
        rpcName,
        rpcArgs,
      );
      if (rpcError) throw rpcError;
      // Optimistically update UI: pifs are single-receiver, wishes can
      // have many helpers, so for wishes we only flip the picked row.
      setRows((prev) =>
        prev.map((r) => {
          if (isWish) {
            return r.id === interestId ? { ...r, status: "selected" } : r;
          }
          return {
            ...r,
            status: r.id === interestId ? "selected" : "not_selected",
          };
        })
      );
      // Pre-seed the conversation with the helper's note so the wisher
      // sees the "how I can help" message as the first message in the
      // thread without anyone having to retype it.
      if (isWish && conversationId && row.note && row.note.trim()) {
        try {
          await (supabase.from("messages") as any).insert({
            conversation_id: conversationId,
            sender_id: row.user_id,
            content: row.note.trim(),
          });
        } catch (seedErr) {
          console.warn("[InterestSelectionList] seed first message failed", seedErr);
        }
      }
      toast({
        title: isWish
          ? t("interactions.helper_selected", "Helper added")
          : t("interactions.receiver_selected"),
        description: t("interactions.receiver_selected_with_name", {
          name: displayName(row),
        }),
      });
      setShowPopup(false);
      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}`);
      } else {
        navigate(`/messages`);
      }
    } catch (e: any) {
      console.error("[InterestSelectionList] select_receiver failed", e);
      const code = e?.code || e?.details?.code;
      let description = t("interactions.error_select_receiver");
      if (code === "23505" || /already been selected|already selected/i.test(e?.message || "")) {
        description = t("interactions.error_already_selected");
        // Refresh so the UI reflects the winner picked by the other session.
        reload();
      } else if (code === "42501") {
        description = t("interactions.error_not_authorized_select");
      } else if (code === "P0002") {
        description = t("interactions.error_interest_missing");
      }
      toast({
        variant: "destructive",
        title: t("interactions.error_title"),
        description,
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawId(null);
    if (DEMO_MODE) {
      demoSelections.unselectUser(itemId);
      reload();
      toast({
        title: t("interactions.selection_withdrawn"),
        description: t("interactions.selection_withdrawn_description"),
      });
      return;
    }
    try {
      await supabase
        .from("interests")
        .update({ status: "pending", selected_at: null } as any)
        .eq("item_id", numericItemId);
      reload();
      toast({
        title: t("interactions.selection_withdrawn"),
        description: t("interactions.selection_withdrawn_description"),
      });
    } catch (e) {
      console.error("[InterestSelectionList] withdraw failed", e);
      toast({
        variant: "destructive",
        title: t("interactions.error_title"),
        description: t("interactions.error_withdraw_selection"),
      });
    }
  };

  return (
    <div className="max-h-[340px] overflow-y-auto">
      <div className="flex justify-between items-center mb-2 sticky top-0 bg-white z-10">
        <h3 className="font-semibold text-sm">
          {isOwner
            ? isWish
              ? t("interactions.choose_helpers", "Choose helpers")
              : t("interactions.choose_receiver")
            : isWish
              ? t("interactions.helpers_offering", "Neighbors offering to help")
              : t("common.interested_users")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPopup(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      {loading ? (
        <div className="p-4 text-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("status.loading")}</p>
        </div>
      ) : error && rows.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("common.unable_to_load_list", "Could not load list")}
          </p>
          <Button size="sm" variant="outline" onClick={reload}>
            {t("interactions.retry", "Retry")}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground text-sm">
          {t("profile.no_interest_yet")}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-1 p-2 rounded hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Link
                  to={`/user/${r.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
                >
                  <AvatarImage
                    src={r.profile?.avatar_url || ""}
                    size={28}
                    alt={displayName(r)}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {displayName(r)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "d MMM HH:mm", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                </Link>

                {isOwner && r.status === "pending" && (
                  <TrustIndicator
                    reliabilityScore={r.profile?.reliability_score ?? undefined}
                    completedPifs={r.profile?.completed_pifs ?? undefined}
                    noShows={r.profile?.no_shows ?? undefined}
                    compact
                  />
                )}

                <div className="ml-auto flex items-center gap-1">
                  {r.status === "selected" && (
                    <>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                        {isWish
                          ? t("interactions.helper_chosen_badge", "Chosen")
                          : t("interactions.selected_badge")}
                      </span>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto whitespace-nowrap text-destructive hover:text-destructive"
                          onClick={() => setWithdrawId(r.id)}
                          aria-label={t("interactions.withdraw_selection_aria")}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          {t("interactions.withdraw_selection_btn")}
                        </Button>
                      )}
                      {!isOwner && currentUserId === r.user_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                          onClick={() => {
                            setShowPopup(false);
                            navigate(`/messages`);
                          }}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {t("interactions.message_btn")}
                        </Button>
                      )}
                    </>
                  )}
                  {r.status === "pending" && isOwner && (
                    <Button
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => setConfirmId(r.id)}
                      className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                    >
                      {busyId === r.id
                        ? t("interactions.loading")
                        : isWish
                          ? t("interactions.choose_helper_btn", "Choose")
                          : t("interactions.select_btn")}
                    </Button>
                  )}
                  {r.status === "not_selected" && !isWish && (
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      {t("interactions.not_selected_badge")}
                    </span>
                  )}
                </div>
              </div>

              {/* Helper note for wishes — visible to the wisher and to
                  the helper themselves so they remember what they offered. */}
              {isWish && r.note && (isOwner || currentUserId === r.user_id) && (
                <div className="ml-9 text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded px-2 py-1 italic">
                  “{r.note}”
                </div>
              )}
            </div>
          ))}

          <div ref={sentinelRef} className="h-3" />

          {loadingMore && (
            <div className="py-2 text-center">
              <div className="animate-spin inline-block h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="text-center text-xs text-destructive py-2">
              {t("common.unable_to_load_list", "Could not load list")}
            </div>
          )}
        </div>
      )}

      {isOwner && rows.some((r) => r.status === "pending") && !rows.some((r) => r.status === "selected") && (
        <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
          {t("interactions.unlock_messaging")}
        </p>
      )}

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("interactions.confirm_selection")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("interactions.confirm_selection_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("interactions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId !== null && handleSelect(confirmId)}
            >
              {t("interactions.confirm_selection_btn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={withdrawId !== null}
        onOpenChange={(o) => !o && setWithdrawId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("interactions.withdraw_selection_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("interactions.withdraw_selection_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("interactions.withdraw_selection_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdraw}>
              {t("interactions.withdraw_selection_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
