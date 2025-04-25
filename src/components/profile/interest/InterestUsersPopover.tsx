
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { InterestUserItem } from "./InterestUserItem";
import { InterestSelectionDialog } from "./InterestSelectionDialog";
import { useInterestSelection } from "@/hooks/interest/useInterestSelection";

interface InterestUsersPopoverProps {
  itemId: number;
  itemOwnerId: string;
}

export function InterestUsersPopover({ itemId, itemOwnerId }: InterestUsersPopoverProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  const {
    selectedUserId,
    setSelectedUserId,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleSelectReceiver
  } = useInterestSelection();

  const isOwner = currentUser === itemOwnerId;

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interests")
        .select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching interested users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemId) return;
    fetchInterests();
  }, [itemId]);

  const getInterestText = () => {
    if (users.length === 0) return "";
    if (users.length === 1) {
      return `${users[0].users.first_name || 'Someone'} is interested`;
    }
    if (users.length === 2) {
      return `${users[0].users.first_name || 'Someone'} and ${users[1].users.first_name || 'someone else'} are interested`;
    }
    return `${users[0].users.first_name || 'Someone'} and ${users.length - 1} others are interested`;
  };

  if (users.length === 0) {
    return null;
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mt-2">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <span className="hover:underline">{getInterestText()}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="start">
          <div className="font-bold text-sm mb-2">Interested Users</div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {users.map((user) => (
              <InterestUserItem
                key={user.id}
                user={user}
                isOwner={isOwner}
                onSelect={() => {
                  setSelectedUserId(user.id);
                  setConfirmDialogOpen(true);
                }}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <InterestSelectionDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={async () => {
          if (selectedUserId) {
            const success = await handleSelectReceiver(selectedUserId, itemId);
            if (success) {
              fetchInterests();
            }
          }
        }}
      />
    </>
  );
}
