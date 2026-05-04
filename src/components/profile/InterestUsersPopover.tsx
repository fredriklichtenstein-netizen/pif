import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { Heart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrustIndicator } from "./interest/TrustIndicator";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_INTERESTED_USERS } from "@/data/mockProfiles";
import { useDemoSelectionsStore } from "@/stores/demoSelectionsStore";
import { useDemoRatingsStore } from "@/stores/demoRatingsStore";
import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InterestUsersPopoverProps {
  itemId: number | string;
  itemOwnerId: string;
}

export function InterestUsersPopover({ itemId, itemOwnerId }: InterestUsersPopoverProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("sv") ? sv : enUS;
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawTargetId, setWithdrawTargetId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectingInterestId, setSelectingInterestId] = useState<number | null>(null);
  const { selectUser: demoSelectUser, unselectUser: demoUnselectUser, getSelectedUser, hasSelection } = useDemoSelectionsStore();

  useEffect(() => {
    const getCurrentUser = async () => {
      if (DEMO_MODE) { setCurrentUser("demo-user-id"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    if (DEMO_MODE) {
      const selectedUserId = getSelectedUser(itemId);
      const mockUsers = MOCK_INTERESTED_USERS.map((u) => ({
        ...u, status: selectedUserId === u.user_id ? "selected" : selectedUserId ? "not_selected" : "pending",
      }));
      setUsers(mockUsers); setLoading(false); return;
    }
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { data, error } = await supabase
        .from("interests")
        .select("*, profiles:user_id(id, first_name, last_name, avatar_url)")
        .eq("item_id", numericId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Normalize: expose profile data under `users` for backward compat with this view.
      const normalized = (data || []).map((row: any) => ({ ...row, users: row.profiles }));
      setUsers(normalized);
    } catch (err) {
      console.error("Error fetching interested users:", err);
      toast({ variant: "destructive", title: t('interactions.error_title'), description: t('interactions.error_load_interested') });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!itemId) return; fetchInterests(); }, [itemId]);

  const handleSelectReceiver = async (interestId: number, userId: string, displayName: string) => {
    setConfirmDialogOpen(false);
    if (selectingInterestId !== null) return;
    setSelectingInterestId(interestId);
    if (DEMO_MODE) {
      demoSelectUser(itemId, userId); fetchInterests();
      toast({
        title: t('interactions.receiver_selected'),
        description: t('interactions.receiver_selected_with_name', { name: displayName }),
      });
      setSelectingInterestId(null);
      return;
    }
    try {
      const numericItemId = typeof itemId === 'string' ? parseInt(itemId as string, 10) : itemId;
      const { data: conversationId, error } = await (supabase.rpc as any)('select_receiver', {
        p_item_id: numericItemId,
        p_receiver_id: userId,
      });
      if (error) throw error;

      // Optimistically update local interest status so the UI reflects the choice immediately.
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          status: u.id === interestId ? 'selected' : 'not_selected',
        })),
      );

      toast({
        title: t('interactions.receiver_selected'),
        description: t('interactions.receiver_selected_with_name', { name: displayName }),
      });

      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}`);
      }
    } catch (err) {
      console.error("Error selecting receiver:", err);
      toast({ variant: "destructive", title: t('interactions.error_title'), description: t('interactions.error_select_receiver') });
    } finally {
      setSelectingInterestId(null);
    }
  };

  const handleWithdrawSelection = async () => {
    setWithdrawDialogOpen(false);
    const targetId = withdrawTargetId;
    setWithdrawTargetId(null);
    if (targetId === null) return;

    if (DEMO_MODE) {
      demoUnselectUser(itemId);
      fetchInterests();
      toast({
        title: t('interactions.selection_withdrawn'),
        description: t('interactions.selection_withdrawn_description'),
      });
      return;
    }
    try {
      const numericItemId = typeof itemId === 'string' ? parseInt(itemId as string, 10) : itemId;
      // Reset the previously selected receiver and any siblings back to pending
      // so the piffer can pick a different person without losing prior interest signals.
      await supabase
        .from("interests")
        .update({ status: "pending", selected_at: null } as any)
        .eq("item_id", numericItemId);
      fetchInterests();
      toast({
        title: t('interactions.selection_withdrawn'),
        description: t('interactions.selection_withdrawn_description'),
      });
    } catch (err) {
      console.error("Error withdrawing selection:", err);
      toast({
        variant: "destructive",
        title: t('interactions.error_title'),
        description: t('interactions.error_withdraw_selection'),
      });
    }
  };

  if (loading) return <div className="text-xs py-1 text-muted-foreground">{t('interactions.loading')}</div>;
  if (users.length === 0) return null;

  const getInterestText = () => {
    if (users.length === 0) return "";
    const name1 = users[0].users.first_name || t('interactions.interested');
    if (users.length === 1) return t('interactions.someone_interested', { name: name1 });
    if (users.length === 2) {
      const name2 = users[1].users.first_name || t('interactions.interested');
      return t('interactions.two_interested', { name1, name2 });
    }
    return t('interactions.many_interested', { name: name1, count: users.length - 1 });
  };

  const isOwner = currentUser === itemOwnerId;
  const hasSelectedUser = hasSelection(itemId);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-2">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <span className="hover:underline">{getInterestText()}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <div className="font-bold text-sm mb-2">
            {isOwner ? t('interactions.choose_receiver') : t('interactions.interested_users')}
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-all">
                <Link to={`/user/${u.user_id}`} className="flex items-center gap-2 hover:underline" target="_blank" rel="noopener noreferrer">
                  <AvatarImage src={u.users?.avatar_url} size={28} alt={u.users?.first_name || "User"} />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">{u.users?.first_name} {u.users?.last_name?.[0] || ""}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(u.created_at), "d MMM HH:mm", { locale: dateLocale })}</span>
                  </div>
                </Link>
                {isOwner && u.status === "pending" && (() => {
                  // In Demo Mode overlay live ratings on top of the seeded mock reliability
                  // so a freshly recorded rating is reflected on the next selection view.
                  const live = DEMO_MODE && u.user_id
                    ? useDemoRatingsStore.getState().getReliability(u.user_id)
                    : null;
                  const score = live && (live.completed_pifs + live.no_shows) > 0
                    ? live.reliability_score
                    : u.users?.reliability_score;
                  const completed = live && (live.completed_pifs + live.no_shows) > 0
                    ? live.completed_pifs
                    : u.users?.completed_pifs;
                  const noShows = live && (live.completed_pifs + live.no_shows) > 0
                    ? live.no_shows
                    : u.users?.no_shows;
                  return (
                    <TrustIndicator reliabilityScore={score} completedPifs={completed} noShows={noShows} compact />
                  );
                })()}
                <div className="ml-auto flex items-center gap-2">
                  {u.status === "selected" && (
                    <>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">{t('interactions.selected_badge')}</span>
                      <Button size="sm" variant="outline" className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                        onClick={() => { toast({ title: t('interactions.messaging_coming_soon'), description: t('interactions.messaging_coming_soon_description') }); }}>
                        <MessageCircle className="h-3 w-3 mr-1" />{t('interactions.message_btn')}
                      </Button>
                      {isOwner && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1 px-2 h-auto whitespace-nowrap text-destructive hover:text-destructive"
                          onClick={() => { setWithdrawTargetId(u.id); setWithdrawDialogOpen(true); }}
                          aria-label={t('interactions.withdraw_selection_aria')}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />{t('interactions.withdraw_selection_btn')}
                        </Button>
                      )}
                    </>
                  )}
                  {u.status === "pending" && isOwner && (
                    <Button
                      size="sm"
                      disabled={selectingInterestId !== null}
                      onClick={() => { setSelectedUserId(u.id); setConfirmDialogOpen(true); }}
                      className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                    >
                      {selectingInterestId === u.id ? t('interactions.loading') : t('interactions.select_btn')}
                    </Button>
                  )}
                  {u.status === "not_selected" && (
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs whitespace-nowrap">{t('interactions.not_selected_badge')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {!hasSelectedUser && isOwner && (
            <p className="text-xs text-muted-foreground mt-3 border-t pt-2">{t('interactions.unlock_messaging')}</p>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('interactions.confirm_selection')}</AlertDialogTitle>
            <AlertDialogDescription>{t('interactions.confirm_selection_description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('interactions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { const user = users.find((u) => u.id === selectedUserId); if (user) handleSelectReceiver(selectedUserId!, user.user_id, user.users?.first_name || t('interactions.interested')); }}>
              {t('interactions.confirm_selection_btn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('interactions.withdraw_selection_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('interactions.withdraw_selection_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWithdrawTargetId(null)}>
              {t('interactions.withdraw_selection_cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleWithdrawSelection}>
              {t('interactions.withdraw_selection_confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
