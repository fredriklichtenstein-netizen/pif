import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
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
import { UserMinus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InterestUsersPopoverProps {
  itemId: number | string;
  itemOwnerId: string;
}

export function InterestUsersPopover({ itemId, itemOwnerId }: InterestUsersPopoverProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawTargetId, setWithdrawTargetId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
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
        .from("interests").select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
        .eq("item_id", numericId).order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching interested users:", err);
      toast({ variant: "destructive", title: t('interactions.error_title'), description: t('interactions.error_load_interested') });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!itemId) return; fetchInterests(); }, [itemId]);

  const handleSelectReceiver = async (interestId: number, userId: string) => {
    setConfirmDialogOpen(false);
    if (DEMO_MODE) {
      demoSelectUser(itemId, userId); fetchInterests();
      toast({ title: t('interactions.receiver_selected'), description: t('interactions.receiver_selected_description') });
      return;
    }
    try {
      await supabase.from("interests").update({ status: "selected", selected_at: new Date().toISOString() }).eq("id", interestId);
      await supabase.from("interests").update({ status: "not_selected" }).eq("item_id", typeof itemId === 'string' ? parseInt(itemId as string, 10) : itemId).neq("id", interestId);
      fetchInterests();
      toast({ title: t('interactions.receiver_selected'), description: t('interactions.receiver_selected_description') });
    } catch (err) {
      console.error("Error selecting receiver:", err);
      toast({ variant: "destructive", title: t('interactions.error_title'), description: t('interactions.error_select_receiver') });
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
                    <span className="text-xs text-muted-foreground">{format(new Date(u.created_at), "MMM d, HH:mm")}</span>
                  </div>
                </Link>
                {isOwner && u.status === "pending" && (
                  <TrustIndicator reliabilityScore={u.users?.reliability_score} completedPifs={u.users?.completed_pifs} noShows={u.users?.no_shows} compact />
                )}
                <div className="ml-auto flex items-center gap-2">
                  {u.status === "selected" && (
                    <>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">{t('interactions.selected_badge')}</span>
                      <Button size="sm" variant="outline" className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                        onClick={() => { toast({ title: t('interactions.messaging_coming_soon'), description: t('interactions.messaging_coming_soon_description') }); }}>
                        <MessageCircle className="h-3 w-3 mr-1" />{t('interactions.message_btn')}
                      </Button>
                    </>
                  )}
                  {u.status === "pending" && isOwner && (
                    <Button size="sm" onClick={() => { setSelectedUserId(u.id); setConfirmDialogOpen(true); }} className="text-xs py-1 px-2 h-auto whitespace-nowrap">
                      {t('interactions.select_btn')}
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
            <AlertDialogAction onClick={() => { const user = users.find((u) => u.id === selectedUserId); if (user) handleSelectReceiver(selectedUserId!, user.user_id); }}>
              {t('interactions.confirm_selection_btn')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
