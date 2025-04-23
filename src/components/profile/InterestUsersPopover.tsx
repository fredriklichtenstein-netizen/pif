import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Heart } from "lucide-react";
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

export function InterestUsersPopover({ itemId }: { itemId: number }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

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

  const handleSelectReceiver = async (interestId: number) => {
    setConfirmDialogOpen(false);
    try {
      await supabase
        .from("interests")
        .update({ status: "selected", selected_at: new Date().toISOString() })
        .eq("id", interestId);
        
      await supabase
        .from("interests")
        .update({ status: "not_selected" })
        .eq("item_id", itemId)
        .neq("id", interestId);
        
      fetchInterests();
      toast({
        title: "Success",
        description: "Receiver has been selected",
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
    return <div className="text-xs py-1 text-gray-400">Loading...</div>;
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
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-all">
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
                    <span className="text-xs text-gray-500">
                      {format(new Date(u.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  {u.status === "selected" && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      Selected
                    </span>
                  )}
                  {u.status === "pending" && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setConfirmDialogOpen(true);
                      }} 
                      className="text-xs py-1 px-2 h-auto whitespace-nowrap"
                    >
                      I Choose You
                    </Button>
                  )}
                  {u.status === "not_selected" && (
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                      Not Selected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pif to this user?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUserId && handleSelectReceiver(selectedUserId)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
