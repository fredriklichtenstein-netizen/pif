import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { UserMinus, MessageCircle, Sparkles, CheckCircle2 } from "lucide-react";
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
import { useDemoRatingsStore } from "@/stores/demoRatingsStore";
import { PifferRatingDialog } from "@/components/profile/completion/PifferRatingDialog";

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
  /** Helper currently being rated via the per-helper "Mark as granted" flow. */
  const [ratingHelper, setRatingHelper] = useState<{
    helperId: string;
    helperName: string;
  } | null>(null);
  /** Helper user_ids the wisher has already rated for this item. */
  const [ratedHelperIds, setRatedHelperIds] = useState<Set<string>>(new Set());

  const demoRatings = useDemoRatingsStore();

  const offsetRef = useRef(0);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const demoSelections = useDemoSelectionsStore();

  const numericItemId =
    typeof itemId === "number" ? itemId : parseInt(itemId as string, 10);

  useEffect(() => {
    console.log("[InterestSelectionList] mounted; fetching fresh interest rows", {
      itemId,
      numericItemId,
      isOwner,
      currentUserId,
    });
    // This effect intentionally logs only the mount created by the popover key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.log("[InterestSelectionList] fetch start", {
        itemId,
        numericItemId,
        initial,
        offset: initial ? 0 : offsetRef.current,
      });
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
        console.log("[InterestSelectionList] fetch success", {
          itemId,
          numericItemId,
          initial,
          rowCount: slice.length,
          statuses: slice.map((r) => ({ id: r.id, user_id: r.user_id, status: r.status })),
        });
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
    [hasMore, itemId, loadDemo, numericItemId]
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

  // Realtime: refresh on any change to interests for this item. DELETE
  // events (e.g. when withdraw_pif removes the selected interest row)
  // are also applied optimistically so the chosen-receiver row
  // disappears immediately — the debounced reload then reconciles
  // statuses for the remaining interested users.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!itemId) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeItemTable(itemId, "interests", (payload) => {
      if (payload?.eventType === "DELETE" && payload?.old?.id != null) {
        const deletedId = payload.old.id;
        setRows((prev) =>
          prev
            .filter((r) => r.id !== deletedId)
            .map((r) =>
              r.status === "not_selected" ? { ...r, status: "pending" } : r,
            ),
        );
      }
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

  // Wisher-only: keep track of which helpers we've already rated so we
  // can swap the "Mark as granted" CTA for a "Granted ✓" badge and
  // avoid asking again. Cheap query (filtered by item + current user).
  const reloadRatedHelpers = useCallback(async () => {
    if (!isWish || !isOwner || !currentUserId) return;
    if (DEMO_MODE) {
      const set = new Set<string>();
      for (const r of demoRatings.ratings) {
        if (
          String(r.itemId) === String(itemId) &&
          r.raterId === currentUserId
        ) {
          set.add(r.rateeId);
        }
      }
      setRatedHelperIds(set);
      return;
    }
    if (isNaN(numericItemId)) return;
    try {
      const { data, error: rerr } = await (supabase
        .from("ratings") as any)
        .select("ratee_id")
        .eq("item_id", numericItemId)
        .eq("rater_id", currentUserId);
      if (rerr) throw rerr;
      const set = new Set<string>();
      for (const row of (data || []) as Array<{ ratee_id: string }>) {
        set.add(row.ratee_id);
      }
      setRatedHelperIds(set);
    } catch (e) {
      console.warn("[InterestSelectionList] load my ratings failed", e);
    }
  }, [isWish, isOwner, currentUserId, numericItemId, itemId, demoRatings.ratings]);

  useEffect(() => {
    reloadRatedHelpers();
  }, [reloadRatedHelpers]);


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
        ? {
            p_item_id: numericItemId,
            p_helper_id: row.user_id,
            // Pass the note so the RPC can idempotently seed the first
            // message inside a single transaction. The RPC guards
            // against duplicate seeds, so re-selecting the same helper
            // never inserts the note twice.
            p_note: row.note ?? null,
          }
        : { p_item_id: numericItemId, p_receiver_id: row.user_id };
      const { data: conversationId, error: rpcError } = await (supabase.rpc as any)(
        rpcName,
        rpcArgs,
      );
      if (rpcError) throw rpcError;

      // Fan-out notifications to the chosen user AND every other
      // interested/offering user so they know the slot was filled.
      try {
        const { error: notifyErr } = await (supabase.rpc as any)(
          "notify_item_interest_event",
          {
            p_item_id: numericItemId,
            p_event: isWish ? "helper_selected" : "receiver_selected",
            p_selected_user_id: row.user_id,
          },
        );
        if (notifyErr) console.warn("notify_item_interest_event failed", notifyErr);
      } catch (notifyErr) {
        console.warn("notify_item_interest_event threw", notifyErr);
      }
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

      // Self-notification for the piffer: confirms the selection in the
      // notifications inbox and links back to the unlocked conversation.
      if (currentUserId) {
        try {
          const { data: itemRow } = await (supabase
            .from("items") as any)
            .select("title")
            .eq("id", numericItemId)
            .maybeSingle();
          const itemTitle: string | null = itemRow?.title ?? null;
          const receiverName = displayName(row);
          const titleText = isWish
            ? `Du har valt ${receiverName} som hjälpare${itemTitle ? ` för "${itemTitle}"` : ""}.`
            : `Du har valt ${receiverName} som mottagare${itemTitle ? ` för "${itemTitle}"` : ""}.`;
          const actionUrl = conversationId
            ? `/messages?conversation=${conversationId}`
            : `/messages?item=${numericItemId}`;
          await (supabase.from("notifications") as any).insert({
            user_id: currentUserId,
            type: "selection_made",
            read: false,
            action_url: actionUrl,
            reference_id: String(numericItemId),
            reference_type: "item",
            payload: {
              actor_id: row.user_id,
              actor_name: receiverName,
              item_id: numericItemId,
              item_title: itemTitle,
              conversation_id: conversationId ?? null,
              title: titleText,
            },
          });
        } catch (notifErr) {
          console.warn("[InterestSelectionList] self-notification insert failed", notifErr);
        }
      }
      // Note: the wish-helper RPC seeds the helper's note as the first
      // message inside the same transaction, guarded so repeated calls
      // never insert duplicates. We intentionally do NOT insert from
      // the client here anymore — that path created a duplicate seed
      // every time the wisher re-clicked "Select".
      toast({
        title: isWish
          ? t("interactions.helper_selected", "Helper added")
          : t("interactions.receiver_selected"),
        description: isWish
          ? t(
              "interactions.helper_selected_keep_choosing",
              "{{name}} can now message you. You can keep choosing more helpers.",
              { name: displayName(row) }
            )
          : t("interactions.receiver_selected_with_name", {
              name: displayName(row),
            }),
      });
      // Pifs are single-receiver: close + jump to the unlocked thread.
      // Wishes can have many helpers, so we keep the popup open so the
      // wisher can keep selecting. They can open the conversation from
      // the inline "Message" button next to each chosen helper.
      if (!isWish) {
        setShowPopup(false);
        if (conversationId) {
          navigate(`/messages?conversation=${conversationId}`);
        } else {
          navigate(`/messages`);
        }
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

  const openConversationWith = useCallback(
    async (helperUserId: string) => {
      if (DEMO_MODE) {
        setShowPopup(false);
        navigate(`/messages`);
        return;
      }
      try {
        const { data, error: convErr } = await (supabase
          .from("conversations") as any)
          .select("id")
          .eq("item_id", numericItemId)
          .or(
            `and(user1_id.eq.${itemOwnerId},user2_id.eq.${helperUserId}),and(user1_id.eq.${helperUserId},user2_id.eq.${itemOwnerId})`
          )
          .limit(1)
          .maybeSingle();
        if (convErr) throw convErr;
        setShowPopup(false);
        if (data?.id) navigate(`/messages?conversation=${data.id}`);
        else navigate(`/messages`);
      } catch (e) {
        console.warn("[InterestSelectionList] open conversation failed", e);
        setShowPopup(false);
        navigate(`/messages`);
      }
    },
    [itemOwnerId, navigate, numericItemId, setShowPopup]
  );
  const handleWithdraw = async () => {
    const targetId = withdrawId;
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
      // withdraw_pif removes the selected interest row from the DB and
      // reopens the pif for everyone else. Use the RPC (instead of a
      // direct update) so the server-side rules + notifications run.
      const { error } = await (supabase.rpc as any)("withdraw_pif", {
        p_item_id: numericItemId,
        p_action: "reopen",
      });
      if (error) throw error;
      // Optimistically remove the withdrawn row and reset siblings back
      // to pending so the popup reflects the new state immediately,
      // without waiting for the realtime DELETE event to arrive.
      setRows((prev) =>
        prev
          .filter((r) => (targetId != null ? r.id !== targetId : r.status !== "selected"))
          .map((r) => ({ ...r, status: "pending" })),
      );
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

  // Fulfiller perspective (non-owner who has offered to fulfil a wish):
  // collapse the popup to ONLY their own offering with a single "Ångra"
  // (withdraw) button. Owner-only management controls (Vald,
  // Markera som uppfylld, Meddelande, trust indicators) must never be
  // shown to non-owners.
  const isFulfillerView =
    !isOwner && isWish && !!currentUserId &&
    rows.some((r) => r.user_id === currentUserId);

  const handleWithdrawOwnOffer = async () => {
    if (!currentUserId) return;
    try {
      if (DEMO_MODE) {
        setRows((prev) => prev.filter((r) => r.user_id !== currentUserId));
      } else {
        const { error } = await supabase
          .from("interests")
          .delete()
          .eq("item_id", numericItemId)
          .eq("user_id", currentUserId);
        if (error) throw error;
      }
      toast({
        title: t("interactions.selection_withdrawn"),
      });
      setShowPopup(false);
    } catch (e) {
      console.error("[InterestSelectionList] withdraw own offer failed", e);
      toast({
        variant: "destructive",
        title: t("interactions.error_title"),
        description: t("interactions.error_withdraw_selection"),
      });
    }
  };

  if (isFulfillerView) {
    const own = rows.find((r) => r.user_id === currentUserId)!;
    return (
      <div className="max-h-[340px] overflow-y-auto">
        <div className="flex justify-between items-center mb-2 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-sm">
            {t("interactions.wish_offering_self_title", "Du erbjuder dig att uppfylla denna önskan")}
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
        <div className="flex flex-col gap-1 p-2 rounded">
          <div className="flex items-center gap-2">
            <AvatarImage
              src={own.profile?.avatar_url || ""}
              size={28}
              alt={displayName(own)}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium truncate">
                {displayName(own)}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(own.created_at), "d MMM HH:mm", { locale: dateLocale })}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs py-1 px-2 h-auto whitespace-nowrap text-destructive hover:text-destructive"
              onClick={handleWithdrawOwnOffer}
            >
              <UserMinus className="h-3 w-3 mr-1" />
              {t("interactions.withdraw_offer_btn", "Ångra")}
            </Button>
          </div>
          {own.note && (
            <div className="ml-9 text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded px-2 py-1 italic">
              “{own.note}”
            </div>
          )}
        </div>
      </div>
    );
  }

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
                      {isWish && ratedHelperIds.has(r.user_id) ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs whitespace-nowrap inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("interactions.helper_granted_badge", "Granted")}
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                          {isWish
                            ? t("interactions.helper_chosen_badge", "Chosen")
                            : t("interactions.selected_badge")}
                        </span>
                      )}
                      {isOwner && isWish && !ratedHelperIds.has(r.user_id) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto whitespace-nowrap text-amber-700 border-amber-200 hover:bg-amber-50"
                          onClick={() =>
                            setRatingHelper({
                              helperId: r.user_id,
                              helperName: displayName(r),
                            })
                          }
                          aria-label={t(
                            "interactions.mark_wish_granted_btn",
                            "Mark as granted"
                          )}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {t("interactions.mark_wish_granted_btn", "Mark as granted")}
                        </Button>
                      )}
                      {isOwner && isWish && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                          onClick={() => openConversationWith(r.user_id)}
                          aria-label={t("interactions.message_btn")}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {t("interactions.message_btn")}
                        </Button>
                      )}
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

      {isOwner && rows.some((r) => r.status === "pending") &&
        (isWish || !rows.some((r) => r.status === "selected")) && (
          <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
            {isWish
              ? t(
                  "interactions.unlock_messaging_wish",
                  "Choose one or more helpers to start a conversation. You can add more anytime."
                )
              : t("interactions.unlock_messaging")}
          </p>
        )}

      <AlertDialog
        open={confirmId !== null}
        onOpenChange={(o) => !o && setConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isWish
                ? t("interactions.confirm_helper", "Choose this helper?")
                : t("interactions.confirm_selection")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isWish
                ? t(
                    "interactions.confirm_helper_description",
                    "We'll open a private conversation and share their note with you to get things started."
                  )
                : t("interactions.confirm_selection_description")}
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

      {ratingHelper && (
        <PifferRatingDialog
          open={!!ratingHelper}
          onOpenChange={(o) => !o && setRatingHelper(null)}
          itemId={itemId}
          receiverName={ratingHelper.helperName}
          helperId={ratingHelper.helperId}
          demoRaterId={currentUserId}
          demoRateeId={ratingHelper.helperId}
          onSubmitted={() => {
            setRatingHelper(null);
            reloadRatedHelpers();
          }}
        />
      )}
    </div>
  );
}
