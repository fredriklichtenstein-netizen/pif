
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { AvatarImage } from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export function InterestUsersPopover({ itemId }: { itemId: number }) {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!itemId) return;
    fetchInterests();
  }, [itemId]);

  const handleSelectReceiver = async (interestId: number) => {
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
    } catch (err) {
      console.error("Error selecting receiver:", err);
    }
  };

  if (loading) {
    return <div className="text-xs py-2 text-gray-400">Loading interested users...</div>;
  }
  
  if (users.length === 0) {
    return <div className="text-xs py-2 text-gray-400">No interests yet.</div>;
  }

  return (
    <Card className="p-2 bg-blue-50 mt-2">
      <div className="font-bold text-sm mb-2">Interested Users</div>
      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center gap-2">
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
              <span className="text-sm">{u.users?.first_name} {u.users?.last_name?.[0] || ""}</span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {format(new Date(u.created_at), "yyyy-MM-dd HH:mm:ss")}
              </span>
              {u.status === "selected" && (
                <span className="bg-green-100 text-green-700 px-2 rounded text-xs">Receiver</span>
              )}
              {u.status === "pending" && (
                <Button size="sm" onClick={() => handleSelectReceiver(u.id)} className="text-xs py-1 px-2 h-auto">
                  Select as Receiver
                </Button>
              )}
              {u.status === "not_selected" && (
                <span className="bg-gray-200 text-gray-500 px-2 rounded text-xs">Not Selected</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
