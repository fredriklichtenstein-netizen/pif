import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Heart, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrustIndicator } from "./interest/TrustIndicator";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_INTERESTED_USERS } from "@/data/mockProfiles";
import { useDemoSelectionsStore } from "@/stores/demoSelectionsStore";

interface InterestUsersPopoverProps {
  itemId: number | string;
  itemOwnerId: string;
}

export function InterestUsersPopover({ itemId, itemOwnerId }: InterestUsersPopoverProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  
  // Demo mode selection store
  const { selectUser: demoSelectUser, getSelectedUser, hasSelection } = useDemoSelectionsStore();

  useEffect(() => {
    const getCurrentUser = async () => {
      if (DEMO_MODE) {
        setCurrentUser("demo-user-id");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const fetchInterests = async () => {
    setLoading(true);
    
    // Demo mode: use mock data with selection state
    if (DEMO_MODE) {
      const selectedUserId = getSelectedUser(itemId);
      const mockUsers = MOCK_INTERESTED_USERS.map((u) => ({
        ...u,
        status: selectedUserId === u.user_id 
          ? "selected" 
          : selectedUserId 
            ? "not_selected" 
            : "pending",
      }));
      setUsers(mockUsers);
      setLoading(false);
      return;
    }
    
    try {
      const numericId = typeof itemId === 'string' ? parseInt(itemId, 10) : itemId;
      const { data, error } = await supabase
        .from("interests")
        .select("id,user_id,status,message,created_at,users:profiles!interests_user_id_fkey(*)")
        .eq("item_id", numericId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching interested users:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load interested users",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemId) return;
    fetchInterests();
  }, [itemId]);

  const handleSelectReceiver = async (interestId: number, userId: string) => {
    setConfirmDialogOpen(false);
    
    // Demo mode: use local store
    if (DEMO_MODE) {
      demoSelectUser(itemId, userId);
      fetchInterests();
      toast({
        title: "Receiver selected!",
        description: "You can now message this person to coordinate pickup.",
      });
      return;
    }
    
    try {
      await supabase
        .from("interests")
        .update({ status: "selected", selected_at: new Date().toISOString() })
        .eq("id", interestId);
        
      await supabase
        .from("interests")
        .update({ status: "not_selected" })
        .eq("item_id", typeof itemId === 'string' ? parseInt(itemId as string, 10) : itemId)
        .neq("id", interestId);
        
      fetchInterests();
      toast({
        title: "Receiver selected!",
        description: "You can now message this person to coordinate pickup.",
      });
    } catch (err) {
      console.error("Error selecting receiver:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to select receiver",
      });
    }
  };

  if (loading) {
    return <div className="text-xs py-1 text-muted-foreground">Loading...</div>;
  }
  
  if (users.length === 0) {
    return null;
  }

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
            {isOwner ? "Choose a receiver" : "Interested Users"}
          </div>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-all">
                <Link 
                  to={`/user/${u.user_id}`}
                  className="flex items-center gap-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AvatarImage 
                    src={u.users?.avatar_url} 
                    size={28} 
                    alt={u.users?.first_name || "User"} 
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {u.users?.first_name} {u.users?.last_name?.[0] || ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(u.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </Link>
                
                {/* Trust indicator - only shown to owner during selection */}
                {isOwner && u.status === "pending" && (
                  <TrustIndicator
                    reliabilityScore={u.users?.reliability_score}
                    completedPifs={u.users?.completed_pifs}
                    noShows={u.users?.no_shows}
                    compact
                  />
                )}
                
                <div className="ml-auto flex items-center gap-2">
                  {u.status === "selected" && (
                    <>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                        Selected
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                        onClick={() => {
                          toast({
                            title: "Messaging coming soon",
                            description: "Direct messaging will be available in the next update.",
                          });
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Message
                      </Button>
                    </>
                  )}
                  {u.status === "pending" && isOwner && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setConfirmDialogOpen(true);
                      }} 
                      className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                    >
                      Select
                    </Button>
                  )}
                  {u.status === "not_selected" && (
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      Not Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Message gate info */}
          {!hasSelectedUser && isOwner && (
            <p className="text-xs text-muted-foreground mt-3 border-t pt-2">
              Select a receiver to unlock messaging
            </p>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pif to this user? They will be notified and you'll be able to message them to coordinate pickup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                const user = users.find((u) => u.id === selectedUserId);
                if (user) {
                  handleSelectReceiver(selectedUserId!, user.user_id);
                }
              }}
            >
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
