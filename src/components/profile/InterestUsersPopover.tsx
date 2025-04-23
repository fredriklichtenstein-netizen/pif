
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

export function InterestUsersPopover({ itemId }: { itemId: number }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleSelectReceiver = async (interestId: number, approved: boolean) => {
    try {
      if (approved) {
        await supabase
          .from("interests")
          .update({ status: "selected", selected_at: new Date().toISOString() })
          .eq("id", interestId);
          
        await supabase
          .from("interests")
          .update({ status: "not_selected" })
          .eq("item_id", itemId)
          .neq("id", interestId);
      } else {
        await supabase
          .from("interests")
          .update({ status: "rejected" })
          .eq("id", interestId);
      }
        
      fetchInterests();
      toast({
        title: "Success",
        description: approved ? "Receiver has been selected" : "Interest has been rejected",
      });
    } catch (err) {
      console.error("Error managing interest:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update interest status",
      });
    }
  };

  if (loading) {
    return <div className="text-xs py-2 text-gray-400">Loading interested users...</div>;
  }
  
  if (users.length === 0) {
    return <div className="text-xs py-2 text-gray-400">No interests yet.</div>;
  }

  return (
    <Card className="p-4 bg-blue-50 mt-2">
      <div className="font-bold text-sm mb-4">Interested Users</div>
      <div className="flex flex-col gap-4">
        {users.map((u) => (
          <div key={u.id} className="flex flex-col gap-2 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <Link 
                to={`/user/${u.user_id}`}
                className="flex items-center gap-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <AvatarImage 
                  src={u.users?.avatar_url} 
                  size={32} 
                  alt={u.users?.first_name || "User"} 
                />
                <span className="text-sm font-medium">{u.users?.first_name} {u.users?.last_name?.[0] || ""}</span>
              </Link>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {format(new Date(u.created_at), "MMM d, yyyy HH:mm")}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {u.status === "selected" ? (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  Selected
                </span>
              ) : u.status === "rejected" ? (
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                  Rejected
                </span>
              ) : u.status === "not_selected" ? (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                  Not Selected
                </span>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleSelectReceiver(u.id, true)}
                  >
                    <Check className="h-4 w-4" />
                    Select
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleSelectReceiver(u.id, false)}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
